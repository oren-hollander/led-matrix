'use strict'

define([
  'lodash',
  'jskell/list'
], (
  _,
  {List}
) => {

  describe('List', () => {
    it('fmap', () => {
      const square = x => x ** 2
      var l = List.fromArray([1, 2, 3]);
      expect(List.toArray(List.fmap(square)(l))).toEqual([1, 4, 9])
    })

    it('foldl', () => {
      const add = (a, b) => a + b
      var l = List.fromArray([1, 2, 3, 4, 5]);
      expect(List.foldl(add)(0)(l)).toBe(15)

      const mul = (a, b) => a * b
      const sum = List.foldl(add)(0)
      const product = List.foldl(mul)(1)
      expect(sum(l)).toBe(15)
      expect(product(l)).toBe(1 * 2 * 3 * 4 *  5)
    })

  })

})