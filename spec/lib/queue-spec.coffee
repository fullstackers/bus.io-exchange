EventEmitter = require('events').EventEmitter

describe 'Queue', ->

  Given -> @Message = require('bus.io-common').Message

  Given ->
    @Kue = class Kue extends EventEmitter
      process: (message, handler) ->
        @handler = handler
      create: (message, data) ->
        save: =>
          @handler data, ->
    @Kue.createClient = -> new Kue

  Given -> @client = @Kue.createClient()

  Given -> @Queue = requireSubject 'lib/queue', {
    'kue': @Kue
  }

  context 'prototype', ->

    Given -> @instance = @Queue @client
    Given -> @message = @Message()

    describe '#send (message:Message)', ->
      Given -> spyOn(@client,['create']).andCallThrough()
      When -> @instance.send @message
      Then -> expect(@client.create).toHaveBeenCalledWith 'message', @message

    describe '#onMessage (message:Message)', ->
      Given -> @cb = jasmine.createSpy 'done'
      Given -> spyOn(@instance,['emit']).andCallThrough()
      When -> @instance.onMessage @message, @cb
      Then -> expect(@instance.emit).toHaveBeenCalled()
      And -> expect(@cb).toHaveBeenCalled()

