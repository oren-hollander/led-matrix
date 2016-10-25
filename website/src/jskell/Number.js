'use strict'

define([
  // 'lodash',
  'jskell/Ordering'
  // 'jskell/type'
], (
  // _,
  {LT, EQ, GT}
  // Type
) => {
  const Number = {
    eq: a => b => a === b,

    compare: a => b => a === b ? EQ : a < b ? LT : GT,
    lt: a => b => a < b,
    gt: a => b => a > b,
    lte: a => b => a <= b,
    gte: a => b => a >= b,
    max: a => b => a < b ? b : a,
    min: a => b => a < b ? a : b
  }

  // const NumberType = {[Type]: Number}

  return Number
})