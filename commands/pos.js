const { notifyOwner } = require('../lib/common');

module.exports = {
    name: 'pos',
    async execute(bot, args, username) {
        const pos = bot.entity.position;
        const dimension = bot.game.dimension;
        
        // Bot's Current Coordinates
        const x = Math.floor(pos.x);
        const y = Math.floor(pos.y);
        const z = Math.floor(pos.z);

        notifyOwner(bot, `📍 Bot Location: ${x}, ${y}, ${z} (${dimension})`);
        
        // Chest/Base Coordinates
        if (bot.chestPos) {
            const cx = Math.floor(bot.chestPos.x);
            const cy = Math.floor(bot.chestPos.y);
            const cz = Math.floor(bot.chestPos.z);
            const dist = pos.distanceTo(bot.chestPos).toFixed(1);

            notifyOwner(bot, `📦 Base Chest: ${cx}, ${cy}, ${cz} (Dist: ${dist} blocks)`);
        } else {
            notifyOwner(bot, "⚠️ No base chest registered! Use !setbase to set one.");
        }
    }
};