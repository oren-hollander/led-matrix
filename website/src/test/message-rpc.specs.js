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
  'test/message-rpc.specs.image-serializer',
  'util/relay'
], (
  _,
  MessageRPC,
  {RemoteApi, RemoteFunction},
  {createMockWorkerPair, WebWorkerChannelMessenger},
  SharedObjectProxy,
  NativeSerializer,
  JsonSerializer,
  {BinaryMultiBufferSerializer},
  {Serializable},
  {RpcMonitor, StatsMonitor, DevToolsMonitor, ConsoleLogger, LocalLogger},
  ImageSerializer,
  Relay
) => {
  describe('MessageRPC', () =>  {

    let channelA, channelB

    beforeEach(done => {
      const [workerA, workerB] = createMockWorkerPair()
      Promise.all([WebWorkerChannelMessenger(workerA), WebWorkerChannelMessenger(workerB)]).then(([messengerA, messengerB]) => {
        channelA = messengerA.createChannel(1)
        channelB = messengerB.createChannel(1)
        done()
      })
    })

    it('disconnect messenger', done => {

        const receiver = jasmine.createSpy()

        channelA.setReceiver(receiver)
        channelB.setReceiver(null)

        channelA.send('hello')
        _.delay(() => {
          expect(receiver).not.toHaveBeenCalled()
          done()
        }, 100)
      // })
    })

    it('should relay after a channel has established', done => {
      const done2 = _.after(2, done)

      // Side A
      MessageRPC(channelA, NativeSerializer, DevToolsMonitor('A')).then(rpc => {

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
      MessageRPC(channelB, NativeSerializer, RpcMonitor('B', ConsoleLogger)).then(rpc => {
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

      MessageRPC(channelA, NativeSerializer).then(rpc => {
        rpc.connect(RemoteApi(platformApi))
      })

      MessageRPC(channelB, NativeSerializer).then(rpc => {
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

      MessageRPC(channelA, NativeSerializer).then(rpc => {
        rpc.connect(RemoteApi(platformApi))
      })

      MessageRPC(channelB, NativeSerializer).then(rpc => {
        rpc.connect().then(api => {
          const f = a => a * a
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

      MessageRPC(channelA, NativeSerializer).then(rpc => {
        rpc.connect(RemoteApi(platformApi))
      })

      MessageRPC(channelB, NativeSerializer).then(rpc => {
        rpc.connect().then(api => {
          const mathApi = {
            pow: a => a * a
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

      MessageRPC(channelA, NativeSerializer).then(rpc => {
        releaseProxy = rpc.releaseProxy
        rpc.connect(RemoteApi(platformApi))
      })

      MessageRPC(channelB, NativeSerializer, RpcMonitor('App', ConsoleLogger)).then(rpc => {
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

    fdescribe('Serialization speed test', () => {

      const connect = rpc => rpc.connect()
      const megaPixelImage = new Array(100000)

      for(let i = 0; i < megaPixelImage.length; i++){
        megaPixelImage[i] = {red: 255, green: 255, blue: 255}
      }

      it('using native serializer', done => {
        const worker = new Worker('src/test/message-rpc.specs.native.worker.js')

        WebWorkerChannelMessenger(worker).then(messenger => {
          const channel = messenger.createChannel(1)

          MessageRPC(channel, NativeSerializer).then(connect).then(api => {
            console.time('native')
            return api.imageSize(megaPixelImage)
          }).then(imageSize => {
            console.timeEnd('native')
            expect(imageSize).toBe(megaPixelImage.length)
            done()
          })
        })
      })

      it('using json serializer', done => {
        const worker = new Worker('src/test/message-rpc.specs.json.worker.js')
        WebWorkerChannelMessenger(worker).then(messenger => {
          const channel = messenger.createChannel(1)
          const debugChannel = messenger.createChannel(2)
          debugChannel.setReceiver(LocalLogger(ConsoleLogger))

          MessageRPC(channel, JsonSerializer, RpcMonitor('Page', ConsoleLogger)).then(connect).then(api => {
            console.time('json')
            return api.imageSize(megaPixelImage)
          }).then(imageSize => {
            console.timeEnd('json')
            expect(imageSize).toBe(megaPixelImage.length)
            done()
          })
        })
      })

      it('using binary serializer', done => {
        const worker = new Worker('src/test/message-rpc.specs.binary.worker.js')

        var statsMonitor = StatsMonitor('Stats', ConsoleLogger)
        WebWorkerChannelMessenger(worker).then(messenger => {
          const channel = messenger.createChannel(1)
          MessageRPC(channel, BinaryMultiBufferSerializer({Image: ImageSerializer}, statsMonitor), statsMonitor)
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

    describe('Relay two workers', () => {

      it('should relay channel', done => {

        const [client1Worker, server1Worker] = createMockWorkerPair()
        const [client2Worker, server2Worker] = createMockWorkerPair()

        const doneChatting = _.after(2, done)

        function startChatServer(messenger1, messenger2){

          const server1SignalChannel = messenger1.createChannel(1)
          const server2SignalChannel = messenger2.createChannel(1)
          const server1ChatChannel = messenger1.createChannel(2)
          const server2ChatChannel = messenger2.createChannel(2)

          Relay(server1ChatChannel, server2ChatChannel)

          MessageRPC(server1SignalChannel, NativeSerializer).then(rpc => {
            rpc.connect().then(chatApi => {
              chatApi.startChat(2)
            })
          })

          MessageRPC(server2SignalChannel, NativeSerializer).then(rpc => {
            rpc.connect().then(chatApi => {
              chatApi.startChat(2)
            })
          })
        }

        function startChatClient(messenger){
          const signalChannel = messenger.createChannel(1)

          MessageRPC(signalChannel, NativeSerializer).then(rpc => {

            const chatApi = {
              startChat: channel => {
                const chatChannel = messenger.createChannel(channel)
                MessageRPC(chatChannel, NativeSerializer).then(rpc => {
                  rpc.connect(RemoteFunction(message => {
                    expect(message).toEqual('hello')
                    doneChatting()
                  })).then(f => {
                    f('hello')
                  })
                })
              }
            }

            rpc.connect(RemoteApi(chatApi))
          })
        }

        Promise.all([
          WebWorkerChannelMessenger(client1Worker),
          WebWorkerChannelMessenger(client2Worker),
          WebWorkerChannelMessenger(server1Worker),
          WebWorkerChannelMessenger(server2Worker),
        ]).then(([client1Messenger, client2Messenger, server1Messenger, server2Messenger]) => {
          startChatClient(client1Messenger)
          startChatClient(client2Messenger)
          startChatServer(server1Messenger, server2Messenger)
        })
      })
    })
  })
})
