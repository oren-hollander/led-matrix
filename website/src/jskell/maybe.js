'use strict'

define([
  'lodash',
  'jskell/type'
], (
  _,
  Type
) => {

  const Maybe = {
    fmap: (f, m) => {
      if (m === Nothing)
        return Nothing

      return Just(f(m.value))
    }
  }

  const MaybeType = {[Type]: Maybe}

  const Nothing = Object.create(MaybeType, {})
  const Just = value => Object.assign(Object.create(MaybeType), {value})

  return {Maybe, Just, Nothing}
})