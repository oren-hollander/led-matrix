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
  'test/message-rpc.specs.image-serializer'
], (
  _,
  MessageRPC,
  {RemoteApi, RemoteFunction},
  {MockMessengers, WebWorkerMessenger, createMockWorkerPair},
  SharedObjectProxy,
  NativeSerializer,
  JsonSerializer,
  BinarySerializer,
  {Serializable},
  {ConsoleMonitor, StatsMonitor},
  ImageSerializer
) => {
  describe('MessageRPC', () =>  {

    let messenger1, messenger2

    beforeEach(() => {
      [messenger1, messenger2] = MockMessengers()
    })


    it('disconnect messenger', done => {

      const [a, b] = _.map(createMockWorkerPair(), WebWorkerMessenger)

      const receiver = jasmine.createSpy()

      b.setReceiver(receiver)
      b.setReceiver(null)

      a.send('hello')
      _.delay(() => {
        expect(receiver).not.toHaveBeenCalled()
        done()
      }, 100)

    })

    xit('should relay after a channel has established', done => {

      // to game
      MessageRPC(messenger1, NativeSerializer).then(rpc => {
        const api = {
          f: () => {
            rpc.disconnect()
          }
        }

        rpc.connect(RemoteApi(api)).then(thatApi => {

        })

        rpc.createSharedObject()
        rpc.releaseProxy()
        rpc.releaseStub()
      })

      // to pad
      MessageRPC(RemoteApi(api), messenger2, NativeSerializer)

      done()
    })

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

    it('Shared Object Proxy', done => {

      let releaseProxy

      const platformApi = {
        passSharedObject: so => {
          so.x++
          so.y++
          releaseProxy(so)
        }
      }

      MessageRPC(RemoteApi(platformApi), messenger1, NativeSerializer).then(({releaseProxy: rp}) => {
        releaseProxy = rp
      })

      MessageRPC({}, messenger2, NativeSerializer, ConsoleMonitor('App')).then(({api, createSharedObject, releaseStub}) => {
        const so = createSharedObject({x: 10, y: 20})
        api.passSharedObject(so)

        const check = () => {
          if(so.x === 10 || so.y === 20){
            _.defer(check)
          }
          else {
            expect(so.x).toBe(11)
            expect(so.y).toBe(21)
            releaseStub(so)
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
        const worker = new Worker('src/test/message-rpc.specs.native.worker.js')
        MessageRPC({}, WebWorkerMessenger(worker), NativeSerializer).then(({api}) => {
          console.time('native')
          return api.imageSize(megaPixelImage)
        }).then(s => {
          console.timeEnd('native')
          expect(s).toBe(megaPixelImage.length)
          done()
        })
      })

      it('using json serializer', done => {
        const worker = new Worker('src/test/message-rpc.specs.json.worker.js')
        MessageRPC({}, WebWorkerMessenger(worker), JsonSerializer).then(({api}) => {
          console.time('json')
          return api.imageSize(megaPixelImage)
        }).then(s => {
          console.timeEnd('json')
          expect(s).toBe(megaPixelImage.length)
          done()
        })
      })

      it('using binary serializer', done => {
        const worker = new Worker('src/test/message-rpc.specs.binary.worker.js')

        var statsMonitor = StatsMonitor('Stats');
        MessageRPC({}, WebWorkerMessenger(worker), BinarySerializer({Image: ImageSerializer}, statsMonitor), statsMonitor).then(({api}) => {
          console.time('binary')
          megaPixelImage[Serializable] = 'Image'
          return api.imageSize(megaPixelImage)
        }).then(s => {
          console.timeEnd('binary')
          expect(s).toBe(megaPixelImage.length)
          statsMonitor.log()
          done()
        })
      })
    })
  })
})
