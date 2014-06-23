var util = require('util')
  , events = require('events')
  , debug = require('debug')('exchange')
  , Queue = require('./queue')
  , PubSub = require('./pubsub')
  ;

/**
 * We use an exchange to send data accross the network
 * using a queue and pubsub. Data is written to a queue, when a message is received
 * off of the queue, the queue parses it and emits and event.  The event handler is given
 * a callback that will publish the processed event on the pub sub given the actors channel / userid
 * any listeners on that channel will be notified and given the message
 *
 * NOTE we could probably use only event emitter instead of the "send" methods of the Queue and PubSub objects
 *
 * @param {Queue} queue Messages are written to the queue, processed by the queue, and dispatched to the pubsub
 * @param {PubSub} pubsub The pubsub will push message to the pubsub and receives messages from the pubsub as well as dispatch received messages to the handler.
 * @param {EventEmitter} handler The handler will handle messages from the Queue 
 */

module.exports = Exchange;

function Exchange (queue, pubsub, handler) {

  if (!(this instanceof Exchange)) return new Exchange(queue, pubsub, handler);

  debug('new exchange', typeof queue, typeof pubsub, typeof handler);

  events.EventEmitter.call(this);

  var self = this;

  /**
   * The handler for when we get a message from the Queue
   *
   * @api private
   * @param {Message} message
   */

  this.onQueueMessage = function (message) {
    debug('on queue message %s', message.id()); 
    try {
      self.handler().emit(message.action(), message, self);
    } catch(e) {
      console.error(e);
      self.emit('error', e);
    }
  };

  /**
   * The handler for when we get a message from the PubSub
   *
   * @api private
   * @param {String} channel
   * @param {Message} Message
   */

  this.onPubSubMessage = function (channel, message) {
    debug('on pubsub message %s', message.id()); 
    try {
      self.emit('channel ' + channel, message); 
    }
    catch(e) {
      console.error(e);
      self.emit('error', e);
    }
  };

  this.setMaxListeners(0);

  if (queue) this.queue(queue);

  if (pubsub) this.pubsub(pubsub);

  if (handler) this.handler(handler);
}

util.inherits(Exchange, events.EventEmitter);

/**
 * publish a message to the queue or if the channel is specified to the channel.  If
 * the channel is not specified and the message has not been published it will go
 * to the queue.  If the message has been published onto the queue and a channel is
 * not specified the message will go the pubsub.
 *
 * @api public
 * @param {Message} message
 * @param {String} channel *optional
 * @return Exchange
 */

Exchange.prototype.publish = function (message, channel) {
  if (channel) {
    debug('publish %s on channel %s', message.id(), channel);
    this.pubsub().send(message, channel);
  }
  else {
    if (message.published()) {
      debug('msg %s already published to queue so publishing to target channel %s', message.id(), message.target());
      this.pubsub().send(message, message.target());
    }
    else {
      debug('publish %s to queue', message.id());
      message.data.published = new Date();
      this.queue().send(message);
    }
  }
  return this;
};

/**
 * Gets or sets the queue as well as initializes it
 *
 * @api public
 * @param {Queue} queue
 * @return Queue / Exchange
 */

Exchange.prototype.queue = function (queue) {

  if (typeof queue === 'object' && queue instanceof Queue) {

    if (this._queue) {
      this._queue.removeListener('message', this.onQueueMessage);
    }
    
    this._queue = queue;
    this._queue.on('message', this.onQueueMessage);

    return this;
  }

  if (!this._queue) {
    this.queue( Queue() );
  }

  return this._queue;

}

/**
 * Gets or sets the pubsub as well as initializes it
 *
 * @api public
 * @param {PubSub} pubsub
 * @return PubSub / Exchange
 */

Exchange.prototype.pubsub = function (pubsub) {

  if (typeof pubsub === 'object' && pubsub instanceof PubSub) {

    if (this._pubsub) {
      this._pubsub.removeListener('message', this.onPubSubMessage);
    }
    
    this._pubsub = pubsub;
    this._pubsub.on('message', this.onPubSubMessage);

    return this;
  }

  if (!this._pubsub) {
    this.pubsub( PubSub() );
  }

  return this._pubsub;

};

/**
 * Sets or Gets the handler
 *
 * @api public
 * @param {EventEmitter} handler
 * @return EventEmitter / Exchange
 */

Exchange.prototype.handler = function (handler) {

  if (typeof handler === 'object' && handler instanceof events.EventEmitter) {
    this._handler = handler;
    return this;
  }

  if (!this._handler) {
    this.handler( new events.EventEmitter() );
  }

  return this._handler;
};

/**
 * Subscribes a listener to a channel
 *
 * @api public
 * @param {String} channel
 * @param {function} listener
 * @param {Function} cb
 * @return Exchange
 */

Exchange.prototype.subscribe = function (name, listener, cb) {
  debug('subscribe to channel %s', name);
  var self = this;
  var event = 'channel ' + name;
  if (this.listeners(event).length === 0) {
    this.pubsub().subscribe(name, function (err) {
      if (err) return cb(err);
      self.addListener(event, listener);
      cb(null, name);
    });
  }
  else {
    self.addListener(event, listener);
    cb(null, name);
  }
  return this;
};

/**
 * Unsubscribes a listener from a channel
 *
 * @api public
 * @param {String} channel
 * @param {function} listener
 * @param {Function} cb
 * @return Exchange
 */

Exchange.prototype.unsubscribe = function (name, listener, cb) {
  debug('unsubscribe from channel %s', name);
  var self = this;
  var event = 'channel ' + name;
  this.removeListener(event, listener);
  if (this.listeners(event).length === 0) {
    this.pubsub().unsubscribe(name, function (err) {
      if (err) return cb(err);
      cb(null, name);
    });
  }
  else {
    cb(null, name);  
  }
  return this;
};
