var util = require('util')
  , events = require('events')
  , debug = require('debug')('bus.io-exchange:queue')
  , kue = require('kue')
  , Message = require('bus.io-common').Message
  ;

/*
 * We use a queue to process events when we must handle the events sequentially
 */

module.exports = Queue;

function Queue (q) {
  if (!(this instanceof Queue)) return new Queue(q);

  debug('new queue', typeof q);

  events.EventEmitter.call(this);
  var self = this;

  /**
   * Handles a message from the queue
   *
   * @api private
   * @param {Object} message
   * @param {Function} done
   */

  this.onMessage = function (message, done) {
    try {
      debug('on message');
      self.emit('message', Message(message.data));
    }
    catch(e){ 
      console.error(e);
      self.emit('error', e);
    } 
    finally {
      done();
    }
  };

  this.q = q && q.process ? q : kue.createQueue();
  this.q.process('message', this.onMessage);
}

util.inherits(Queue, events.EventEmitter);

/**
 * Sends a message to the queue
 *
 * @api public
 * @param object message
 * @return Queue
 */

Queue.prototype.send = function (message) {
  debug('send message');
  this.q.create('message', message).save();
  return this;
};
