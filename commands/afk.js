const { notifyOwner } = require('../lib/common')

module.exports = {
  name: 'afk',

  async execute(bot, args, username, config) {

    if (args[0] === 'stop') {
      bot.isAfk = false
      return notifyOwner(bot, "🛑 AFK mode stopped.")
    }

    if (bot.isAfk) {
      return notifyOwner(bot, "⚠️ Already in AFK mode.")
    }

    bot.isAfk = true
    notifyOwner(bot, "💤 AFK mode enabled.")

    startAfk(bot)
  }
}

function startAfk(bot) {

  async function loop() {

    if (!bot.isAfk) return

    try {

      const yaw = Math.random() * Math.PI * 2
      const pitch = (Math.random() - 0.5) * 0.5

      bot.look(yaw, pitch, true)

      if (Math.random() > 0.6) {
        bot.setControlState('jump', true)
        setTimeout(() => bot.setControlState('jump', false), 500)
      }

    } catch (err) {}

    setTimeout(loop, 10000)
  }

  loop()
}