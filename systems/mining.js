const { goals, Movements } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');
const { notifyOwner } = require('../lib/common');

// Helper to prevent bot crashing from minor dig errors
async function safeDig(bot, block) {
    if (!block || block.name === 'air' || block.name === 'cave_air') return;
    try {
        bot.pathfinder.setGoal(null); // Stop trying to walk while digging
        await bot.lookAt(block.position.offset(0.5, 0.5, 0.5), true); // Look at the block
        await bot.dig(block);
    } catch (err) {
        // Ignore tiny desyncs or "block out of reach" errors
    }
}

async function startMiningLoop(bot, config) {
    bot.isMining = true;
    bot.blocksMinedCount = 0;
    bot.isAdjustingY = false;

    const targetY = config.mineYLevel || -58;
    const milestoneStep = config.diamondMilestone || 5;
    const dangerousBlocks = ['lava', 'water', 'gravel', 'sand', 'pointed_dripstone', 'bedrock'];

    // Fallback: If command didn't set direction, default to East
    if (!bot.miningDirection) bot.miningDirection = new Vec3(1, 0, 0);

    let lastNotifiedDiamonds = 0;

    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    defaultMove.canDig = true;
    defaultMove.allowParkour = false;
    defaultMove.scafoldingBlocks = ['cobblestone', 'dirt', 'netherrack'];
    bot.pathfinder.setMovements(defaultMove);

    notifyOwner(bot, `⛏️ Mining sequence initiated. Target Y-Level: ${targetY}`);

    while (bot.isMining) {
        try {
            const pos = bot.entity.position.floored();
            const currentY = pos.y;
            const forward = bot.miningDirection; // Inherited correctly from mine.js!

            // ---------------------------
            // 0. CRITICAL: EQUIP PICKAXE FIRST
            // ---------------------------
            const pick = bot.inventory.items().find(i => i.name.includes('pickaxe'));
            if (!pick) {
                notifyOwner(bot, "❌ Out of pickaxes! Stopping.");
                bot.isMining = false;
                break;
            }
            await bot.equip(pick, 'hand');

            // ---------------------------
            // 1. SMART STAIRCASE (Y-LEVEL ADJUSTMENT)
            // ---------------------------
            if (currentY !== targetY) {
                if (!bot.isAdjustingY) {
                    notifyOwner(bot, `🪜 Staircasing ${currentY < targetY ? 'up' : 'down'} to Y=${targetY}...`);
                    bot.isAdjustingY = true;
                }

                const yStep = currentY < targetY ? 1 : -1;
                const footPos = pos.plus(forward);
                const nextStepPos = footPos.offset(0, yStep, 0);

                // Pre-calculate blocks so the pathfinder doesn't panic
                const headBlock = bot.blockAt(footPos.offset(0, 1, 0));
                const bodyBlock = bot.blockAt(footPos);

                try {
                    // Manually dig the staircase stairs so pathfinder has a clean walking path
                    if (yStep === -1) { 
                        // Going down: Dig head, body, then the step down
                        await safeDig(bot, headBlock);
                        await safeDig(bot, bodyBlock);
                        await safeDig(bot, bot.blockAt(nextStepPos)); 
                    } else { 
                        // Going up: Dig body, head, then space above head
                        await safeDig(bot, bodyBlock);
                        await safeDig(bot, headBlock);
                        await safeDig(bot, bot.blockAt(footPos.offset(0, 2, 0))); 
                    }

                    // Move cleanly into the newly mined space
                    await bot.pathfinder.goto(new goals.GoalBlock(nextStepPos.x, nextStepPos.y, nextStepPos.z));
                } catch (err) {
                    notifyOwner(bot, "🛑 Obstacle while staircasing. Turning right.");
                    bot.miningDirection = new Vec3(-forward.z, 0, forward.x); // Turn 90 degrees right
                    await new Promise(r => setTimeout(r, 1000));
                }
                continue; 
            } else {
                if (bot.isAdjustingY) {
                    notifyOwner(bot, `✅ Reached target Y=${targetY}. Starting main tunnel.`);
                    bot.isAdjustingY = false;
                }
            }

            // ---------------------------
            // 2. RESOURCE & SURVIVAL CHECKS
            // ---------------------------
            const currentDiamonds = bot.inventory.items()
                .filter(i => i.name.includes('diamond'))
                .reduce((a, i) => a + i.count, 0);

            if (currentDiamonds >= lastNotifiedDiamonds + milestoneStep) {
                lastNotifiedDiamonds = Math.floor(currentDiamonds / milestoneStep) * milestoneStep;
                notifyOwner(bot, `💎 Milestone! I now have ${currentDiamonds} diamonds.`);
            }

            if (currentDiamonds >= (config.diamondReturnCount || 32) || bot.inventory.emptySlotCount() < 2) {
                notifyOwner(bot, "📦 Inventory full or Diamond quota reached! Returning to base.");
                await handleDeposit(bot, config);
                continue;
            }

            // Eat food if hungry
            if (bot.food < 15) {
                const food = bot.inventory.items().find(i => i.foodPoints);
                if (food) {
                    await bot.equip(food, 'hand');
                    try { await bot.consume(); } catch {}
                    await bot.equip(pick, 'hand'); // Re-equip pickaxe
                }
            }

            // ---------------------------
            // 3. ORE DETECTION & MEMORY
            // ---------------------------
            const targetOres = ['diamond_ore', 'deepslate_diamond_ore', 'iron_ore', 'gold_ore'];
            const ore = bot.findBlock({
                matching: b => targetOres.includes(b.name),
                maxDistance: 6
            });

            if (ore) {
                const tunnelAxis = pos.clone(); 
                try {
                    await bot.pathfinder.goto(new goals.GoalNear(ore.position.x, ore.position.y, ore.position.z, 1));
                    await safeDig(bot, ore);
                    await bot.pathfinder.goto(new goals.GoalBlock(tunnelAxis.x, tunnelAxis.y, tunnelAxis.z));
                } catch (err) {
                    await bot.pathfinder.goto(new goals.GoalBlock(tunnelAxis.x, tunnelAxis.y, tunnelAxis.z));
                }
                continue;
            }

            // ---------------------------
            // 4. MAIN STRIP MINING & HAZARDS
            // ---------------------------
            const headPos = pos.plus(forward).offset(0, 1, 0);
            const footPos = pos.plus(forward);

            const headBlock = bot.blockAt(headPos);
            const footBlock = bot.blockAt(footPos);

            const isHazard = (b) => b && dangerousBlocks.includes(b.name);

            if (isHazard(headBlock) || isHazard(footBlock)) {
                notifyOwner(bot, "🛑 Hazard detected ahead (Lava/Water/Bedrock). Turning 90 degrees.");
                bot.miningDirection = new Vec3(-forward.z, 0, forward.x); // Turn 90 degrees right
                continue; 
            }

            await safeDig(bot, headBlock);
            await safeDig(bot, footBlock);

            try {
                await bot.pathfinder.goto(new goals.GoalBlock(footPos.x, footPos.y, footPos.z));
                bot.blocksMinedCount++;
            } catch (err) {
                await new Promise(r => setTimeout(r, 1000));
            }

            // ---------------------------
            // 5. TORCH PLACEMENT
            // ---------------------------
            if (bot.blocksMinedCount >= (config.torchSpacing || 8)) {
                const torch = bot.inventory.items().find(i => i.name.includes('torch'));
                if (torch) {
                    await bot.equip(torch, 'hand');
                    try {
                        const floor = bot.blockAt(bot.entity.position.offset(0, -1, 0));
                        await bot.placeBlock(floor, new Vec3(0, 1, 0));
                    } catch {}
                    await bot.equip(pick, 'hand'); // Immediately get pickaxe back out
                }
                bot.blocksMinedCount = 0;
            }

            await new Promise(r => setTimeout(r, 200));

        } catch (err) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

async function handleDeposit(bot, config) {
    if (!bot.chestPos) {
        notifyOwner(bot, "⚠ Cannot deposit: No chest position saved. Run '!setbase'.");
        bot.isMining = false;
        return;
    }
    try {
        await bot.pathfinder.goto(new goals.GoalNear(bot.chestPos.x, bot.chestPos.y, bot.chestPos.z, 1));
        const chestBlock = bot.blockAt(bot.chestPos);
        const chest = await bot.openChest(chestBlock);

        for (const item of bot.inventory.items()) {
            if (item.name.includes('pickaxe') || item.name.includes('torch') || item.foodPoints || item.name.includes('sword') || item.name.includes('shovel')) continue;
            try {
                await chest.deposit(item.type, null, item.count);
            } catch (err) {} 
        }
        await chest.close();
        notifyOwner(bot, "✅ Items deposited.");
        
        bot.isMining = true;
        notifyOwner(bot, "⛏️ Heading back to the mines!");
        
    } catch(err) {
        notifyOwner(bot, "❌ Deposit sequence failed: " + err.message);
        bot.isMining = false;
    }
}

module.exports = {
    startMiningLoop,
    handleDeposit
};