const { notifyOwner } = require('../lib/common')
const { Vec3 } = require('vec3')

module.exports = {
  name: 'craft',

  async execute(bot, args) {

    const itemName = args[0]?.toLowerCase()
    const quantity = parseInt(args[1]) || 1
    const search = args.includes('search')

    if (!itemName)
      return notifyOwner(bot, "Usage: craft <item> [amount] [search]")

    const mcData = require('minecraft-data')(bot.version)

    const item = mcData.itemsByName[itemName]

    if (!item)
      return notifyOwner(bot, `Unknown item "${itemName}"`)

    const allRecipes = bot.recipesAll(item.id, null, null)

    if (!allRecipes || allRecipes.length === 0)
      return notifyOwner(bot, `No recipe exists for ${itemName}`)

    const recipe = allRecipes[0]

    const required = recipe.delta
      .filter(d => d && d.count < 0)

    let missing = []

    for (const r of required) {

      const id = Math.abs(r.type)
      const needed = Math.abs(r.count) * quantity

      const have = bot.inventory.count(id, null)

      if (have < needed) {

        missing.push({
          id,
          name: mcData.items[id]?.name || "unknown",
          count: needed - have
        })

      }
    }

    // SEARCH CHESTS
    if (missing.length && search) {

      notifyOwner(bot, "Searching nearby chests...")

      const chestBlocks = bot.findBlocks({
        matching: block =>
          block === mcData.blocksByName.chest.id ||
          block === mcData.blocksByName.trapped_chest?.id,
        maxDistance: 12,
        count: 20
      })

      for (const pos of chestBlocks) {

        try {

          const chestBlock = bot.blockAt(pos)
          const chest = await bot.openChest(chestBlock)

          for (const m of missing) {

            const chestItem = chest.containerItems()
              .find(i => i.type === m.id)

            if (!chestItem) continue

            const take = Math.min(chestItem.count, m.count)

            await chest.withdraw(chestItem.type, null, take)

            m.count -= take

          }

          await chest.close()

        } catch (err) {
          continue
        }

        missing = missing.filter(m => m.count > 0)

        if (!missing.length) break
      }
    }

    if (missing.length) {

      const msg = missing
        .map(m => `${m.count}x ${m.name}`)
        .join(", ")

      return notifyOwner(bot, `Missing: ${msg}`)
    }

    // FIND TABLE
    let table = bot.findBlock({
      matching: mcData.blocksByName.crafting_table.id,
      maxDistance: 4
    })

    let placedTable = false

    if (!table) {

      let tableItem = bot.inventory.items()
        .find(i => i.name === "crafting_table")

      if (!tableItem) {

        const tableRecipe = bot.recipesFor(
          mcData.itemsByName.crafting_table.id,
          null,
          1,
          null
        )[0]

        if (!tableRecipe)
          return notifyOwner(bot, "Need crafting table but cannot craft one")

        notifyOwner(bot, "Crafting crafting_table...")

        await bot.craft(tableRecipe, 1, null)

        tableItem = bot.inventory.items()
          .find(i => i.name === "crafting_table")
      }

      const base = bot.entity.position.floored()

      const placePos = base.offset(1, 0, 0)

      const ref = bot.blockAt(placePos.offset(0, -1, 0))

      if (!ref)
        return notifyOwner(bot, "Cannot place crafting table (no block below)")

      await bot.equip(tableItem, "hand")

      try {

        await bot.placeBlock(ref, new Vec3(0, 1, 0))

        table = bot.blockAt(placePos)

        placedTable = true

      } catch {

        return notifyOwner(bot, "Failed to place crafting table")
      }
    }

    try {

      const recipes = bot.recipesFor(item.id, null, quantity, table)

      if (!recipes || recipes.length === 0)
        return notifyOwner(bot, "Cannot craft with current ingredients")

      notifyOwner(bot, `Crafting ${quantity}x ${itemName}...`)

      await bot.craft(recipes[0], quantity, table)

      notifyOwner(bot, `Crafted ${quantity}x ${itemName}`)

    } catch (err) {

      return notifyOwner(bot, `Craft error: ${err.message}`)
    }

    // CLEANUP
    if (placedTable) {

      try {

        const pickaxe = bot.inventory.items()
          .find(i => i.name.includes("pickaxe"))

        if (pickaxe)
          await bot.equip(pickaxe, "hand")

        await bot.dig(table)

      } catch {}
    }
  }
}
