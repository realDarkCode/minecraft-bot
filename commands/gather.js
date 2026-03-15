const { notifyOwner } = require('../lib/common')
const { Vec3 } = require('vec3')

module.exports = {
  name: 'gather',

  async execute(bot, args) {
    const blockName = args[0]?.toLowerCase()
    let quantity = parseInt(args[1]) || 1

    if (blockName === 'stop') {
      bot.isGathering = false
      bot.pathfinder.setGoal(null)
      return notifyOwner(bot, "Stopped gathering.")
    }

    if (!blockName) {
      return notifyOwner(bot, "Usage: gather <block_name> [amount] OR gather stop")
    }

    const mcData = require('minecraft-data')(bot.version)
    const blockType = mcData.blocksByName[blockName]

    if (!blockType) {
      return notifyOwner(bot, `Unknown block "${blockName}"`)
    }

    if (bot.isGathering) {
      return notifyOwner(bot, "I am already gathering! Use 'gather stop' to interrupt.")
    }

    bot.isGathering = true
    let gatheredCount = 0

    notifyOwner(bot, `Starting to gather ${quantity} ${blockName}...`)

    while (bot.isGathering && gatheredCount < quantity) {
      const blockIds = [blockType.id]

      const blocks = bot.findBlocks({
        matching: blockIds,
        maxDistance: 64,
        count: 1
      })

      if (blocks.length === 0) {
        notifyOwner(bot, `Cannot find any nearby ${blockName}.`)
        bot.isGathering = false
        break
      }

      const targetBlockPos = blocks[0]
      const targetBlock = bot.blockAt(targetBlockPos)

      if (!targetBlock) continue

      try {
        const { goals } = require('mineflayer-pathfinder')
        
        // Move near to the block
        await bot.pathfinder.goto(new goals.GoalGetToBlock(targetBlockPos.x, targetBlockPos.y, targetBlockPos.z))

        // Equip best tool
        try {
          await bot.tool.equipForBlock(targetBlock)
        } catch (equipErr) {
          // If no specific tool is found, it will fallback to bare hands
        }

        // Mine the block
        await bot.dig(targetBlock)
        gatheredCount++

        // Wait a small moment to let the item drop and be collected
        await new Promise(r => setTimeout(r, 1000))
      } catch (err) {
        // Sometimes it fails to pathfind or mine, we just continue or notify
        console.log(`Failed to gather ${blockName} at ${targetBlockPos}: ${err.message}`)
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    if (bot.isGathering) { // If it wasn't manually stopped
      notifyOwner(bot, `Finished gathering ${gatheredCount}/${quantity} ${blockName}.`)
      bot.isGathering = false
    }
  }
}
