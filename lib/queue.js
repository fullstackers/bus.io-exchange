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

  if (!(q && q.process)) {
    q = (function () {
      var q = kue.createQueue();
      return q;
    })();
  }
  q.process('message', this.onMessage);
  q.on('job complete', function (id, result) {
    kue.Job.get(id, function (err, job) {
      if (err) return self.emit('error', err);
      job.remove(function (err) {
        if (err) return self.emit('error', err);
      });
    });
  });

  this.q = q;
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
