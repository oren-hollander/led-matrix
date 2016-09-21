'use strict'

define([], () => {

  // todo: bug in descending until

  function makeIterator(from, to) {
    const gte = (a, b) => a >= b
    const lte = (a, b) => a <= b
    let [delta, comp] = from <= to ? [1, lte] : [-1, gte]

    return function* () {
      for(let i = from; comp(i, to); i += delta)
        yield i
    }
  }

  return {from: (from) => ({
    to: to => ({[Symbol.iterator] : makeIterator(from, to)}),
    until: until => ({[Symbol.iterator] : makeIterator(from, until - 1)}),
  })}
})