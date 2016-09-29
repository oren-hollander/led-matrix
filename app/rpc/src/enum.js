'use strict'

define(['lodash'], (_) => {
  function Enum(names) {

    const values = _(names).map((name, index) => [name, index]).fromPairs().value()

    function value(name) {
      return values[name]
    }

    function name(value) {
      if(value < 0 || value >= names.length)
        throw new Error('Index out of range')
      return names[value]
    }

    return {value, name}
  }

  return Enum
})