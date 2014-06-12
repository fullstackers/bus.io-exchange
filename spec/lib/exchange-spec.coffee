EventEmitter = require('events').EventEmitter

describe.only 'Exchange', ->

  Given -> @Message = require('bus.io-common').Message

  Given ->
    @Queue = class Queue extends EventEmitter
      constructor: ->
        if not (@ instanceof Queue)
          return new Queue
      send: ->

  Given ->
    @PubSub = class PubSub extends EventEmitter
      constructor: ->
        if not (@ instanceof PubSub)
          return new PubSub
      send: ->
      subscribe: ->
      unsubscribe: ->

  Given ->
    @Exchange = requireSubject 'lib/exchange', {
      './queue': @Queue,
      './pubsub': @PubSub
    }

  Given -> @q = @Queue()
  Given -> @p = @PubSub()
  Given -> @h = new EventEmitter

  describe '#make', ->

    When -> @res = @Exchange()
    Then -> expect(typeof @res).toBe 'object'
    And -> expect(@res instanceof @Exchange).toBe true

    context '(queue:Queue, pubsub:PubSub, handler:EventEmitter)', ->
      
      When -> @res = @Exchange @q, @p, @h
      Then -> expect(typeof @res).toBe 'object'
      And -> expect(@res instanceof @Exchange).toBe true

  context 'prototype', ->

    Given -> @instance = @Exchange @q, @p, @h

    describe '#publish', ->
     
      Given -> @message = @Message()

      context '(message:Object, channel:String)', ->
        Given -> @channel = 'channel'
        Given -> spyOn(@p,['send']).andCallThrough()
        When -> @instance.publish @message, @channel
        Then -> expect(@p.send).toHaveBeenCalledWith @message, @channel

      context '(message:Object)', ->
        Given -> spyOn(@q, ['send']).andCallThrough()
        When -> @instance.publish @message
        Then -> expect(@q.send).toHaveBeenCalledWith @message

    describe '#queue', ->

      When -> @res = @instance.queue()
      Then -> expect(@res instanceof @Queue).toBe true
      And -> expect(@res.listeners('message')[0]).toEqual @instance.onQueueMessage

      context '(queue:Queue)', ->

        Given -> @q = @Queue()
        Given -> @existing = @instance.queue()
        Given -> spyOn(@existing,['removeListener']).andCallThrough()
        Given -> spyOn(@q,['on']).andCallThrough()
        When -> @res = @instance.queue(@q).queue()
        Then -> expect(@res instanceof @Queue).toBe true
        And -> expect(@res).toEqual @q
        And -> expect(@existing.removeListener).toHaveBeenCalledWith 'message', @instance.onQueueMessage
        And -> expect(@q.on).toHaveBeenCalledWith 'message', @instance.onQueueMessage

    describe '#pubsub', ->

      When -> @res = @instance.pubsub()
      Then -> expect(@res instanceof @PubSub).toBe true
      And -> expect(@res.listeners('message')[0]).toEqual @instance.onPubSubMessage

      context '(pubsub:PubSub)', ->

        Given -> @q = @PubSub()
        Given -> @existing = @instance.pubsub()
        Given -> spyOn(@existing,['removeListener']).andCallThrough()
        Given -> spyOn(@q,['on']).andCallThrough()
        When -> @res = @instance.pubsub(@q).pubsub()
        Then -> expect(@res instanceof @PubSub).toBe true
        And -> expect(@res).toEqual @q
        And -> expect(@existing.removeListener).toHaveBeenCalledWith 'message', @instance.onPubSubMessage
        And -> expect(@q.on).toHaveBeenCalledWith 'message', @instance.onPubSubMessage

    describe '#handler', ->

      When -> @res = @instance.handler()
      Then -> expect(@res instanceof EventEmitter).toBe true

      context '(handler:EventEmitter)', ->

        Given -> @handler = new EventEmitter
        When -> @res = @instance.handler(@handler).handler()
        Then -> expect(@res).toBe @handler

    describe '#onQueueMessage (message:Message)', ->

      Given -> @message = @Message()
      Given -> @handler = @instance.handler()
      Given -> spyOn(@handler, ['emit']).andCallThrough()
      When -> @instance.onQueueMessage @message
      Then -> expect(@handler.emit).toHaveBeenCalledWith @message.action(), @message, @instance

    describe '#onPubSubMessage (message:Message)', ->

      Given -> @channel = 'channel'
      Given -> @message = @Message()
      Given -> spyOn(@instance, ['emit']).andCallThrough()
      When -> @instance.onPubSubMessage @channel, @message
      Then -> expect(@instance.emit).toHaveBeenCalledWith 'channel ' + @channel, @message
