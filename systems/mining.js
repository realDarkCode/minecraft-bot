const { goals } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');
const { notifyOwner } = require('../lib/common');

/**
 * Advanced Mining Loop with 360-degree Hazard Detection
 * @param {Object} bot - The mineflayer bot instance
 * @param {Object} config - Configuration object from config.js
 */
async function startMiningLoop(bot, config) {
    bot.isMining = true;
    bot.blocksMinedCount = 0;
    let lastNotifiedDiamonds = 0;

    // --- Configuration Constants ---
  
    const milestoneStep = config.diamondMilestone || 5; 
    const dangerousBlocks = ['lava', 'water', 'gravel', 'sand'];
    const fillerBlocks = ['cobblestone', 'dirt', 'stone', 'deepslate', 'andesite', 'diorite', 'granite'];

    notifyOwner(bot, "⛏️ Starting mining loop with Advanced Safety Scan (v2.0).");

    while (bot.isMining) {
        try {
            // --- 1. DIAMOND MILESTONE & INVENTORY CHECK ---
            const currentDiamonds = bot.inventory.items()
                .filter(i => i.name.includes('diamond'))
                .reduce((acc, i) => acc + i.count, 0);

            // Check milestone
            if (currentDiamonds >= lastNotifiedDiamonds + milestoneStep) {
                lastNotifiedDiamonds = Math.floor(currentDiamonds / milestoneStep) * milestoneStep;
                notifyOwner(bot, `💎 Milestone: I have collected ${currentDiamonds} diamonds!`);
            }

            // Check for return conditions
            if (currentDiamonds >= (config.diamondReturnCount || 32) || bot.inventory.emptySlotCount() < 2) {
                notifyOwner(bot, "Target reached or inventory full. Heading to chest.");
                await handleDeposit(bot, config);
                continue; 
            }

            // --- 2. SURVIVAL CHECK (Hunger & Tools) ---
            if (bot.food < 14) {
                const food = bot.inventory.items().find(i => i.name.match(/apple|bread|beef|pork|chicken|carrot/));
                if (food) { 
                    await bot.equip(food, 'hand'); 
                    await bot.consume().catch(() => {}); 
                }
            }

            const pick = bot.inventory.items().find(i => i.name.includes('pickaxe'));
            if (!pick) {
                notifyOwner(bot, "❌ Critical: No pickaxe found. Stopping.");
                bot.isMining = false;
                break;
            }
            await bot.equip(pick, 'hand');

            // --- 3. THE 360° SAFETY SCAN ---
            const currentPos = bot.entity.position.floored();
            const forward = bot.miningDirection; // Expected to be a Vec3 like (1, 0, 0)
            const right = new Vec3(-forward.z, 0, forward.x);
            const left = new Vec3(forward.z, 0, -forward.x);

            // Points to check before every move
            const scanPoints = [
                { pos: currentPos.plus(forward).offset(0, 1, 0), label: 'Forward-Head' },
                { pos: currentPos.plus(forward), label: 'Forward-Feet' },
                { pos: currentPos.plus(forward).offset(0, 2, 0), label: 'Forward-Ceiling' },
                { pos: currentPos.plus(right).offset(0, 1, 0), label: 'Right-Wall' },
                { pos: currentPos.plus(left).offset(0, 1, 0), label: 'Left-Wall' },
                { pos: currentPos.plus(forward).offset(0, -1, 0), label: 'Forward-Floor' }
            ];

            let hazardFound = false;
            for (const point of scanPoints) {
                const block = bot.blockAt(point.pos);
                if (block && dangerousBlocks.includes(block.name)) {
                    notifyOwner(bot, `⚠️ Danger! ${block.name} detected at ${point.label}. Attempting to seal...`);
                    
                    // Attempt to "Plug" the hazard if it's a liquid
                    const filler = bot.inventory.items().find(i => fillerBlocks.includes(i.name));
                    if (filler && (block.name === 'lava' || block.name === 'water')) {
                        await bot.equip(filler, 'hand');
                        try {
                            // Place against the block below the hazard
                            const referenceBlock = bot.blockAt(point.pos.offset(0, -1, 0));
                            await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
                            notifyOwner(bot, `✅ Sealed ${block.name} at ${point.label}.`);
                            continue; // Re-scan after sealing
                        } catch (e) {}
                    }

                    // If we can't seal it, shift the tunnel to the side
                    notifyOwner(bot, "🔄 Hazard unsealable. Shifting tunnel 3 blocks right.");
                    const shiftTarget = currentPos.plus(right.scaled(3));
                    await bot.pathfinder.goto(new goals.GoalNear(shiftTarget.x, shiftTarget.y, shiftTarget.z, 1));
                    hazardFound = true;
                    break;
                }
            }

            if (hazardFound) continue;

            // --- 4. VEIN MINING (Ore Detection) ---
            const targetOres = ['diamond_ore', 'deepslate_diamond_ore', 'iron_ore', 'gold_ore', 'coal_ore', 'raw_iron', 'raw_gold'];
            const ore = bot.findBlock({
                matching: b => targetOres.includes(b.name),
                maxDistance: 4
            });

            if (ore) {
                await bot.pathfinder.goto(new goals.GoalNear(ore.position.x, ore.position.y, ore.position.z, 1));
                await bot.dig(ore);
                continue; 
            }

            // --- 5. STRIP MINING (The Digging) ---
            const headPos = currentPos.plus(forward).offset(0, 1, 0);
            const footPos = currentPos.plus(forward);
            const headBlock = bot.blockAt(headPos);
            const footBlock = bot.blockAt(footPos);

            if (headBlock?.name === 'bedrock' || footBlock?.name === 'bedrock') {
                notifyOwner(bot, "🧱 Bedrock hit. Shifting path.");
                const shift = right.scaled(2);
                await bot.pathfinder.goto(new goals.GoalNear(currentPos.plus(shift).x, currentPos.y, currentPos.plus(shift).z, 1));
                continue;
            }

            // Dig Top then Bottom (Digging top first lets us see fluids early)
            if (headBlock && headBlock.name !== 'air') await bot.dig(headBlock);
            if (footBlock && footBlock.name !== 'air') await bot.dig(footBlock);
            
            // Safety Step: Ensure the ground exists before moving
            const floorNext = bot.blockAt(footPos.offset(0, -1, 0));
            if (!floorNext || floorNext.name === 'air' || floorNext.name === 'lava') {
                const filler = bot.inventory.items().find(i => fillerBlocks.includes(i.name));
                if (filler) {
                    await bot.equip(filler, 'hand');
                    try { await bot.placeBlock(bot.blockAt(currentPos.offset(0, -1, 0)), forward); } catch(e){}
                }
            }

            // Move forward
            await bot.pathfinder.goto(new goals.GoalBlock(footPos.x, footPos.y, footPos.z));

            // --- 6. TORCH PLACEMENT ---
            bot.blocksMinedCount++;
            if (bot.blocksMinedCount >= (config.torchSpacing || 10)) {
                const torch = bot.inventory.items().find(i => i.name.includes('torch'));
                if (torch) {
                    await bot.equip(torch, 'hand');
                    try { 
                        const floor = bot.blockAt(bot.entity.position.offset(0, -1, 0));
                        await bot.placeBlock(floor, new Vec3(0, 1, 0)); 
                    } catch (e) {}
                    bot.blocksMinedCount = 0;
                }
            }

        } catch (err) {
            // Error handling (usually pathfinder path fails or block is broken by something else)
            await new Promise(r => setTimeout(r, 800));
        }
    }
}

/**
 * Handles traveling to a chest and depositing loot
 */
async function handleDeposit(bot, config) {
    if (!bot.chestPos) {
        notifyOwner(bot, "⚠️ No chest position saved! I'm stuck with a full inventory.");
        bot.isMining = false;
        return;
    }
    try {
        await bot.pathfinder.goto(new goals.GoalNear(bot.chestPos.x, bot.chestPos.y, bot.chestPos.z, 2));
        const chestBlock = bot.blockAt(bot.chestPos);
        const chest = await bot.openChest(chestBlock);
        
        for (const item of bot.inventory.items()) {
            // Keep essentials
            if (item.name.includes('pickaxe') || item.name.includes('torch') || item.name.match(/apple|bread|beef|pork|chicken|carrot/)) continue;
            await chest.deposit(item.type, null, item.count);
        }
        await chest.close();
        notifyOwner(bot, "📦 Inventory deposited. Returning to work.");
    } catch (err) {
        notifyOwner(bot, "❌ Deposit Failed: " + err.message);
    }
}

module.exports = { startMiningLoop, handleDeposit };