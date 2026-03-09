const { notifyOwner } = require('../lib/common');

module.exports = {
    name: 'inv',
    async execute(bot, args, username) {
        const items = bot.inventory.items();

        if (items.length === 0) {
            return notifyOwner(bot, "My inventory is completely empty.");
        }

        // Group items by name and sum their counts
        const inventoryMap = {};
        items.forEach(item => {
            if (inventoryMap[item.displayName]) {
                inventoryMap[item.displayName] += item.count;
            } else {
                inventoryMap[item.displayName] = item.count;
            }
        });

        // Convert the map into a readable string
        const itemList = Object.entries(inventoryMap)
            .map(([name, count]) => `${count}x ${name}`)
            .join(', ');

        const emptySlots = bot.inventory.emptySlotCount();
        
        notifyOwner(bot, `📦 Inventory Report:`);
        notifyOwner(bot, itemList);
        notifyOwner(bot, `----------------------`);
        notifyOwner(bot, `🆓 Free Slots: ${emptySlots}`);

        // If the bot is almost full, give a warning
        if (emptySlots <= 2) {
            notifyOwner(bot, "⚠️ Warning: Inventory is almost full! Consider using !clean.");
        }
    }
};