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
      [Messages.Types.ReleaseProxy]: (message, direction) => {
        console.log(prefix(`${direction} Release Proxy ${refIdLabel(message.ref)}`))
      },
      [Messages.Types.ReleaseStub]: (message, direction) => {
        console.log(prefix(`${direction} Release Stub ${refIdLabel(message.ref)}`))
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
      log(rpcMessage, '')
      console.groupEnd()
    }

    function drainMessageQueue(rpcMessages) {
      console.groupCollapsed(prefix(`Drain Queue ~ ${rpcLabels(rpcMessages)}`))
      rpcMessages.forEach(rpcMessage => {
        log(rpcMessage, '')
      })
      console.groupEnd()
    }

    function outgoingMessage(message){
      log(message, 'Outgoing')
    }

    function incomingMessage(message){
      log(message, 'Incoming')
    }

    function serializeStart(){}
    function serializeEnd(size, available){}
    function deserializeStart(){}
    function deserializeEnd(){}
    function bufferAllocation(){}

    return {queueMessage, drainMessageQueue, outgoingMessage, incomingMessage, serializeStart, serializeEnd, deserializeStart, deserializeEnd, bufferAllocation}
  }

  function StatsMonitor(name){
    let stats

    function init() {
      stats = {
        start: Date.now(),
        queuedMessages: 0,
        queueDrains: 0,
        outgoingMessages: 0,
        incomingMessages: 0,
        outgoingApiCalls: 0,
        incomingApiCalls: 0,
        outgoingFunctionCalls: 0,
        incomingFunctionCalls: 0,
        outgoingReturns: 0,
        incomingReturns: 0,
        outgoingErrors: 0,
        incomingErrors: 0,
        outgoingProxyPropertyUpdates: 0,
        incomingProxyPropertyUpdates: 0,
        outgoingStubPropertyUpdate: 0,
        incomingStubPropertyUpdate: 0,
        buffers: [],
        serializations: [],
        deserializations: []
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
      const counts = _(rpcMessages)
        .groupBy('type')
        .mapValues(_.size)
        .value()

      return _(Messages.Types).invert().mapValues(() => 0).assign(counts).value()
    }

    function outgoingMessage(message){
      if(message.type === Messages.Types.Batch){
        stats.outgoingMessages++
        const messagesTypeCounts = countsByMessageType(message.rpcMessages)

        stats.outgoingApiCalls += messagesTypeCounts[Messages.Types.ApiCall]
        stats.outgoingFunctionCalls += messagesTypeCounts[Messages.Types.FunctionCall]
        stats.outgoingReturns += messagesTypeCounts[Messages.Types.Return]
        stats.outgoingErrors += messagesTypeCounts[Messages.Types.Error]
        stats.outgoingProxyPropertyUpdates += messagesTypeCounts[Messages.Types.ProxyPropertyUpdate]
        stats.outgoingStubPropertyUpdate += messagesTypeCounts[Messages.Types.StubPropertyUpdate]
      }
    }

    function incomingMessage(message){
      if(message.type === Messages.Types.Batch){
        stats.incomingMessages++
        const messagesTypeCounts = countsByMessageType(message.rpcMessages)

        stats.incomingApiCalls += messagesTypeCounts[Messages.Types.ApiCall]
        stats.incomingFunctionCalls += messagesTypeCounts[Messages.Types.FunctionCall]
        stats.incomingReturns += messagesTypeCounts[Messages.Types.Return]
        stats.incomingErrors += messagesTypeCounts[Messages.Types.Error]
        stats.incomingProxyPropertyUpdates += messagesTypeCounts[Messages.Types.ProxyPropertyUpdate]
        stats.incomingStubPropertyUpdate += messagesTypeCounts[Messages.Types.StubPropertyUpdate]
      }
    }

    function serializeStart(){
      stats.serializations.push(Date.now())
    }

    function serializeEnd(){
      stats.serializations[stats.serializations.length - 1] = Date.now() - stats.serializations[stats.serializations.length - 1]
    }

    function deserializeStart(){
      stats.deserializations.push(Date.now())
    }

    function deserializeEnd(){
      stats.deserializations[stats.deserializations.length - 1] = Date.now() - stats.deserializations[stats.deserializations.length - 1]
    }

    function bufferAllocation(size, available){
      stats.buffers.push({size, available})
    }

    function getStats() {
      stats.end = Date.now()
      return stats
    }

    const percent = n => `${Math.floor(n * 10000) / 100}%`
    // const percent = n => n

    function log(){
      console.log(name)
      console.groupCollapsed('Messages')
      console.log(`Outgoing: ${stats.outgoingMessages}`)
      console.log(`Incoming: ${stats.incomingMessages}`)

      console.groupCollapsed('API calls')
      console.log(`Outgoing: ${stats.outgoingApiCalls}`)
      console.log(`Incoming: ${stats.incomingApiCalls}`)
      console.groupEnd()
      console.groupCollapsed('Function calls')
      console.log(`Outgoing: ${stats.outgoingFunctionCalls}`)
      console.log(`Incoming: ${stats.incomingFunctionCalls}`)
      console.groupEnd()
      console.groupCollapsed('Returns')
      console.log(`Outgoing: ${stats.outgoingReturns}`)
      console.log(`Incoming: ${stats.incomingReturns}`)
      console.groupEnd()
      console.groupCollapsed('Errors')
      console.log(`Outgoing: ${stats.outgoingErrors}`)
      console.log(`Incoming: ${stats.incomingErrors}`)
      console.groupEnd()
      console.groupCollapsed('Proxy Property Updates')
      console.log(`Outgoing: ${stats.outgoingProxyPropertyUpdates}`)
      console.log(`Incoming: ${stats.incomingProxyPropertyUpdates}`)
      console.groupEnd()
      console.groupCollapsed('Stub Property Updates')
      console.log(`Outgoing: ${stats.outgoingStubPropertyUpdate}`)
      console.log(`Incoming: ${stats.incomingStubPropertyUpdate}`)
      console.groupEnd()

      console.groupEnd()

      console.groupCollapsed('Queue')
      console.log(`${stats.queuedMessages} messages queued`)
      console.log(`${stats.queueDrains} messages drained`)
      console.groupEnd()

      console.groupCollapsed('Buffers')
      console.log(`${stats.buffers.length} buffers allocated`)
      console.log(`Average buffer size: ${_.sumBy(stats.buffers, 'size') / stats.buffers.length}`)
      console.log(`Average buffer utilization: ${percent(_.sumBy(stats.buffers, buf => (buf.size - buf.available) / buf.size) / stats.buffers.length)}`)
      console.groupCollapsed('Details')
      _.forEach(stats.buffers, buffer => {
        console.log(`Size: ${buffer.size}, Available: ${buffer.available}, Utilization: ${percent((buffer.size - buffer.available) / buffer.size)}`)
      })
      console.groupEnd()
      console.groupEnd()

      console.groupCollapsed('Serializations')
      console.log(`Serializations: ${stats.serializations.length}`)
      console.log(`Average serialization time: ${_.sum(stats.serializations) / stats.serializations.length} ms`)
      console.log(`Deserializations: ${stats.deserializations.length}`)
      console.log(`Average deserialization time: ${_.sum(stats.deserializations) / stats.deserializations.length} ms`)
      console.groupEnd()
    }

    return {queueMessage, drainMessageQueue, outgoingMessage, incomingMessage,
      serializeStart, serializeEnd, deserializeStart, deserializeEnd, bufferAllocation, log, stats: getStats, clear: init}
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