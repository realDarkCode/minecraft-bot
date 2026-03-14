const { goals } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');
const { notifyOwner } = require('../lib/common');

module.exports = {
    name: 'give',
    async execute(bot, args, username) {
        let targetName = args[0]?.toLowerCase();
        if (!targetName) return notifyOwner(bot, "Usage: !give <item/all>");

        
        const player = bot.players[username]?.entity;
        if (!player) return notifyOwner(bot, "I can't see you!");
        
        // Move close to the player first
        const distance = bot.entity.position.distanceTo(player.position);
        if (distance > 5) {
            notifyOwner(bot, "Coming closer to give you items...");
            await bot.pathfinder.goto(new goals.GoalNear(player.position.x, player.position.y, player.position.z, 2));
        }

        const items = bot.inventory.items();
        let count = 0;
        
        for (const item of items) {
            if (targetName === 'all' || item.name.includes(targetName)) {
                // Calculate direction vector towards the player
                const currentPlayer = bot.players[username]?.entity;
                if (currentPlayer) {
                    const direction = currentPlayer.position.clone().subtract(bot.entity.position).normalize();
                    const throwForce = 0.5; // Moderate throw force
                    const velocity = direction.scale(throwForce);
                    
                    // Look at the player before throwing
                    await bot.lookAt(currentPlayer.position.offset(0, 1.6, 0));
                    
                    // Throw the item towards the player
                    await bot.toss(item.type, null, item.count, velocity);
                } else {
                    // Fallback to regular toss if player not found
                    await bot.tossStack(item);
                }
                await new Promise(r => setTimeout(r, 300));
                count++;
            }
        }
        
        if (count > 0) {
            notifyOwner(bot, `🎁 Threw ${count} item stack(s) to you!`);
        } else {
            notifyOwner(bot, `❌ No items found matching '${targetName}'`);
        }
    }
};