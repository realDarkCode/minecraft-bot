const { goals, Movements } = require('mineflayer-pathfinder')
const { notifyOwner } = require('../lib/common')

module.exports = {
  name: 'come',
  async execute(bot, args, username) {
    bot.isMining = false

    const mcData = require('minecraft-data')(bot.version)

    const isSafeMode = args.includes('safe')
    if (isSafeMode) args = args.filter(a => a !== 'safe')

    let movements = new Movements(bot, mcData)

    if (isSafeMode) {
      movements.canDig = false
      movements.allow1by1towers = false
      movements.scafoldingBlocks = []
      notifyOwner(bot, "🛡️ Safe mode enabled.")
    }

    bot.pathfinder.setMovements(movements)

    const maxDistance = 500

    async function gotoWithRetry(goal, label) {
      let tries = 0
      const maxTries = 3

      while (tries < maxTries) {
        try {
          await bot.pathfinder.goto(goal)
          return true
        } catch (err) {
          tries++
          notifyOwner(bot, `⚠️ Path failed (${tries}/${maxTries}) retrying...`)
          await bot.waitForTicks(20)
        }
      }

      notifyOwner(bot, `❌ Could not reach ${label}`)
      return false
    }

    // coordinate mode
    if (args.length >= 3) {
      const x = Number(args[0])
      const y = Number(args[1])
      const z = Number(args[2])

      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
        return notifyOwner(bot, "❌ Invalid coordinates")

      const distance = bot.entity.position.distanceTo({ x, y, z })
      if (distance > maxDistance)
        return notifyOwner(bot, `❌ Too far (${distance.toFixed(1)} blocks)`)

      notifyOwner(bot, `📍 Moving to ${x}, ${y}, ${z}`)

      const goal = new goals.GoalBlock(x, y, z)

      const success = await gotoWithRetry(goal, "destination")
      if (!success) return

      const pos = bot.entity.position
      const finalDist = pos.distanceTo({ x, y, z })

      if (finalDist <= 2)
        notifyOwner(bot, `✅ Arrived at ${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`)
      else
        notifyOwner(bot, `⚠️ Stopped nearby (${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)})`)

      return
    }

    // player mode
    const target = bot.players[username]?.entity
    if (!target) return notifyOwner(bot, "❌ I can't see you")

    const distance = bot.entity.position.distanceTo(target.position)
    if (distance > maxDistance)
      return notifyOwner(bot, `❌ You're too far (${distance.toFixed(1)} blocks)`)

    notifyOwner(bot, "📍 Coming to you...")

    const goal = new goals.GoalNear(
      Math.floor(target.position.x),
      Math.floor(target.position.y),
      Math.floor(target.position.z),
      1
    )

    const success = await gotoWithRetry(goal, "player")
    if (success) notifyOwner(bot, "✅ I've reached your location.")
  }
}
