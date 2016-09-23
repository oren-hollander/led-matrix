'use strict'
const requirejs = require('../app/require')
console.log(requirejs)
// requirejs.config({
//   baseUrl: '.',
//   nodeRequire: require
// })

const assert = require('assert')
const it = require('mocha').it
const describe = require('mocha').describe
const expect = require('chai').expect
// const Memory = require('../app/garbage/memory')

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4))
    })
  })
})