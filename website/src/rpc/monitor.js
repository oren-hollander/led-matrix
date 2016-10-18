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

  const ConsoleLogger = {
    log: console.log,
    group: console.groupCollapsed,
    groupEnd: console.groupEnd
  }

  function NodeConsoleLogger() {

    let pad = 0

    const padString = () => _.map(new Array(pad), () => ' ').join('')

    function log(message) {
      console.log(padString() + message)
    }

    function group(message) {
      log(message)
      pad += 2
    }

    function groupEnd() {
      pad -= 2
    }

    return {log, group, groupEnd}
  }

  const LogMessages = {
    Log: 0,
    LogGroup: 1,
    LogGroupEnd: 2
  }
  function LocalLogger(logger) {
    return (message) => {
      switch (message.op) {
        case LogMessages.Log:
          logger.log(message.message)
          break
        case LogMessages.LogGroup:
          logger.group(message.message)
          break
        case LogMessages.LogGroupEnd:
          logger.groupEnd()
          break
      }
    }
  }

  function RemoteLogger(channel) {

    function log(message) {
      channel.send({op: LogMessages.Log, message})
    }

    function group(message) {
      channel.send({op: LogMessages.LogGroup, message})
    }

    function groupEnd() {
      channel.send({op: LogMessages.LogGroupEnd})
    }

    return {log, group, groupEnd}
  }

  function RpcMonitor(name, logger){

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
        logger.log(`${initMessage} ${refIdLabel(message.rootRef)}`)
      },
      [Messages.Types.Batch]: (message, direction) => {
        logger.group(prefix(batchLabel(direction, message.rpcMessages)))
        _.forEach(message.rpcMessages, log)
        logger.groupEnd()
      },
      [Messages.Types.ReleaseProxy]: (message, direction) => {
        logger.log(prefix(`${direction} Release Proxy ${refIdLabel(message.ref)}`))
      },
      [Messages.Types.ReleaseStub]: (message, direction) => {
        logger.log(prefix(`${direction} Release Stub ${refIdLabel(message.ref)}`))
      },
      [Messages.Types.ApiCall]: message => {
        logger.group(`${rpcLabel(message)} ${message.func}`)
        logger.log(`ID: ${message.id}`)
        logger.log(`Ref: ${message.ref}`)
        logger.log(`Function: ${message.func}`)
        if(message.args.length > 0){
          logger.group(`Arguments`)
          _.forEach(message.args, log)
          logger.groupEnd()
        }
        else{
          logger.log(`No arguments`)
        }
        logger.log(`Return priority: ${priorityLabel(message.returnPriority)}`)
        logger.groupEnd()
      },
      [Messages.Types.FunctionCall]: message => {
        logger.group(`${rpcLabel(message)}`)
        logger.log(`ID: ${message.id}`)
        logger.log(`Ref: ${message.ref}`)
        if(message.args.length > 0){
          logger.group(`Arguments`)
          _.forEach(message.args, log)
          logger.groupEnd()
        }
        else{
          logger.log(`No arguments`)
        }
        logger.log(`Return priority: ${priorityLabel(message.returnPriority)}`)
        logger.groupEnd()
      },
      [Messages.Types.Return]: message => {
        logger.group(rpcLabel(message))
        logger.log(`ID: ${message.id}`)
        logger.log(`Ref: ${message.ref}`)
        log(message.value)
        if(message.callTimestamp)
          logger.log(`Duration: ${duration(message.ts  - message.callTimestamp)}`)
        logger.groupEnd()
      },
      [Messages.Types.Error]: message => {
        logger.group(rpcLabel(message))
        logger.log(`ID: ${message.id}`)
        logger.log(`Ref: ${message.ref}`)
        logger.log(`Error: ${message.error}`)
        if(message.callTimestamp)
          logger.log(`Duration: ${duration(message.ts  - message.callTimestamp)}`)
        logger.groupEnd()
      },
      [Messages.Types.ProxyPropertyUpdate]: message => {
        logger.group(rpcLabel(message))
        logger.log(`Ref: ${message.ref}`)
        logger.log(`Property: ${message.prop}`)
        logger.log(`Value: ${message.value}`)
        logger.groupEnd()
      },
      [Messages.Types.StubPropertyUpdate]: message => {
        logger.group(rpcLabel(message))
        logger.log(`Ref: ${message.ref}`)
        logger.log(`Property: ${message.prop}`)
        logger.log(`Value: ${message.value}`)
        logger.groupEnd()
      },
      [Messages.Types.Value]: message => {
        if(message.value === undefined)
          logger.log('No value')
        else if(message.value[Serializable])
          logger.log(`Value serialized with '${message.value[Serializable]}' serializer`)
        else
          logger.log('Value: ', message.value)
      },
      [Messages.Types.Api]: message => {
        logger.group(`Api: ${refIdLabel(message.ref)}`)
        logger.log(`Ref: ${message.ref}`)

        if(message.functionNames.length > 0){
          logger.log(`Functions: ${message.functionNames.join()}`)
        }
        else {
          logger.log('No functions')
        }

        logger.groupEnd()
      },
      [Messages.Types.Function]: message => {
        logger.group(`Function: ${refIdLabel(message.ref)}`)
        logger.log(`Ref: ${message.ref}`)
        logger.groupEnd()
      },
      [Messages.Types.SharedObject]: message => {
        logger.group(`Shared Object: ${refIdLabel(message.ref)}`)
        logger.log(`Ref: ${message.ref}`)
        logger.log(`Properties: ${JSON.stringify(message.properties)}`)
        logger.groupEnd()
      }
    }

    function log(message, direction) {
      messageLoggers[message.type](message, direction)
    }

    function queueMessage(rpcMessage) {
      logger.group(prefix(`Add To Queue ~ ${rpcLabel(rpcMessage)}`))
      log(rpcMessage, '')
      logger.groupEnd()
    }

    function drainMessageQueue(rpcMessages) {
      logger.group(prefix(`Drain Queue ~ ${rpcLabels(rpcMessages)}`))
      rpcMessages.forEach(rpcMessage => {
        log(rpcMessage, '')
      })
      logger.groupEnd()
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

  function StatsMonitor(name, logger){
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

    function log(){
      logger.log(name)
      logger.group('Messages')
      logger.log(`Outgoing: ${stats.outgoingMessages}`)
      logger.log(`Incoming: ${stats.incomingMessages}`)

      logger.group('API calls')
      logger.log(`Outgoing: ${stats.outgoingApiCalls}`)
      logger.log(`Incoming: ${stats.incomingApiCalls}`)
      logger.groupEnd()
      logger.group('Function calls')
      logger.log(`Outgoing: ${stats.outgoingFunctionCalls}`)
      logger.log(`Incoming: ${stats.incomingFunctionCalls}`)
      logger.groupEnd()
      logger.group('Returns')
      logger.log(`Outgoing: ${stats.outgoingReturns}`)
      logger.log(`Incoming: ${stats.incomingReturns}`)
      logger.groupEnd()
      logger.group('Errors')
      logger.log(`Outgoing: ${stats.outgoingErrors}`)
      logger.log(`Incoming: ${stats.incomingErrors}`)
      logger.groupEnd()
      logger.group('Proxy Property Updates')
      logger.log(`Outgoing: ${stats.outgoingProxyPropertyUpdates}`)
      logger.log(`Incoming: ${stats.incomingProxyPropertyUpdates}`)
      logger.groupEnd()
      logger.group('Stub Property Updates')
      logger.log(`Outgoing: ${stats.outgoingStubPropertyUpdate}`)
      logger.log(`Incoming: ${stats.incomingStubPropertyUpdate}`)
      logger.groupEnd()

      logger.groupEnd()

      logger.group('Queue')
      logger.log(`${stats.queuedMessages} messages queued`)
      logger.log(`${stats.queueDrains} messages drained`)
      logger.groupEnd()

      logger.group('Buffers')
      logger.log(`${stats.buffers.length} buffers allocated`)
      logger.log(`Average buffer size: ${_.sumBy(stats.buffers, 'size') / stats.buffers.length}`)
      logger.log(`Average buffer utilization: ${percent(_.sumBy(stats.buffers, buf => (buf.size - buf.available) / buf.size) / stats.buffers.length)}`)
      logger.group('Details')
      _.forEach(stats.buffers, buffer => {
        logger.log(`Size: ${buffer.size}, Available: ${buffer.available}, Utilization: ${percent((buffer.size - buffer.available) / buffer.size)}`)
      })
      logger.groupEnd()
      logger.groupEnd()

      logger.group('Serializations')
      logger.log(`Serializations: ${stats.serializations.length}`)
      logger.log(`Average serialization time: ${_.sum(stats.serializations) / stats.serializations.length} ms`)
      logger.log(`Deserializations: ${stats.deserializations.length}`)
      logger.log(`Average deserialization time: ${_.sum(stats.deserializations) / stats.deserializations.length} ms`)
      logger.groupEnd()
    }

    return {queueMessage, drainMessageQueue, outgoingMessage, incomingMessage,
      serializeStart, serializeEnd, deserializeStart, deserializeEnd, bufferAllocation, log, stats: getStats, clear: init}
  }

  // function ConsoleWithStatsMonitor(name, delay){
  //   const consoleMonitor = ConsoleMonitor(name)
  //   const statsMonitor = StatsMonitor()
  //
  //   function queueMessage(rpcMessage) {
  //     consoleMonitor.queueMessage(rpcMessage)
  //     statsMonitor.queueMessage(rpcMessage)
  //   }
  //
  //   function drainMessageQueue(rpcMessages) {
  //     consoleMonitor.drainMessageQueue(rpcMessages)
  //     statsMonitor.drainMessageQueue(rpcMessages)
  //   }
  //
  //   function outgoingMessage(message){
  //     consoleMonitor.outgoingMessage(message)
  //     statsMonitor.outgoingMessage(message)
  //   }
  //
  //   function incomingMessage(message){
  //     consoleMonitor.incomingMessage(message)
  //     statsMonitor.incomingMessage(message)
  //   }
  //
  //   setInterval(() => {
  //     console.log(name, 'stats', statsMonitor.stats())
  //   }, delay)
  //
  //   return {queueMessage, drainMessageQueue, outgoingMessage, incomingMessage}
  // }

  function DevToolsMonitor(name){
    window.__RPC_DEVTOOLS_LOG__ = []

    function log(entry) {
      window.__RPC_DEVTOOLS_LOG__.push(`${name} - ${entry}`)
    }

    function queueMessage(){
      log('queue')
    }

    function drainMessageQueue(){
      log('drain')
    }

    function outgoingMessage(){
      log('out message')
    }

    function incomingMessage(){
      log('in message')
    }

    function serializeStart(){
      log('serialize start')
    }

    function serializeEnd(){
      log('serialize end')
    }

    function deserializeStart(){
      log('deserialize end')
    }

    function deserializeEnd(){
      log('deserialize end')
    }

    function bufferAllocation(){
      log('buffer allocation')
    }

    return {queueMessage, drainMessageQueue, outgoingMessage, incomingMessage, serializeStart, serializeEnd, deserializeStart, deserializeEnd, bufferAllocation}
  }

  return {RpcMonitor, StatsMonitor, DevToolsMonitor, ConsoleLogger, NodeConsoleLogger, RemoteLogger, LocalLogger}
})