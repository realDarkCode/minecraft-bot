const { notifyOwner } = require('../lib/common');

module.exports = {
    name: 'health',
    async execute(bot, args, username) {
        const health = Math.round(bot.health);
        const food = Math.round(bot.food);

        const ping = bot.player?.ping ?? bot._client?.socket?.ping ?? 'Unknown';

        notifyOwner(bot, `🏥 [HEALTH] HP: ${health}/20 | Food: ${food}/20 | Ping: ${ping}ms`);
    }
};
