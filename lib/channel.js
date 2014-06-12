var util = require('util')
  , events = require('events')
  , removeListener = events.EventEmitter.prototype.removeListener
  , Exchange = require('./exchange') 
  ;

/**
 * An Channel is where messages are sent to and receive
 *
 * @param {string} id
 * @param {Exchange} exchange
 */

function Channel (id, exchange) {
  if (!(this instanceof Channel)) return new Channel(id, exchange);
  //if (!(exchange instanceof Exchange)) throw new Error('exchange must be an Exchange');
  var self = this;
  this.onMessage = function (message) {
    self.emit('message', message);
  };
  events.EventEmitter.call(this);
  this.id = id;
  this.subscribed = false;
  this.exchange = exchange;
  this.exchange.on('channel ' + this.id, this.onMessage);
  this.setMaxListeners(0);
}

util.inherits(Channel, events.EventEmitter);

/**
 * Makes a new channgel
 *
 * @param {string} id
 * @param {Exchange} exchange
 * @return Channel
 */

Channel.make = function (id, exchange) {
  return new Channel(id, exchange);
};

/**
 * publishes a message onto this channel
 *
 * @param {string} message
 * @return Channel
 */

Channel.prototype.publish = function (message) {
  console.log('publish', message);
  var self = this;
  if (!this.subscribed) {
    console.log('not subscribed');
    this.once('subscribed', function () {
      console.log('subscribed');
      self.exchange.publish(message, self.id);
      self.subscribing = false
      self.subscribed = true;
    });
    if (!this.subscribing) {
      this.subscribing = true;
      this.exchange.pubsub().subscribe(this.id, function (err) {
        console.log('subscribed', self.id);
        if (err) {
          return self.emit('error', err);
        }
        self.emit('subscribed');
      });
    }
  }
  else {
    this.exchange.publish(message, this.id);
  }
  return this;
};

Channel.prototype.removeListener = function (name, fn) {
  removeListener.call(this, name, fn); 
  if (name === 'message' && this.listeners(name).length === 0) {
    var self = this;
    this.exchange.removeListener('channel ' + this.id, this.onMessage);
    this.exchange.pubsub().unsubscribe(this.id, function (err) {
      console.log('err', err, 'unsubscribe ' + self.id);
      delete self.exchange.channels[self.id]
      delete self.exchange;
      if (err)
        self.emit('error', err);
      else
        self.subscribed = false;
    });
  }
};

module.exports = Channel;
