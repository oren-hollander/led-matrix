'use strict'

requirejs.config({
  baseUrl: '/app/rpc/src',
  paths: {
    lodash: ['/lib/lodash']
  }
});

require(['lodash', 'message-rpc', 'remote-object', 'priority', '../src/buffer/proto-buf', 'api-util', 'monitor'], (_, MessageRPC, {RemoteApi},
  {setPriority, MessagePriorities}, protocolCodec, {ProtocolSymbol}, {ConsoleMonitor}) => {

  const image = _.fill(new Array(65535), {red: 2, green: 30, blue: 67})

  MessageRPC({}, new Worker('speed-test-worker.js'), undefined/*ConsoleMonitor('app')*/).then(({api}) => {
    const appApi = setPriority(api, MessagePriorities.Immediate, MessagePriorities.None)

    console.time()
    function processImage(count) {
      if(count >= 0){
        console.log('sending image to worker', count)
        appApi.processImage(image).then(() => {
          processImage(count - 1)
        })
      }
      else {
        console.timeEnd()
      }
    }

    processImage(100)
  })
})
