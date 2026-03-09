const { notifyOwner } = require("../lib/common");

module.exports = {
  name: "eat",
  async execute(bot, args, username) {
    // List of common food items to check for
    const foodList = [
      "apple",
      "bread",
      "beef",
      "pork",
      "chicken",
      "carrot",
      "potato",
      "mutton",
      "cod",
      "salmon",
    ];

    const food = bot.inventory
      .items()
      .find(
        (item) =>
          foodList.some((name) => item.name.includes(name)) &&
          !item.name.includes("raw"),
      );

    if (!food) {
      return notifyOwner(bot, "I don't have any cooked food in my inventory!");
    }

    try {
      await bot.equip(food, "hand");
      await bot.consume();
      notifyOwner(bot, `ate ${food.name}...`);
    } catch (err) {
      notifyOwner(bot, `Failed to eat: ${err.message}`);
    }
  },
};
