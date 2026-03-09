const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const mcDataLoader = require('minecraft-data')

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const config = require('./config')
const { notifyOwner, getTime, loadMemory } = require('./lib/common')

// ---------------------------
// BOT USERNAME ARG SUPPORT
// ---------------------------

const botUsername = process.argv[2] || config.username

let currentBot = null

// ---------------------------
// CREATE BOT
// ---------------------------

function createBot() {

  const bot = mineflayer.createBot({
    ...config,
    username: botUsername
  })

  currentBot = bot

  bot.loadPlugin(pathfinder)

  // Bot states
  bot.isMining = false
  bot.isFishing = false
  bot.chestPos = null
  bot.miningDirection = null
  bot.commands = new Map()

  // ---------------------------
  // LOAD COMMAND FILES
  // ---------------------------

  const commandFiles = fs.readdirSync(
    path.join(__dirname, 'commands')
  ).filter(file => file.endsWith('.js'))

  for (const file of commandFiles) {

    delete require.cache[require.resolve(`./commands/${file}`)]

    const command = require(`./commands/${file}`)
    bot.commands.set(command.name, command)
  }

  // ---------------------------
  // BOT SPAWN
  // ---------------------------

  bot.on('spawn', () => {

    const mcData = mcDataLoader(bot.version)

    bot.pathfinder.setMovements(
      new Movements(bot, mcData)
    )

    // Load profile memory
    loadMemory(bot)

    notifyOwner(
      bot,
      `🤖 ${botUsername} online. Loaded ${bot.commands.size} commands.`
    )

    console.log(`${getTime()} ${botUsername} spawned.`)
  })

  // ---------------------------
  // WHISPER COMMANDS
  // ---------------------------

  bot.on('whisper', async (username, message) => {

    if (username !== config.owner) return

    executeCommand(bot, message.trim(), username)
  })

  // ---------------------------
  // AUTO RECONNECT
  // ---------------------------

  bot.on('end', () => {

    console.log(
      `${getTime()} [SYSTEM] Disconnected. Reconnecting in ${config.autoRejoinIn / 1000}s...`
    )

    setTimeout(createBot, config.autoRejoinIn)
  })

  // ---------------------------
  // ERROR HANDLER
  // ---------------------------

  bot.on('error', (err) => {
    console.log(`${getTime()} [ERROR]`, err.message)
  })
}


// ---------------------------------
// COMMAND EXECUTOR
// ---------------------------------

async function executeCommand(bot, message, sender) {

  const args = message.split(/ +/)
  const cmdName = args.shift().toLowerCase()

  const command = bot.commands.get(cmdName)

  if (!command) {
    console.log(`${getTime()} Unknown command: ${cmdName}`)
    return
  }

  try {

    await command.execute(bot, args, sender, config)

  } catch (err) {

    console.log(`${getTime()} Command error (${cmdName}):`, err.message)

  }
}


// ---------------------------
// CONSOLE (ONLY CREATED ONCE)
// ---------------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.on('line', async (input) => {

  const message = input.trim()
  if (!message) return

  console.log(`${getTime()} [CONSOLE] ${message}`)

  if (!currentBot) {
    console.log("Bot not ready.")
    return
  }

  executeCommand(currentBot, message, 'CONSOLE')
})


// ---------------------------
// START BOT
// ---------------------------

createBot()