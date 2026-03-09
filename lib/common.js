const config = require("../config");
const fs = require("fs");
const path = require("path");
const { Vec3 } = require("vec3");

const dataPath = path.join(__dirname, "../bot_memory.json");

function getProfile(bot) {
  return bot.username || config.username;
}

function saveToMemory(bot, key, value) {
  let data = {};

  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath));
  }

  const profile = getProfile(bot);

  if (!data[profile]) data[profile] = {};

  data[profile][key] = value;

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function loadMemory(bot) {
  if (!fs.existsSync(dataPath)) return;

  const data = JSON.parse(fs.readFileSync(dataPath));

  const profile = getProfile(bot);

  if (!data[profile]) return;

  for (const key in data[profile]) {
    const val = data[profile][key];

    if (val && typeof val === "object" && "x" in val) {
      bot[key] = new Vec3(val.x, val.y, val.z);
    } else {
      bot[key] = val;
    }
  }

  console.log(`🧠 Memory loaded for profile: ${profile}`);
}

function clearMemory(bot, key) {
  if (!fs.existsSync(dataPath)) return;

  let data = JSON.parse(fs.readFileSync(dataPath));

  const profile = getProfile(bot);

  if (!data[profile]) return;

  delete data[profile][key];

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getTime() {
  const now = new Date();

  return `[${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}]`;
}

function notifyOwner(bot, message) {
  const time = getTime();

  console.log(`${time} [BOT]: ${message}`);

  bot.whisper(config.owner, message);
}

async function autoEat(bot) {
  try {
    if (bot.food === undefined || bot.food > 10) return;

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
      if (!bot.warnedNoFood) {
        bot.warnedNoFood = true;
        notifyOwner(bot, "⚠ No food available!");
      }
      return;
    }

    bot.warnedNoFood = false;

    await bot.equip(food, "hand");

    await bot.consume();
    notifyOwner(bot, `🍽️ Ate ${food.name}...`);
  } catch {}
}

module.exports = {
  saveToMemory,
  loadMemory,
  clearMemory,
  getTime,
  notifyOwner,
  autoEat,
};
