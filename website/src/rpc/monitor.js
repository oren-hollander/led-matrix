'use strict'

define([
  'lodash',
  'rpc/messages',
  'serialization/serialize'
], (
  _,
  Messages,
  {Serializable}
) => {

  function ConsoleMonitor(name){

    if(!console.groupCollapsed){
      const log = console.log
      let pad = 0
      const padString = () => _.map(new Array(pad), () => ' ').join('')

      console.groupCollapsed = (...args) => {
        console.log(...args)
        pad += 2
      }

      console.log = (firstArg, ...args) => {
        log(padString() + firstArg, ...args)
      }

      console.groupEnd = () => {
        pad -= 2
      }
    }

    const start = Date.now()

    const padMillis = millis => ('000' + millis).substr(-3, 3)

    const duration = millis => `${Math.floor(millis / 1000)}:${padMillis(millis % 1000)}`

    const now = () => duration(Date.now() - start)

    const prefix = messageType => `${now()} ${name}: ${messageType}`

    const batchLabel = (direction, rpcMessages) => `${direction} Batch ~ ${rpcLabels(rpcMessages)}`
    const priorityLabel = priority => {
      switch(priority){
        case -2:
          return 'None'
        case -1:
          return 'Immediate'
        case 0:
          return 'High'
        case 1000 / 60:
          return 'Animation'
        case 50:
          return 'Low'
        default:
          return `Custom (${priority})`
      }
    }

    const rpcLabels = rpcMessages => {
      const firstThree = _(rpcMessages)
        .take(3)
        .map(rpcLabel)
        .join(', ')

      return `[${rpcMessages.length > 3 ? `${firstThree}, ...` : firstThree}]`
    }

    const refIdLabel = (ref, id) => id ? `<${ref}|${id}>` : `<${ref}>`

    const rpcLabel = rpcMessage => `${rpcMessage.type} ${refIdLabel(rpcMessage.ref, rpcMessage.id)}`

    const messageLoggers = {
      [Messages.Types.Init]: (message, direction) => {
        const initMessage = prefix(`${direction} Init`)
        if(message.api.length > 0)
          console.log(`${initMessage} ~ [${message.api.join()}]`)
        else
          console.log(initMessage)
      },
      [Messages.Types.Batch]: (message, direction) => {
        console.groupCollapsed(prefix(batchLabel(direction, message.rpcMessages)))
        _.forEach(message.rpcMessages, log)
        console.groupEnd()
      },
      [Messages.Types.ApiCall]: message => {
        console.groupCollapsed(`${rpcLabel(message)} ${message.func}`)
        console.log(`ID: ${message.id}`)
        console.log(`Ref: ${message.ref}`)
        console.log(`Function: ${message.func}`)
        if(message.args.length > 0){
          console.groupCollapsed(`Arguments`)
          _.forEach(message.args, log)
          console.groupEnd()
        }
        else{
          console.log(`No arguments`)
        }
        console.log(`Return priority: ${priorityLabel(message.returnPriority)}`)
        console.groupEnd()
      },
      [Messages.Types.FunctionCall]: message => {
        console.groupCollapsed(`${rpcLabel(message)}`)
        console.log(`ID: ${message.id}`)
        console.log(`Ref: ${message.ref}`)
        if(message.args.length > 0){
          console.groupCollapsed(`Arguments`)
          _.forEach(message.args, log)
          console.groupEnd()
        }
        else{
          console.log(`No arguments`)
        }
        console.log(`Return priority: ${priorityLabel(message.returnPriority)}`)
        console.groupEnd()
      },
      [Messages.Types.Return]: message => {
        console.groupCollapsed(rpcLabel(message))
        console.log(`ID: ${message.id}`)
        console.log(`Ref: ${message.ref}`)
        log(message.value)
        if(message.callTimestamp)
          console.log(`Duration: ${duration(message.ts  - message.callTimestamp)}`)
        console.groupEnd()
      },
      [Messages.Types.Error]: message => {
        console.groupCollapsed(rpcLabel(message))
        console.log(`ID: ${message.id}`)
        console.log(`Ref: ${message.ref}`)
        console.log(`Error: ${message.error}`)
        if(message.callTimestamp)
          console.log(`Duration: ${duration(message.ts  - message.callTimestamp)}`)
        console.groupEnd()
      },
      [Messages.Types.ProxyPropertyUpdate]: message => {
        console.groupCollapsed(rpcLabel(message))
        console.log(`Ref: ${message.ref}`)
        console.log(`Property: ${message.prop}`)
        console.log(`Value: ${message.value}`)
        console.groupEnd()
      },
      [Messages.Types.StubPropertyUpdate]: message => {
        console.groupCollapsed(rpcLabel(message))
        console.log(`Ref: ${message.ref}`)
        console.log(`Property: ${message.prop}`)
        console.log(`Value: ${message.value}`)
        console.groupEnd()
      },
      [Messages.Types.Value]: message => {
        if(message.value === undefined)
          console.log('No value')
        else if(message.value[Serializable])
          console.log(`Value serialized with '${message.value[Serializable]}' serializer`)
        else
          console.log(`Value: ${message.value}`)
      },
      [Messages.Types.Api]: message => {
        console.groupCollapsed(`Api: ${refIdLabel(message.ref)}`)
        console.log(`Ref: ${message.ref}`)

        if(message.functionNames.length > 0){
          console.log(`Functions: ${message.functionNames.join()}`)
        }
        else {
          console.log('No functions')
        }

        console.groupEnd()
      },
      [Messages.Types.Function]: message => {
        console.groupCollapsed(`Function: ${refIdLabel(message.ref)}`)
        console.log(`Ref: ${message.ref}`)
        console.groupEnd()
      },
      [Messages.Types.SharedObject]: message => {
        console.groupCollapsed(`Shared Object: ${refIdLabel(message.ref)}`)
        console.log(`Ref: ${message.ref}`)
        console.log(`Properties: ${JSON.stringify(message.properties)}`)
        console.groupEnd()
      }
    }

    function log(message, direction) {
      messageLoggers[message.type](message, direction)
    }

    function queueMessage(rpcMessage) {
      console.groupCollapsed(prefix(`Add To Queue ~ ${rpcLabel(rpcMessage)}`))
      log(rpcMessage)
      console.groupEnd()
    }

    function drainMessageQueue(rpcMessages) {
      console.groupCollapsed(prefix(`Drain Queue ~ ${rpcLabels(rpcMessages)}`))
      rpcMessages.forEach(rpcMessage => {
        log(rpcMessage)
      })
      console.groupEnd()
    }

    function outgoingMessage(message){
      log(message, 'Outgoing')
    }

    function incomingMessage(message){
      log(message, 'Incoming')
    }

    return {queueMessage, drainMessageQueue, outgoingMessage, incomingMessage}
  }

  function StatsMonitor(){
    let stats

    function init() {
      stats = {
        start: Date.now(),
        queuedMessages: 0,
        queueDrains: 0,
        outgoingMessages: 0,
        incomingMessages: 0,
        outgoingCalls: 0,
        incomingCalls: 0,
        outgoingReturns: 0,
        incomingReturns: 0,
        outgoingErrors: 0,
        incomingErrors: 0,
        outgoingProxyPropertyUpdates: 0,
        incomingProxyPropertyUpdates: 0,
        outgoingStubPropertyUpdate: 0,
        incomingStubPropertyUpdate: 0
      }
    }

    init()

    function queueMessage() {
      stats.outgoingMessages++
    }

    function drainMessageQueue() {
      stats.queueDrains++
    }

    function countsByMessageType(rpcMessages) {
      return _(rpcMessages)
        .groupBy('type')
        .mapValues(_.size)
        .value()
    }

    function outgoingMessage(message){
      stats.outgoingMessages++
      if(message.type === Messages.Types.Batch){
        const messagesTypeCounts = countsByMessageType(message.rpcMessages)

        stats.outgoingCalls += messagesTypeCounts[Messages.Types.Call]
        stats.outgoingReturns += messagesByType[Messages.Types.Return]
        stats.outgoingErrors += messagesByType[Messages.Types.Error]
        stats.outgoingProxyPropertyUpdates += messagesByType[Messages.Types.ProxyPropertyUpdate]
        stats.outgoingStubPropertyUpdate += messagesByType[Messages.Types.StubPropertyUpdate]
      }
    }

    function incomingMessage(message){
      stats.incomingMessages++
      if(message.type === Messages.Types.Batch){
        const messagesTypeCounts = countsByMessageType(message.rpcMessages)

        stats.incomingCalls += messagesTypeCounts[Messages.Types.Call]
        stats.incomingReturns += messagesByType[Messages.Types.Return]
        stats.incomingErrors += messagesByType[Messages.Types.Error]
        stats.incomingProxyPropertyUpdates += messagesByType[Messages.Types.ProxyPropertyUpdate]
        stats.incomingStubPropertyUpdate += messagesByType[Messages.Types.StubPropertyUpdate]
      }
    }

    function getStats() {
      stats.end = Date.now()
      return stats
    }

    return {queueMessage, drainMessageQueue, outgoingMessage, incomingMessage, stats: getStats, clear: init}
  }

  function ConsoleWithStatsMonitor(name, delay){
    const consoleMonitor = ConsoleMonitor(name)
    const statsMonitor = StatsMonitor()

    function queueMessage(rpcMessage) {
      consoleMonitor.queueMessage(rpcMessage)
      statsMonitor.queueMessage(rpcMessage)
    }

    function drainMessageQueue(rpcMessages) {
      consoleMonitor.drainMessageQueue(rpcMessages)
      statsMonitor.drainMessageQueue(rpcMessages)
    }

    function outgoingMessage(message){
      consoleMonitor.outgoingMessage(message)
      statsMonitor.outgoingMessage(message)
    }

    function incomingMessage(message){
      consoleMonitor.incomingMessage(message)
      statsMonitor.incomingMessage(message)
    }

    setInterval(() => {
      console.log(name, 'stats', statsMonitor.stats())
    }, delay)

    return {queueMessage, drainMessageQueue, outgoingMessage, incomingMessage}
  }

  return {ConsoleMonitor, StatsMonitor, ConsoleWithStatsMonitor}
})