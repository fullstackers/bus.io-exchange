var util = require('util')
  , events = require('events')
  , redis = require('redis')
  , Message = require('bus.io-common').Message
  ;

/*
 * We use the PubSub to publish messages to everyone that is subscribed
 */

function PubSub (pub, sub) {
  if (!(this instanceof PubSub)) return new PubSub(pub, sub);
  events.EventEmitter.call(this);
  var self = this;

  //create a redis socket for publishing and connect to address and port
  this.pub = pub || redis.createClient();

  //create a redis socket for subscribing and connect to address and port
  this.sub = sub || redis.createClient();

  /**
   * Handles when we receive a message from the subscriber
   *
   * @param {string} channel
   * @param {string} message
   */

  this.onMessage = function (channel, data) {
    self.emit('message', channel, Message(JSON.parse(decodeURIComponent(data))));
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
 * @param {Message} message
 * @param {String} channel
 * @return PubSub
 */

PubSub.prototype.send = function (message, channel) {
  this.pub.publish(channel, encodeURIComponent(JSON.stringify(message.data)));
  return this;
};

/**
 * Subscribes to a channel and when it is subscribed will call
 * the callback.
 *
 * @param {string} channel
 * @param {Function} cb
 * @return PubSub
 */

PubSub.prototype.subscribe = function (channel, cb) {
  var self = this;
  if (!this.subscribed[channel]) {
    this.once('subscribed ' + channel, function () {
      cb(null, channel);
    });
    if (!this.subscribing[channel]) {
      this.subscribing[channel] = true;
      this.sub.subscribe(channel, function (err) {
        delete self.subscribing[channel];
        if (err) return cb(err);
        self.subscribed[channel] = true
        self.emit('subscribed ' + channel);
      });
    }
  }
  else {
    cb(null, channel);
  }
  return this;
};

/**
 * Unsubscribes to a channel and when it is unsubscribed will call
 * the callback
 *
 * @param {string} channel
 * @param {Function} cb
 * @return PubSub
 */

PubSub.prototype.unsubscribe = function (channel, cb) {
  var self = this;
  if (this.subscribed[channel]) {
    this.once('unsubscribed ' + channel, function () {
      cb(null, channel);
    });
    if (!this.unsubscribing[channel]) {
      this.unsubscribing[channel] = true;
      this.sub.unsubscribe(channel, function (err) {
        delete self.unsubscribing[channel];
        if (err) return cb(errr);
        delete self.subscribed[channel];
        self.emit('unsubscribed ' + channel);
      });
    }
  }
  else {
    cb(null, channel);
  }
  return this;
};

module.exports = PubSub;
