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

      const [a, b] = _.map(createMockWorkerPair(), worker => WebWorkerMessenger(worker))

      const receiver = jasmine.createSpy()

      b.setReceiver(receiver)
      b.setReceiver(null)

      a.send('hello')
      _.delay(() => {
        expect(receiver).not.toHaveBeenCalled()
        done()
      }, 100)

    })

    it('should relay after a channel has established', done => {
      const done2 = _.after(2, done)

      // Side A
      MessageRPC(messenger1, NativeSerializer, ConsoleMonitor('A')).then(rpc => {

        const localApi = {
          add: (a, b) => a + b
        }

        rpc.connect(RemoteApi(localApi)).then(remoteFunction => {
          remoteFunction(6, 7).then(r => {
            expect(r).toBe(42)
            done2()
          })
        })
      })

      // Side B
      MessageRPC(messenger2, NativeSerializer, ConsoleMonitor('B')).then(rpc => {
        const mul = (a, b) => a * b

        rpc.connect(RemoteFunction(mul)).then(remoteApi => {
          remoteApi.add(6, 7).then(r => {
            expect(r).toBe(13)
            done2()
          })
        })
      })

    })

    it('should connect and expose remote API', done => {

      const platformApi = {
        add: (a, b) => a + b
      }

      MessageRPC(messenger1, NativeSerializer).then(rpc => {
        rpc.connect(RemoteApi(platformApi))
      })

      MessageRPC(messenger2, NativeSerializer).then(rpc => {
        rpc.connect().then(api => {
          api.add(3, 4).then(r => {
            expect(r).toBe(7)
            done()
          })
        })
      })
    })

    it('should pass by ref an anonymous function', done => {
      const platformApi = {
        applyFunction: (f, a) => {
          return f(a)
        }
      }

      MessageRPC(messenger1, NativeSerializer).then(rpc => {
        rpc.connect(RemoteApi(platformApi))
      })

      MessageRPC(messenger2, NativeSerializer).then(rpc => {
        rpc.connect().then(api => {
          const f = a => a ** 2
          api.applyFunction(RemoteFunction(f), 5).then(r => {
            expect(r).toBe(25)
            done()
          })
        })
      })
    })

    it('should pass by ref an api object', done => {
      const platformApi = {
        applyFunction: (api, f, a) => {
          return api[f](a)
        }
      }

      MessageRPC(messenger1, NativeSerializer).then(rpc => {
        rpc.connect(RemoteApi(platformApi))
      })

      MessageRPC(messenger2, NativeSerializer).then(rpc => {
        rpc.connect().then(api => {
          const mathApi = {
            pow: a => a ** 2
          }

          api.applyFunction(RemoteApi(mathApi), 'pow', 5).then(r => {
            expect(r).toBe(25)
            done()
          })

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

      MessageRPC(messenger1, NativeSerializer).then(rpc => {
        releaseProxy = rpc.releaseProxy
        rpc.connect(RemoteApi(platformApi))
      })

      MessageRPC(messenger2, NativeSerializer, ConsoleMonitor('App')).then(rpc => {
        const so = rpc.createSharedObject({x: 10, y: 20})
        rpc.connect().then(api => {
          api.passSharedObject(so)

          const check = () => {
            if(so.x === 10 || so.y === 20){
              _.defer(check)
            }
            else {
              expect(so.x).toBe(11)
              expect(so.y).toBe(21)
              rpc.releaseStub(so)
              done()
            }
          }
          check()
        })
      })

    })

    describe('Serialization speed test', () => {

      const connect = rpc => rpc.connect()
      const megaPixelImage = new Array(100000)

      for(let i = 0; i < megaPixelImage.length; i++){
        megaPixelImage[i] = {red: 255, green: 255, blue: 255}
      }

      it('using native serializer', done => {
        const worker = new Worker('src/test/message-rpc.specs.native.worker.js')
        MessageRPC(WebWorkerMessenger(worker), NativeSerializer).then(connect).then(api => {
          console.time('native')
          return api.imageSize(megaPixelImage)
        }).then(imageSize => {
          console.timeEnd('native')
          expect(imageSize).toBe(megaPixelImage.length)
          done()
        })
      })

      it('using json serializer', done => {
        const worker = new Worker('src/test/message-rpc.specs.json.worker.js')
        MessageRPC(WebWorkerMessenger(worker), JsonSerializer).then(connect).then(api => {
          console.time('json')
          return api.imageSize(megaPixelImage)
        }).then(imageSize => {
          console.timeEnd('json')
          expect(imageSize).toBe(megaPixelImage.length)
          done()
        })
      })

      it('using binary serializer', done => {
        const worker = new Worker('src/test/message-rpc.specs.binary.worker.js')

        var statsMonitor = StatsMonitor('Stats');
        MessageRPC(WebWorkerMessenger(worker), BinarySerializer({Image: ImageSerializer}, statsMonitor), statsMonitor)
          .then(connect).then(api => {
            console.time('binary')
            megaPixelImage[Serializable] = 'Image'
            return api.imageSize(megaPixelImage)
          }).then(imageSize => {
            console.timeEnd('binary')
            expect(imageSize).toBe(megaPixelImage.length)
            statsMonitor.log()
            done()
          })
      })
    })
  })
})
