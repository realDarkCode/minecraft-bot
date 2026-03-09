const { notifyOwner } = require('../lib/common');

module.exports = {
    name: 'status',
    async execute(bot, args, username) {
        const pos = bot.entity.position;
        const health = Math.round(bot.health);
        const food = Math.round(bot.food);
        
        let state = bot.isMining ? "⛏️ Mining" : (bot.pathfinder.isMoving() ? "🏃 Moving" : "😴 Idle");

        notifyOwner(bot, `[STATUS] HP: ${health} | Food: ${food} | Pos: ${pos.x.toFixed(0)}, ${pos.z.toFixed(0)} | State: ${state}`);
    }
};