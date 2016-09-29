'use strict'

requirejs.config({
  baseUrl: '/app/rpc/src',
  paths: {
    lodash: ['/lib/lodash']
  }
});

require(['lodash', 'message-rpc', 'priority', 'annotations', 'examples/speed-test-serializers'],
  (_, MessageRPC, {setPriority, MessagePriorities}, {Annotations, annotate}, SpeedTestSerializers) => {

  const image = _.fill(new Array(65535), {red: 2, green: 30, blue: 67})
  annotate(image, Annotations.Serialized, 'Image')

  MessageRPC({}, new Worker('speed-test-worker.js'), SpeedTestSerializers/*ConsoleMonitor('app')*/).then(({api}) => {
    const appApi = setPriority(api, MessagePriorities.Immediate)

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
