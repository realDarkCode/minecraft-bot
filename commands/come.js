const { goals } = require('mineflayer-pathfinder');
const { notifyOwner } = require('../lib/common');

module.exports = {
    name: 'come',
    async execute(bot, args, username) {
        bot.isMining = false;
        
        if (args.length >= 3) {
            const x = parseInt(args[0]), y = parseInt(args[1]), z = parseInt(args[2]);
            if (isNaN(x) || isNaN(y) || isNaN(z)) return notifyOwner(bot, "Invalid coordinates!");
            
            notifyOwner(bot, `Moving to ${x}, ${y}, ${z}...`);
            await bot.pathfinder.goto(new goals.GoalBlock(x, y, z));
        } else {
            const target = bot.players[username]?.entity;
            if (!target) return notifyOwner(bot, "I can't see you!");
            
            notifyOwner(bot, "Coming to your location.");
            await bot.pathfinder.goto(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 1));
	    notifyOwner(bot, "I've reached to the location.");
        }
    }
};