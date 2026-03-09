const { startMiningLoop } = require('../systems/mining');
const { Vec3 } = require('vec3');
const { notifyOwner } = require('../lib/common');

module.exports = {
    name: 'mine',
    async execute(bot, args, username, config) {
        const subCommand = args[0]?.toLowerCase();

        // --- Handle STOP argument ---
        if (subCommand === 'stop' || subCommand === 'off' || subCommand === 'end') {
            if (!bot.isMining) {
                return notifyOwner(bot, "I wasn't mining anyway.");
            }
            bot.isMining = false;
            bot.pathfinder.setGoal(null); // Stop any current pathfinding
            return notifyOwner(bot, "Mining stopped. Standing by.");
        }

        // --- Handle START logic ---
        if (bot.isMining) {
            return notifyOwner(bot, "I am already mining! Use '!mine stop' to interrupt.");
        }

        // 1. Calculate direction based on where the bot is looking
        const yaw = bot.entity.yaw;
        const pt = new Vec3(-Math.sin(yaw), 0, -Math.cos(yaw));
        
        // Snap to the closest cardinal axis (N, S, E, W)
        bot.miningDirection = Math.abs(pt.x) > Math.abs(pt.z) 
            ? new Vec3(Math.sign(pt.x), 0, 0) 
            : new Vec3(0, 0, Math.sign(pt.z));

        // Friendly direction name for the logs
        const dirName = bot.miningDirection.x > 0 ? "East" : 
                        bot.miningDirection.x < 0 ? "West" : 
                        bot.miningDirection.z > 0 ? "South" : "North";
        
        notifyOwner(bot, `Starting tunnel mining towards the ${dirName}...`);

        // 2. Clear any follow targets to prevent glitchy movement
        bot.followTarget = null;
        bot.pathfinder.setGoal(null);

        // 3. Kick off the infinite loop from mining.js
        try {
            startMiningLoop(bot, config); 
        } catch (err) {
            notifyOwner(bot, `Mining loop failed to start: ${err.message}`);
            bot.isMining = false;
        }
    }
};