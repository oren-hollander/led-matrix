'use strict'

define([
  'lodash',
  'jskell/type',
  'jskell/Number'
], (
  _,
  Type,
  Number
) => {

  function getType(a){
    if(_.isNumber(a))
      return Number

    if(a[Type])
      return a[Type]

    throw new Error('No type')
  }

  function getType2(a, b){
    const aType = getType(a)
    const bType = getType(b)

    if(aType === bType)
      return aType
    else
      throw new Error(`Expected values of same type`)
  }

  // functor
  const fmap = f => a => getType(a).fmap(f)(a)

  // applicative
  const pure = a => getType(a).pure(a)
  // const seq = ff, f => getType(f).pure(a)

  // foldable
  const foldl = f => z => a => getType(a).foldl(f)(z)(a)

  // eq
  const eq = a => b => getType2(a, b).eq(a)(b)
  const neq = a => b => !eq(a)(b)

  // ord
  const compare = a => b => getType2(a, b).compare(a)(b)
  const lt   = a => b => getType2(a, b).lt(a)(b)
  const gt   = a => b => getType2(a, b).gt(a)(b)
  const lte  = a => b => getType2(a, b).lte(a)(b)
  const gte  = a => b => getType2(a, b).gte(a)(b)
  const max  = a => b => getType2(a, b).max(a)(b)
  const min  = a => b => getType2(a, b).min(a)(b)

  return {
    fmap, foldl, eq, neq, compare, lt, gt, lte, gte, max, min
  }
})
