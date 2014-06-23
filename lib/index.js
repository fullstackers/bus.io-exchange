var Exchange = require('./exchange');
exports = module.exports = Exchange;
exports.Exchange = Exchange;
exports.Queue = require('./queue');
exports.PubSub = require('./pubsub');
exports.version = require('./../package.json').version;
