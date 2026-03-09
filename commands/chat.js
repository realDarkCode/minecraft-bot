module.exports = {
  name: 'chat',
  async execute(bot, args) {
    if (!args.length) return

    const message = args.join(' ')
    bot.chat(message)
  }
}
