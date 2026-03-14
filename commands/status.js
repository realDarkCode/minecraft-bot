const { notifyOwner } = require('../lib/common');


   module.exports= {
        name: 'status',
        async execute(bot, args, username) {
            const pos = bot.entity.position;
            const health = Math.round(bot.health);
            const food = Math.round(bot.food);
        const ping = bot.player?.ping ?? bot._client?.socket?.ping ?? 'Unknown';
            
            let state = bot.isMining ? "⛏️ Mining" : 
                       bot.isFishing ? "🎣 Fishing" : 
                       (bot.pathfinder.isMoving() ? "🏃 Moving" : "😴 Idle");

            // Get equipped items
            const mainHand = bot.heldItem ? bot.heldItem.displayName : 'Empty';
            const offHand = bot.inventory.slots[45] ? bot.inventory.slots[45].displayName : 'Empty';
            
            // Check for equipped armor
            const helmet = bot.inventory.slots[5] ? bot.inventory.slots[5].displayName : 'None';
            const chestplate = bot.inventory.slots[6] ? bot.inventory.slots[6].displayName : 'None';
            const leggings = bot.inventory.slots[7] ? bot.inventory.slots[7].displayName : 'None';
            const boots = bot.inventory.slots[8] ? bot.inventory.slots[8].displayName : 'None';
            
            const hasArmor = helmet !== 'None' || chestplate !== 'None' || leggings !== 'None' || boots !== 'None';
            
            const inventorySlots = bot.inventory.emptySlotCount();
            
            notifyOwner(bot, `📊 [STATUS]`);
            notifyOwner(bot, `Health: ${health}/20 | Food: ${food}/20 | Ping: ${ping}ms`);
            notifyOwner(bot, `Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`);
            notifyOwner(bot, `State: ${state} | Empty Slots: ${inventorySlots}`);
            notifyOwner(bot, `Main Hand: ${mainHand} | Off Hand: ${offHand}`);
            if (hasArmor) {
                notifyOwner(bot, `🛡️ Armor: ${helmet !== 'None' ? '⛑️' : ''} ${chestplate !== 'None' ? '🦺' : ''} ${leggings !== 'None' ? '👖' : ''} ${boots !== 'None' ? '👢' : ''}`);
                notifyOwner(bot, `Head: ${helmet} | Chest: ${chestplate}`);
                notifyOwner(bot, `Legs: ${leggings} | Feet: ${boots}`);
            } else {
                notifyOwner(bot, `🛡️ Armor: No armor equipped`);
            }
        }
    }
