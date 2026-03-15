const { notifyOwner } = require('../lib/common')

module.exports = {
  name: 'look',

  async execute(bot, args) {
    const dir = (args[0] || '').toLowerCase()

    const delay = ms => new Promise(r => setTimeout(r, ms))

    try {
      switch (dir) {
        case 'left':
          await bot.look(bot.entity.yaw + Math.PI / 2, 0, true)
          notifyOwner(bot, 'Looking left.')
          break

        case 'right':
          await bot.look(bot.entity.yaw - Math.PI / 2, 0, true)
          notifyOwner(bot, 'Looking right.')
          break

        case 'back':
          await bot.look(bot.entity.yaw + Math.PI, 0, true)
          notifyOwner(bot, 'Looking back.')
          break

        case 'up':
          await bot.look(bot.entity.yaw, -Math.PI / 2, true)
          notifyOwner(bot, 'Looking up.')
          break

        case 'down':
          await bot.look(bot.entity.yaw, Math.PI / 2, true)
          notifyOwner(bot, 'Looking down.')
          break

        case 'forward':
        case 'front':
          await bot.look(bot.entity.yaw, 0, true)
          notifyOwner(bot, 'Looking forward.')
          break

        case 'all':
          notifyOwner(bot, 'Scanning all directions...')
          const directions = [
            { yaw: bot.entity.yaw, pitch: 0 },
            { yaw: bot.entity.yaw + Math.PI / 2, pitch: 0 },
            { yaw: bot.entity.yaw + Math.PI, pitch: 0 },
            { yaw: bot.entity.yaw - Math.PI / 2, pitch: 0 },
            { yaw: bot.entity.yaw, pitch: -Math.PI / 2 },
            { yaw: bot.entity.yaw, pitch: Math.PI / 2 }
          ]

          for (const d of directions) {
            await bot.look(d.yaw, d.pitch, true)
            await delay(700)
          }

          notifyOwner(bot, 'Finished scanning.')
          break

        default:
          notifyOwner(bot, 'Usage: look <left|right|back|up|down|forward|all>')
      }
    } catch (err) {
      console.log('Look command error:', err.message)
    }
  }
}
