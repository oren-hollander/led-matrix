'use strict'

define(['./memory', './proxies'], (Memory, Proxies) => {
  Memory.addObject(1, 'my 1st object')
  Memory.addObject(2, 'my 2nd object')

  const proxies = Proxies(Memory.touchObject)

  setInterval(() => {
    proxies.touchObject(1)

  }, 1000)
})