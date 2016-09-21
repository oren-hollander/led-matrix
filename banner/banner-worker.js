'use strict'

importScripts('batch.js', '/worker/proxy.js', '/font.js')

let appApi

let x = 80

const message = 'Hello, I am a banner !!!'
let messageWidth = message.length * (fontWidth + 1) - 1

function char(api, x, y, ch, on = true){
  const charCode = ch.charCodeAt(0)
  if(charCode >= 0x20 && charCode <= 0x7f){
    for(let py = 0; py < fontHeight; py++){
      const row = ascii[charCode][py]
      for(let px = 0; px < fontWidth; px++){
        const pOn = ((row >> px) & 1) !== 0
        api.pixel(x + (fontWidth - 1 - px), y + py, on ? pOn : !pOn)
      }
    }
  }
}

function text(api, str, x, y, on = true){
  for(let i = 0; i < str.length; i++){
    char(api, x, y, str[i], on)
    x += fontWidth + 1
  }
}

function print(message) {
  console.log(message)
  return message
}

function timeout(value, delay) {
  const {promise, resolve} = createPromiseWithExecutor()
  setTimeout(() => {
    resolve(value)
  }, delay)
  return promise
}

function update() {
  console.log('update')
  // batch(appApi, appApi => {
  //   text(appApi, message, x, 1)
  //   appApi.refresh().then(() => {setTimeout(update, 0)})
  // })
  //
  // x--
  // if(x < -messageWidth)
  //   x = 91

  // batch(appApi, appApi => {
  //   appApi.pixel(x, 0).then(() => {})
  //   appApi.refresh().then(() => {
  //     x--
  //     if(x < -messageWidth)
  //       x = 91
  //     update()
  //   })
  // })

  // batch(appApi, appApi => {
    // api.add(1, 2).then(r => timeout(r, 2000)).then(r => api.add(r, 3)).then(print)
    // api.add(4, 5).then(r => timeout(r, 1000)).then(r => api.add(r, 6)).then(print).then(() => {setTimeout(update, 1000)})
    appApi.add(1, 1).then(() => {
      console.log('schedule update')
      setTimeout(update, 1000)
    })
  // })

  // setTimeout(update, 1000)
}

WorkerProxy({update}, self).then(api => {
  appApi = api
})