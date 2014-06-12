var util = require('util')
  , events = require('events')
  , kue = require('kue')
  , Message = require('bus.io-common').Message
  ;

/*
 * We use a queue to process events when we must handle the events sequentially
 */

function Queue (q) {
  if (!(this instanceof Queue)) return new Queue(q);
  events.EventEmitter.call(this);
  var self = this;

  this.onMessage = function (message, done) {
    self.emit('message', Message(message.data));
    done();
  };

  this.q = q && q.process ? q : kue.createQueue();
  this.q.process('message', this.onMessage);
}

util.inherits(Queue, events.EventEmitter);

/**
 * Sends a message to the queue
 *
 * @param object message
 * @return Queue
 */

Queue.prototype.send = function (message) {
  this.q.create('message', message).save();
  return this;
};

module.exports = Queue;
