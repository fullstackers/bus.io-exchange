[![Build Status](https://travis-ci.org/turbonetix/bus.io-exchange.svg?branch=master)](https://travis-ci.org/turbonetix/bus.io-exchange.git)
[![NPM version](https://badge.fury.io/js/bus.io-exchange.svg)](http://badge.fury.io/js/bus.io-exchange)
[![David DM](https://david-dm.org/turbonetix/bus.io-exchange.png)](https://david-dm.org/turbonetix/bus.io-exchange.png)

![Bus.IO](https://raw.github.com/turbonetix/bus.io/master/logo.png)

A **[bus.io](https://www.npmjs.org/package/bus.io "Bus.io")** dependency.

The message exchange provides an iterface for publishing a message to a queue, handling that message, and potentially propagating that message to its destination.

# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Install redis (See download and install instructions http://redis.io/topics/quickstart)

Install coffee-script

    > npm install coffee-script -g

Clone this repository

    > git clone git@github.com:turbonetix/bus.io-exchange.git

cd into the directory and install the dependencies

    > cd bus.io-exchange
    > npm install && npm shrinkwrap --dev

# API

## Exchange

This is wheere we publish, handle, and propagate messages.

### Exchange#()

```javascript

var exchange = require('bus.io-exchange')();

```

### Exchange#(queue:Queue, pubsub:Pubsub, handler:EventEmitter)

```javascript

var Exchange = require('bus.io-exchange');
var exchange = Exchange(Exchange.Queue(), Exchange.PubSub());

```

### Exchange#make(queue:Queue, pubsub:Pubsub, handler:EventEmitter)

```javascript

var Exchange = require('bus.io-exchange');

var queue = Exchange.Queue();
var pubsub = Exchange.PubSub();
var handler = new EventEmitter();

var exchange = Exchange(queue, pubsub, handler);

```

### Exchange#publish(message:Object)

Puts the message onto the `Queue`.

```javascript

var Message = require('bus.io-common').Message;

exchange.publish( Message() );

```

### Exchange#publish(message:Object, channel:String)

Puts the message onto the `PubSub` with the `channel` being `"everyone"`.

```javascript

var message = Message();

exchange.publish( message, 'everyone' );

```

### Exchange#subscribe(channel:String, listener:Function, cb:Function)

Subscribes a `listener` to the channel and invokes the callback when the
channel as been subscribed.

```javascript 

exchange.subscribe('some channel', function listener (message) { 

//this gets called when we receive a message on the channel

}, function callback (err, channel) { 

//this gets called when we subscribed to the channel

});

```

### Exchange#unsubscribe(channel:String, listener:Function, cb:Function)

Unsubscribes the `listener` from the channel and invokes the callback when the
listener as been unsubscribed.

```javascript 

var listener = function (message) { };

exchange.unsubscribe('some channel', listener, function callback (err, channel) { 

//this gets called when we unsubscribed from the channel

});

```


### Exchange#queue()

Gets the `Queue` instance.

```javascript

var queue = Exchange.queue();
queue.send(Message());

```

### Exchange#queue(queue:Queue)

Sets the `Queue` instance.

```javascript

var kue = require('kue');
var queue = messageExchange.Queue.make(kue.createClient());

exchange.queue(queue);

```

### Exchange#pubsub()

Gets the pubsub instance.

```javascript

var pubsub = exchange.pubsub();
pubsub.send(message, 'everyone');

```

### Exchange#pubsub(pubsub:PubSub)

Sets the pubsub instance.

```javascript

var redis = require('redis');

var pub = redis.createClient();
var sub = redis.createClient();

var pubsub = messageExchange.PubSub.make(pub, sub);

exchange.pubsub(pubsub);

```

### Exchange#handler()

Gets the handler which is an `EventEmitter`.

```javascript

var handler = exchange.handler();
handler.on('some message', function (message, exchange) {
  // do something
  exchange.channel(message.target).publish(message);
});

```

### Exchange#handler(handler:EventEmitter)

Sets the handler.

```javascript

var events = require('events');

var handler = new events.EventEmitter;
handler.on('some message', function (message, exchange) {
  // do something
  exchange.channel(message.target).publish(message);
});

exchange.handler(handler);

```

# Running Tests

## Unit Tests

Tests are run using grunt.  You must first globally install the grunt-cli with npm.

    > sudo npm install -g grunt-cli

To run the tests, just run grunt

    > grunt

# TODO

* Support different queues
* Support different pubsubs
