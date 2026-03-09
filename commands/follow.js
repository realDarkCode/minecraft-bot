const { goals } = require('mineflayer-pathfinder');
const { notifyOwner } = require('../lib/common');

module.exports = {
    name: 'follow',
    async execute(bot, args, username) {
        const input = args[0]?.toLowerCase();

        // 1. Check if user wants to stop
        if (input === 'stop' ) {
            bot.followTarget = null;
            bot.pathfinder.setGoal(null);
            return notifyOwner(bot, "Stopped following.");
        }

        // 2. Determine who to follow (default to the person who sent the message)
        const targetName = args[0] || username;
        const targetPlayer = bot.players[targetName];

        if (!targetPlayer || !targetPlayer.entity) {
            // If we can't see them, stop following current target to be safe
            bot.followTarget = null;
            bot.pathfinder.setGoal(null);
            return notifyOwner(bot, `I can't see ${targetName}. Stopping movement.`);
        }

        // 3. Execute follow logic
        bot.isMining = false;
        bot.followTarget = targetPlayer.entity;
        
        // GoalFollow(entity, minimum_distance)
        bot.pathfinder.setGoal(new goals.GoalFollow(bot.followTarget, 2), true);
        notifyOwner(bot, `Now following ${targetName}.`);
    }
};