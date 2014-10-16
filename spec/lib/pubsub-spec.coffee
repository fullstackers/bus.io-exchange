EventEmitter = require('events').EventEmitter

describe 'PubSub', ->

  Given -> @Message = require('bus.io-common').Message

  Given ->
    @Redis = class Redis extends EventEmitter
      publish: (c, m) ->
      subscribe: (c, cb) -> cb()
      unsubscribe: (c, cb) -> cb()
    @Redis.createClient = -> new Redis

  Given -> @PubSub = requireSubject 'lib/pubsub', {
    'redis': @Redis
  }

  Given -> @pub = @Redis.createClient()
  Given -> @sub = @Redis.createClient()

  context 'prototoype', ->

    Given -> @prefix = 'p'
    Given -> @instance = @PubSub @pub, @sub, @prefix
    Given -> @channel = 'channel'
    Given -> @message = @Message()

    describe '#send', ->

      Given -> spyOn(@pub,['publish']).andCallThrough()

      context 'with prefix', ->

        When -> @instance.send @message, @channel, @prefix
        Then -> expect(@pub.publish).toHaveBeenCalledWith @prefix + @channel, encodeURIComponent(JSON.stringify(@message.data))

      context 'without prefix (undefined) should give us the default prefix + channel', ->

        When -> @instance.send @message, @channel
        Then -> expect(@pub.publish).toHaveBeenCalledWith @prefix + @channel, encodeURIComponent(JSON.stringify(@message.data))

      context 'with a blank prefix "" should publish to just the channel', ->

        When -> @instance.send @message, @channel, ''
        Then -> expect(@pub.publish).toHaveBeenCalledWith @channel, encodeURIComponent(JSON.stringify(@message.data))


    describe '#subscribe', ->

      Given -> @cb = jasmine.createSpy 'cb'
      Given -> spyOn(@sub,['subscribe']).andCallThrough()
      Given -> spyOn(@instance, ['emit']).andCallThrough()
      When -> @instance.subscribe @channel, @cb
      Then -> expect(@sub.subscribe).toHaveBeenCalledWith @prefix + @channel, jasmine.any(Function)
      And -> expect(@instance.emit).toHaveBeenCalledWith 'subscribed ' + @channel

    describe '#unsubscribe', ->

      Given -> @instance.subscribe @channel, ->
      Given -> @cb = jasmine.createSpy 'cb'
      Given -> spyOn(@instance, ['emit']).andCallThrough()
      Given -> spyOn(@sub,['unsubscribe']).andCallThrough()
      When -> @instance.unsubscribe @channel, @cb
      Then -> expect(@sub.unsubscribe).toHaveBeenCalledWith @prefix + @channel, jasmine.any(Function)
      And -> expect(@instance.emit).toHaveBeenCalledWith 'unsubscribed ' + @channel

