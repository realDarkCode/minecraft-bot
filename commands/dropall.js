const { notifyOwner } = require('../lib/common')

module.exports = {
  name: 'dropall',

  async execute(bot, args) {
    const keepFilters = args.map(arg => arg.toLowerCase())
    const items = bot.inventory.items()

    let droppedCount = 0

    if (items.length === 0) {
        return notifyOwner(bot, "My inventory is already empty.")
    }

    notifyOwner(bot, "Dropping items...")

    for (const item of items) {
      const itemName = item.name.toLowerCase()
      // Skip if it matches any user-specified filter word (e.g. dropall pickaxe)
      const keep = keepFilters.some(filter => itemName.includes(filter))
      if (keep) continue

      try {
        await bot.tossStack(item)
        droppedCount++
      } catch (err) {
        console.log(`Failed to drop ${item.name}: ${err.message}`)
      }
      
      // Prevent dropping items too fast which kicks the bot for spamming
      await new Promise(r => setTimeout(r, 100))
    }

    notifyOwner(bot, `Dropped ${droppedCount} item stacks.`)
  }
}
