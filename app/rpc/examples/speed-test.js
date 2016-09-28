'use strict'

requirejs.config({
  baseUrl: '/app/rpc/src',
  paths: {
    lodash: ['/lib/lodash']
  }
});

require(['lodash', 'message-rpc', 'remote-object', 'priority', '../src/buffer/proto-buf', 'api-util'], (_, MessageRPC, {RemoteApi},
  {setPriority, MessagePriorities}, protocolCodec, {ProtocolSymbol}) => {

  const imageProtocol = {
    Image: {
      Pixel: {
        struct: {
          red: 'uint8',
          green: 'uint8',
          blue: 'uint8'
        }
      },
      Image: {
        array: 'Pixel'
      }
    }
  }

  const uint16Protocol = {
    Uint16: {
      Uint16: 'uint16'
    }
  }

  // const buf = codec.write(image)
  // const image2 = codec.read(buf)

  // const codec = protocolCodec(uint16Protocol)
  // const buf = codec.write(7)
  // const c = codec.read(buf)

  let appApi
  console.time()
  const platformApi = {
    back: (count, image) => {
      if(count <= 1000){
        console.log(count)
        appApi.forth(count + 1, image)
      }
      else {
        console.timeEnd()
      }
      return image
    }
  }

  MessageRPC(RemoteApi(platformApi), new Worker('speed-test-worker.js')).then(({api}) => {
    const imageCodec = protocolCodec(imageProtocol)
    const uint16Codec = protocolCodec(uint16Protocol)

    appApi = setPriority(api, MessagePriorities.Immediate)
    api.forth[ProtocolSymbol] = [uint16Codec, imageCodec, imageCodec]
    const image = _.fill(new Array(10000), {red: 2, green: 30, blue: 67})
    const json = JSON.parse(JSON.stringify(image))
    appApi.forth(1, image)
  })
})
