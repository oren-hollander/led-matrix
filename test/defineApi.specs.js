'use strict'

define(['lodash', '../app/rpc/api-util'], (_, {defineApi, apiSymbols: {ApiSymbol, ApiFunction, ApiProperty}}) => {

  describe("defineApi", function() {
    it("should prepare an API for being transferred remotely", function() {

      const api = defineApi({add: (a, b) => a + b, prop: 42}, {prop: 'setProp'})

      expect(api[ApiSymbol]).toBe(true)
      expect(api.add[ApiFunction]).toBe(true)
      expect(api.setProp[ApiProperty]).toBe('prop')

      expect(api.prop).toBe(42)
    })
  });
})

