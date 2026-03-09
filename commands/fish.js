const { goals } = require('mineflayer-pathfinder')
const { notifyOwner } = require('../lib/common')

const junkItems = [
  'bowl',
  'stick',
  'leather',
  'rotten_flesh',
  'ink_sac',
  'lily_pad'
]

module.exports = {
  name: 'fish',

  async execute(bot, args) {

    // -------------------------
    // STOP
    // -------------------------

    if (args[0] === 'stop') {

      bot.isFishing = false

      try { bot.activateItem(false) } catch {}

      return notifyOwner(bot, "🎣 Fishing stopped.")
    }

    // -------------------------
    // DEPOSIT
    // -------------------------

    if (args[0] === 'deposit') {

      if (!bot.chestPos)
        return notifyOwner(bot, "❌ No base chest defined.")

      const wasFishing = bot.isFishing
      bot.isFishing = false

      try { bot.activateItem(false) } catch {}

      const prev = bot.entity.position.clone()

      try {

        notifyOwner(bot, "📦 Depositing items...")

        await bot.pathfinder.goto(
          new goals.GoalNear(bot.chestPos.x, bot.chestPos.y, bot.chestPos.z, 2)
        )

        const chestBlock = bot.blockAt(bot.chestPos)

        if (!chestBlock)
          return notifyOwner(bot, "❌ Chest missing.")

        const chest = await bot.openContainer(chestBlock)

        let deposited = 0

        for (const item of bot.inventory.items()) {

          if (item.name.includes('fishing_rod')) continue

          if (item.name.match(/cod|salmon|bread|beef|chicken|mutton|pork/))
            continue

          await chest.deposit(item.type, null, item.count)

          deposited++
        }

        chest.close()

        notifyOwner(bot, `✅ Deposited ${deposited} stacks.`)

        // Eat if hungry
        if (bot.food < 18) {

          const food = bot.inventory.items().find(i =>
            i.name.match(/cod|salmon|bread|beef|chicken|mutton|pork/)
          )

          if (food) {

            notifyOwner(bot, "🍖 Eating...")

            await bot.equip(food, 'hand')
            await bot.consume()
          }
        }

        notifyOwner(bot, "🔄 Returning to fishing spot...")

        await bot.pathfinder.goto(
          new goals.GoalNear(prev.x, prev.y, prev.z, 1)
        )

        if (wasFishing) {

          bot.isFishing = true
          startFishing(bot)
        }

      } catch (err) {

        notifyOwner(bot, "❌ Deposit failed: " + err.message)
      }

      return
    }

    // -------------------------
    // START
    // -------------------------

    if (bot.isFishing)
      return notifyOwner(bot, "🎣 Already fishing.")

    bot.isFishing = true

    notifyOwner(bot, "🌊 Fishing started.")

    startFishing(bot)
  }
}


// -------------------------
// JUNK CLEANER
// -------------------------

function dropJunk(bot) {

  for (const item of bot.inventory.items()) {

    if (junkItems.includes(item.name)) {

      bot.tossStack(item).catch(() => {})
    }
  }
}


// -------------------------
// FISH LOOP
// -------------------------

function startFishing(bot) {

  if (bot.fishingLoopRunning) return
  bot.fishingLoopRunning = true

  let total = bot.totalCatches || 0

  async function loop() {

    if (!bot.isFishing) {
      bot.fishingLoopRunning = false
      return
    }

    try {

      dropJunk(bot)

      const water = bot.findBlock({
        matching: block => block.name.includes('water'),
        maxDistance: 16
      })

      if (!water) {

        notifyOwner(bot, "❌ No water nearby.")
        bot.isFishing = false
        return
      }

      const rod = bot.inventory.items()
        .find(i => i.name.includes('fishing_rod'))

      if (!rod) {

        notifyOwner(bot, "❌ No fishing rod.")
        bot.isFishing = false
        return
      }

      await bot.equip(rod, 'hand')

      await bot.lookAt(
        water.position.offset(0.5, 0.3, 0.5),
        true
      )

      await bot.fish()

      total++
      bot.totalCatches = total

      if (total % 16 === 0) {
        notifyOwner(bot, `🎣 Catch #${total}`)
      }

    } catch (err) {

      console.log("Fishing error:", err.message)
    }

    setTimeout(loop, 1000)
  }

  loop()
}