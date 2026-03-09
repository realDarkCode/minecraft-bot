const { notifyOwner } = require('../lib/common')
const { goals } = require('mineflayer-pathfinder')
const minecraftData = require('minecraft-data') // << add this

module.exports = {
  name: 'chestinfo',

  async execute(bot) {

    // initialize mcData from bot version
    const mcData = minecraftData(bot.version)

    notifyOwner(bot, "📦 Scanning nearby chests...")

    const scanRadius = 6
    const results = {}

    const chestBlocks = bot.findBlocks({
      matching: block => block.name.includes('chest'),
      maxDistance: scanRadius,
      count: 50
    })

    if (chestBlocks.length === 0) {
      return notifyOwner(bot, "❌ No chests found nearby.")
    }

    for (const pos of chestBlocks) {

      const block = bot.blockAt(pos)

      try {

        // Move closer if chest slightly out of reach
        const dist = bot.entity.position.distanceTo(pos)

        if (dist > 4) {
          await bot.pathfinder.goto(
            new goals.GoalNear(pos.x, pos.y, pos.z, 3)
          )
        }

        const chest = await bot.openContainer(block)

        for (const item of chest.containerItems()) {
          if (!results[item.name]) results[item.name] = 0
          results[item.name] += item.count
        }

        chest.close()

      } catch (err) {
        console.log("Chest read error:", err.message)
      }
    }

    if (Object.keys(results).length === 0) {
      return notifyOwner(bot, "📦 All chests are empty.")
    }

    // Dynamic stack conversion
    function formatStack(itemName, count) {
      const itemData = mcData.itemsByName[itemName]
      if (!itemData) return `${count}` // fallback if item unknown

      const stackSize = itemData.stackSize || 64
      const stacks = Math.floor(count / stackSize)
      const remainder = count % stackSize

      if (stacks > 0 && remainder > 0) return `${stacks} stack + ${remainder}`
      if (stacks > 0) return `${stacks} stack`
      return `${remainder}`
    }

    const summary = Object.entries(results)
      .map(([name, count]) => `${name} x${formatStack(name, count)}`)
      .join(", ")

    notifyOwner(bot, `📊 Storage Report: ${summary}`)
  }
}