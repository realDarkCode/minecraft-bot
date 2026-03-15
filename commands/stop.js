const { notifyOwner } = require('../lib/common')

module.exports = {
  name: 'stop',

  async execute(bot, args) {
    bot.pathfinder.setGoal(null)
    
    bot.isMining = false
    bot.isGathering = false
    bot.isFishing = false
    bot.followTarget = null
    bot.clearControlStates()
    
    notifyOwner(bot, "All current tasks and movements have been stopped.")
  }
}
