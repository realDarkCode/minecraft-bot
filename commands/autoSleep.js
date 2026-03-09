const { goals } = require('mineflayer-pathfinder')
const { notifyOwner } = require('../lib/common')

module.exports = {
  name: 'autoSleep',

  async execute(bot, args) {

    if (args[0] === 'stop') {
      bot.autoSleep = false
      return notifyOwner(bot, "🌙 Auto sleep disabled.")
    }

    if (!bot.bedPos) {
      return notifyOwner(bot, "❌ No bed set. Use !base first.")
    }

    if (bot.autoSleep) {
      return notifyOwner(bot, "⚠️ Auto sleep already running.")
    }

    bot.autoSleep = true
    notifyOwner(bot, "🌙 Auto sleep enabled.")

    startSleepWatcher(bot)
  }
}

function startSleepWatcher(bot) {

  async function loop() {

    if (!bot.autoSleep) return

    try {

      const time = bot.time.timeOfDay

      if (time > 12541 && time < 23458) {

        const bed = bot.blockAt(bot.bedPos)

        if (!bed || !bed.name.includes('bed')) {
          notifyOwner(bot, "❌ Saved bed missing.")
          bot.autoSleep = false
          return
        }

        notifyOwner(bot, "🌙 Going to bed...")

        await bot.pathfinder.goto(
          new goals.GoalNear(bed.position.x, bed.position.y, bed.position.z, 1)
        )

        try {

          await bot.sleep(bed)
          notifyOwner(bot, "💤 Sleeping...")

        } catch (err) {}

        while (bot.isSleeping) {
          await new Promise(r => setTimeout(r, 2000))
        }

        notifyOwner(bot, "☀️ Good morning.")
      }

    } catch (err) {
      console.log("Sleep error:", err.message)
    }

    setTimeout(loop, 10000)
  }

  loop()
}