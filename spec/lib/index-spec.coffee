describe 'lib', ->

  Given -> @package = version: 1

  Given -> @Queue = class Queue
  Given -> @PubSub = class PubSub
  Given -> 
    @Exchange = class Exchange
      constructor: ->
        if not (@ instanceof Exchange)
          return new Exchange

  Given -> @lib = requireSubject 'lib', {
    './../package.json': @package
    './exchange': @Exchange
    './pubsub': @PubSub
    './queue': @Queue
  }

  Then -> expect(typeof @lib).toBe 'function'

  describe '#', ->

    Then -> expect(@lib() instanceof @Exchange).toBe true

  describe '.version', ->

    Then -> expect(@lib.version).toEqual @package.version

  describe '.Exchange', ->

    Then -> expect(@lib.Exchange).toBe @Exchange

  describe '.PubSub', ->

    Then -> expect(@lib.PubSub).toBe @PubSub

  describe '.Queue', ->

    Then -> expect(@lib.Queue).toBe @Queue
