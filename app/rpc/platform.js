'use strict'

require(['message-rpc', 'api-util'], (MessageRPC, {defineApi}) => {

  // const api = {
  //   add: (a, b) => a + b,
  //   div: (a, b) => {
  //     if (b === 0)
  //       throw 'division by zero error'
  //
  //     return a / b
  //   },
  //   test: () => {
  //     return defineApi({f: a => a * a})
  //   }
  // }

  MessageRPC({}, new Worker('app.js')).then(appApi => {
    appApi.initApp({x: 43}, defineApi(message => {console.log('at platform', message)}))
  })

})