const { notifyOwner } = require('../lib/common')

module.exports = {
  name: 'players',
  async execute(bot, args, username) {
    const players = Object.keys(bot.players)

    if (!players.length) {
      return notifyOwner(bot, 'No players found.')
    }

    const list = players.join(', ')
    notifyOwner(bot, `Players online (${players.length}): ${list}`)
  }
}