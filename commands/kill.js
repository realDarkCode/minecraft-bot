const { notifyOwner, autoEat } = require('../lib/common');



module.exports = {
    name: 'kill',

    async execute(bot, args) {

        const subCommand = args[0]?.toLowerCase();

        // STOP COMMAND
        if (subCommand === 'stop' || subCommand === 'off') {
            if (!bot.isKilling) {
                return notifyOwner(bot, "I wasn't in kill mode anyway.");
            }

            bot.isKilling = false;
            return notifyOwner(bot, "⚔️ Kill mode deactivated.");
        }

        if (bot.isKilling) {
            return notifyOwner(bot, "I am already killing! Use '!kill stop' to end.");
        }

        bot.isKilling = true;
        bot.warnedNoFood = false;
        bot.warnedNoSword = false;

        notifyOwner(bot, "⚔️ Kill mode activated. Standing ground...");

        // Equip sword
        const sword = bot.inventory.items().find(i => i.name.includes('sword'));

        if (sword) {
            await bot.equip(sword, 'hand');
        } else if (!bot.warnedNoSword) {
            bot.warnedNoSword = true;
            notifyOwner(bot, "⚠ No sword available!");
        }

        while (bot.isKilling) {
            try {

                await autoEat(bot);

                const target = bot.nearestEntity(e => {
                    const isMob = e.type === 'mob' || e.type === 'hostile';
                    const name = e.name?.toLowerCase() || "";

                    return isMob &&
                        (name.includes('piglin') || name.includes('zombie')) &&
                        e.position.distanceTo(bot.entity.position) < 4.5;
                });

                if (target) {

                    const aimPos = target.position.offset(0, target.height * 0.5, 0);
                    await bot.lookAt(aimPos, true);

                    await bot.attack(target);

                    await bot.waitForTicks(10);

                } else {
                    await bot.waitForTicks(5);
                }

            } catch {
                await bot.waitForTicks(10);
            }
        }
    }
};