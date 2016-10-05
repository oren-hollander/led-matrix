'use strict'

define([
  'lodash'
], (
  _
) => {
  return {
    serialize: _.identity,
    deserialize: _.identity
  }
})