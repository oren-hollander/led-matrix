'use strict'

define([], () => {
  return {
    serialize: value => JSON.stringify(value),
    deserialize: value => JSON.parse(value)
  }
})