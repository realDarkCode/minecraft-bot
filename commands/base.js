const { goals } = require('mineflayer-pathfinder')
const { notifyOwner, saveToMemory, clearMemory } = require('../lib/common')

module.exports = {
  name: 'base',

  async execute(bot, args) {

    const sub = args[0]?.toLowerCase()

    // -------------------------
    // CLEAR BASE MEMORY
    // -------------------------

    if (sub === 'clear') {

      bot.chestPos = null
      bot.bedPos = null

      clearMemory(bot, 'chestPos')
      clearMemory(bot, 'bedPos')

      return notifyOwner(bot, "🗑️ Base locations removed.")
    }

    // -------------------------
    // STATUS
    // -------------------------

    if (sub === 'status' || sub === 'info') {

      const c = bot.chestPos
      const b = bot.bedPos

      return notifyOwner(bot,
        `🏠 Base Info
Chest: ${c ? `${c.x} ${c.y} ${c.z}` : 'Not set'}
Bed: ${b ? `${b.x} ${b.y} ${b.z}` : 'Not set'}`
      )
    }

    // -------------------------
    // AUTO DETECT BASE
    // -------------------------

    notifyOwner(bot, "🔍 Scanning for Chest and Bed...")

    const chest = bot.findBlock({
      matching: block =>
        block.name.includes('chest') ||
        block.name.includes('shulker'),
      maxDistance: 5
    })

    const bed = bot.findBlock({
      matching: block => block.name.includes('bed'),
      maxDistance: 5
    })

    // Save chest
    if (chest) {

      bot.chestPos = chest.position.clone()

      saveToMemory(bot, 'chestPos', bot.chestPos)

      notifyOwner(bot, `📦 Chest saved (${chest.position.x} ${chest.position.y} ${chest.position.z})`)
    }

    // Save bed
    if (bed) {

      bot.bedPos = bed.position.clone()

      saveToMemory(bot, 'bedPos', bot.bedPos)

      try {

        await bot.pathfinder.goto(
          new goals.GoalNear(bed.position.x, bed.position.y, bed.position.z, 1)
        )

        await bot.activateBlock(bed)

      } catch (err) {}

      notifyOwner(bot, "🛏️ Bed + spawn saved.")
    }

    if (!chest && !bed) {
      notifyOwner(bot, "❌ No chest or bed found nearby.")
    }
  }
}