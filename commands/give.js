const { goals } = require('mineflayer-pathfinder');
const { notifyOwner } = require('../lib/common');

module.exports = {
    name: 'give',
    async execute(bot, args, username) {
        let targetName = args[0]?.toLowerCase();
        if (!targetName) return notifyOwner(bot, "Usage: !give <item/all>");

		if(targetName == "imp") targetName= "diamond"
        const player = bot.players[username]?.entity;
        if (player) await bot.pathfinder.goto(new goals.GoalNear(player.position.x, player.position.y, player.position.z, 1));

        const items = bot.inventory.items();
        let count = 0;

        for (const item of items) {
            if (targetName === 'all' || item.name.includes(targetName)) {
                await bot.tossStack(item);
                await new Promise(r => setTimeout(r, 200));
                count++;
            }
        }
        notifyOwner(bot, `Dropped ${count} item stacks.`);
    }
};