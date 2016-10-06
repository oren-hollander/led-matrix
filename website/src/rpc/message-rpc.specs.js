'use strict'

define([
  'lodash',
  'rpc/message-rpc',
  'rpc/remote',
  'rpc/messenger',
  'rpc/shared-object-proxy',
  'serialization/native-serializer',
  'serialization/json-serializer',
  'serialization/binary-serializer',
  'serialization/serialize',
  'rpc/monitor',
  'rpc/priority',
  'rpc/message-rpc.specs.image-serializer'
], (
  _,
  MessageRPC,
  {RemoteApi, RemoteFunction},
  {MockMessengers, WebWorkerMessenger},
  SharedObjectProxy,
  NativeSerializer,
  JsonSerializer,
  BinarySerializer,
  {Serializable},
  {ConsoleMonitor},
  {MessagePriorities, setPriority},
  ImageSerializer
) => {
  describe('MessageRPC', () =>  {

    let messenger1, messenger2

    beforeEach(() => {
      [messenger1, messenger2] = MockMessengers()
    })

    // it('monitor', done => {
    //
    //   const api = {
    //     add: (a, b) => a + b
    //   }
    //
    //   MessageRPC(RemoteApi(api), messenger1, NativeSerializer)
    //
    //   MessageRPC({}, messenger2, NativeSerializer, ConsoleMonitor('Test')).then(({api}) => {
    //     setPriority(api, MessagePriorities.Immediate)
    //
    //     Promise.all([
    //       api.add(3, 4),
    //       api.add(4, 5)
    //     ])
    //     .then(() => {
    //       expect(true).toBe(true)
    //       done()
    //     })
    //   })
    // })

    it('should connect and expose remote API', done => {

      const platformApi = {
        add: (a, b) => a + b
      }

      MessageRPC(RemoteApi(platformApi), messenger1, NativeSerializer)

      MessageRPC({}, messenger2, NativeSerializer).then(({api}) => {
        api.add(3, 4).then(r => {
          expect(r).toBe(7)
          done()
        })
      })
    })

    it('should pass by ref an anonymous function', done => {
      const platformApi = {
        applyFunction: (f, a) => {
          return f(a)
        }
      }

      MessageRPC(RemoteApi(platformApi), messenger1, NativeSerializer)

      MessageRPC({}, messenger2, NativeSerializer).then(({api}) => {
        const f = a => a ** 2
        api.applyFunction(RemoteFunction(f), 5).then(r => {
          expect(r).toBe(25)
          done()
        })
      })
    })

    it('should pass by ref an api object', done => {
      const platformApi = {
        applyFunction: (api, f, a) => {
          return api[f](a)
        }
      }

      MessageRPC(RemoteApi(platformApi), messenger1, NativeSerializer)

      MessageRPC({}, messenger2, NativeSerializer).then(({api}) => {
        const mathApi = {
          pow: a => a ** 2
        }

        api.applyFunction(RemoteApi(mathApi), 'pow', 5).then(r => {
          expect(r).toBe(25)
          done()
        })
      })
    })

    it('should pass a shared object', done => {
      const platformApi = {
        passSharedObject: sharedObject => {
          sharedObject.x.set(sharedObject.x.get() + 1)
          sharedObject.y.set(sharedObject.y.get() + 1)
        }
      }

      MessageRPC(RemoteApi(platformApi), messenger1, NativeSerializer, ConsoleMonitor('Side A'))

      MessageRPC({}, messenger2, NativeSerializer, ConsoleMonitor('Side B')).then(({api, createSharedObject}) => {
        const sharedObject = createSharedObject({x: 10, y: 20})
        api.passSharedObject(sharedObject)

        const check = () => {
          if(sharedObject.x.get() === 10 || sharedObject.y.get() === 20){
            _.defer(check)
          }
          else {
            expect(sharedObject.x.get()).toBe(11)
            expect(sharedObject.y.get()).toBe(21)
            done()
          }
        }
        check()
      })
    })

    it('Shared Object Proxy', done => {
      const platformApi = {
        passSharedObject: sharedObject => {
          const so = SharedObjectProxy(sharedObject)
          so.x++
          so.y++
        }
      }

      MessageRPC(RemoteApi(platformApi), messenger1, NativeSerializer)

      MessageRPC({}, messenger2, NativeSerializer).then(({api, createSharedObject}) => {
        const sharedObject = createSharedObject({x: 10, y: 20})
        api.passSharedObject(sharedObject)

        const so = SharedObjectProxy(sharedObject)

        const check = () => {
          if(so.x === 10 || so.y === 20){
            _.defer(check)
          }
          else {
            expect(so.x).toBe(11)
            expect(so.y).toBe(21)
            done()
          }
        }
        check()
      })
    })

    describe('speed test', () => {

      const megaPixelImage = new Array(100000)

      for(let i = 0; i < megaPixelImage.length; i++){
        megaPixelImage[i] = {red: 255, green: 255, blue: 255}
      }

      it('using native serializer', done => {
        const worker = new Worker('/src/rpc/message-rpc.specs.native.worker.js')
        MessageRPC({}, WebWorkerMessenger(worker), NativeSerializer).then(({api}) => {
          console.time('image')
          return api.imageSize(megaPixelImage)
        }).then(s => {
          console.timeEnd('image')
          expect(s).toBe(megaPixelImage.length)
          done()
        })
      })

      it('using json serializer', done => {
        const worker = new Worker('/src/rpc/message-rpc.specs.json.worker.js')
        MessageRPC({}, WebWorkerMessenger(worker), JsonSerializer).then(({api}) => {
          console.time('image')
          return api.imageSize(megaPixelImage)
        }).then(s => {
          console.timeEnd('image')
          expect(s).toBe(megaPixelImage.length)
          done()
        })
      })

      it('using binary serializer', done => {
        const worker = new Worker('/src/rpc/message-rpc.specs.binary.worker.js')

        MessageRPC({}, WebWorkerMessenger(worker), BinarySerializer({Image: ImageSerializer}), ConsoleMonitor('Image')).then(({api}) => {
          console.time('image')
          megaPixelImage[Serializable] = 'Image'
          return api.imageSize(megaPixelImage)
        }).then(s => {
          console.timeEnd('image')
          expect(s).toBe(megaPixelImage.length)
          done()
        })
      })
    })
  })
})
