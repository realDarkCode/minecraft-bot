const { notifyOwner } = require('../lib/common')

const dangerous = [
  'lava',
  'flowing_lava',
  'gravel',
  'sand',
  'water',
  'flowing_water',
  'fire',
  'magma_block'
]

module.exports = {
  name: 'escape',

  async execute(bot) {
    notifyOwner(bot, "🧭 Attempting safe escape...")

    let tries = 0
    const maxTries = 60

    while (bot.entity.position.y < 60 && tries < maxTries) {
      tries++

      const pos = bot.entity.position.floored()

      const above1 = bot.blockAt(pos.offset(0, 1, 0))
      const above2 = bot.blockAt(pos.offset(0, 2, 0))
      const below = bot.blockAt(pos.offset(0, -1, 0))

      if (!above1 || !above2 || !below) break

      if (dangerous.includes(above1.name) || dangerous.includes(above2.name)) {
        notifyOwner(bot, `⚠️ Dangerous block above (${above1.name}). Searching side path...`)

        const sides = [
          pos.offset(1, 0, 0),
          pos.offset(-1, 0, 0),
          pos.offset(0, 0, 1),
          pos.offset(0, 0, -1)
        ]

        for (const s of sides) {
          const sideBlock = bot.blockAt(s)
          const sideAbove = bot.blockAt(s.offset(0, 1, 0))

          if (
            sideBlock &&
            sideAbove &&
            !dangerous.includes(sideBlock.name) &&
            !dangerous.includes(sideAbove.name) &&
            sideAbove.boundingBox === 'empty'
          ) {
            await bot.pathfinder.goto(new (require('mineflayer-pathfinder').goals.GoalBlock)(s.x, s.y, s.z))
            break
          }
        }

        continue
      }

      if (above1.boundingBox !== 'empty') {
        try {
          await bot.dig(above1)
        } catch {
          notifyOwner(bot, "❌ Can't dig upward.")
          break
        }
      }

      bot.setControlState('jump', true)
      await bot.waitForTicks(10)
      bot.setControlState('jump', false)

      await bot.waitForTicks(10)
    }

    notifyOwner(bot, `✅ Escape attempt finished. Current Y: ${Math.round(bot.entity.position.y)}`)
  }
}
