var util = require('util')
  , events = require('events')
  , debug = require('debug')('bus.io-exchange:pubsub')
  , redis = require('redis')
  , Message = require('bus.io-common').Message
  , slice = String.prototype.slice
  ;

/*
 * We use the PubSub to publish messages to everyone that is subscribed
 */

module.exports = PubSub;

function PubSub (pub, sub, prefix) {
  if (!(this instanceof PubSub)) return new PubSub(pub, sub, prefix);
  events.EventEmitter.call(this);
  var self = this;

  debug('new pubsub', typeof pub, typeof sub);

  this.prefix = prefix || '';

  //create a redis socket for publishing and connect to address and port
  this.pub = pub || redis.createClient();

  //create a redis socket for subscribing and connect to address and port
  this.sub = sub || redis.createClient();

  /**
   * Handles when we receive a message from the subscriber
   *
   * @api private
   * @param {string} channel
   * @param {string} message
   */

  this.onMessage = function (channel, data) {
    debug('on message %s', channel);
    try {
      //TODO maybe we want something other than JSON data?
      self.emit('message', slice.call(channel, self.prefix.length), Message(JSON.parse(decodeURIComponent(data))));
    }
    catch(e) {
      console.error(e);
      self.emit('error', e);
    }
  };

  this.subscribing = {};
  this.unsubscribing = {};
  this.subscribed = {};

  this.sub.on('message', this.onMessage);
}

util.inherits(PubSub, events.EventEmitter);

/**
 * Sends a message to the pub sub
 *
 * @api public
 * @param {Message} message
 * @param {String} channel
 * @param {String} prefix
 * @return PubSub
 */

PubSub.prototype.send = function (message, channel, prefix) {
  debug('send message %s', channel); 
  if ('undefined' === typeof prefix) prefix = this.prefix;
  this.pub.publish(prefix+channel, encodeURIComponent(JSON.stringify(message.data)));
  return this;
};

/**
 * Subscribes to a channel and when it is subscribed will call
 * the callback.
 *
 * @api public
 * @param {string} channel
 * @param {Function} cb
 * @return PubSub
 */

PubSub.prototype.subscribe = function (channel, cb) {
  var self = this;
  debug('subscribe %s', channel);
  if (!this.subscribed[channel]) {
    if (!this.subscribing[channel]) {
      this.subscribing[channel] = true;
      debug('subscribing to %s', channel);
      this.sub.subscribe(self.prefix+channel, function (err) {
        debug('done subscribing to %s', channel);
        delete self.subscribing[channel];
        if (err) {
          debug('error subscribing to %s %s', channel, err);
          return cb(err);
        }
        debug('subscribed to %s', channel);
        self.subscribed[channel] = true
        self.emit('subscribed ' + channel);
      });
    }
    this.once('subscribed ' + channel, function () {
      debug('subscribed to %s invoking cb', channel);
      cb(null, channel);
    });
  }
  else {
    debug('already subscribed %s', channel);
    cb(null, channel);
  }
  return this;
};

/**
 * Unsubscribes to a channel and when it is unsubscribed will call
 * the callback
 *
 * @api public
 * @param {string} channel
 * @param {Function} cb
 * @return PubSub
 */

PubSub.prototype.unsubscribe = function (channel, cb) {
  var self = this;
  debug('unsubscribe %s', channel);
  if (this.subscribed[channel]) {
    if (!this.unsubscribing[channel]) {
      this.unsubscribing[channel] = true;
      debug('unsubscribing from %s', channel);
      this.sub.unsubscribe(self.prefix+channel, function (err) {
        debug('done unsubscribing from %s', channel);
        delete self.unsubscribing[channel];
        if (err) {
          debug('error unsubscribing from %s %s', channel, err);
          return cb(errr);
        }
        debug('unsubscribed from %s', channel);
        delete self.subscribed[channel];
        self.emit('unsubscribed ' + channel);
      });
    }
    this.once('unsubscribed ' + channel, function () {
      debug('unsubscribed from %s invoking cb', channel);
      cb(null, channel);
    });
  }
  else {
    cb(null, channel);
  }
  return this;
};
