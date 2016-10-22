'use strict'

define([
  'lodash',
  'jskell/type'
], (
  _,
  Type
) => {

  const List = {
    fmap: f => l => {
      if(l === Nil)
        return Nil

      return Cons(f(l.head), List.fmap(f)(l.tail))
    },
    foldl: f => z => l => {
      if(l === Nil)
        return z

      return List.foldl(f)(f(z, l.head))(l.tail)
    },
    fromArray: as => {
      if(as.length === 0)
        return Nil

      var as2 = _.drop(as, 1);
      const tail = List.fromArray(as2)
      var cons = Cons(as[0], tail)
      return cons
    },
    toArray: l => {
      const a = []
      while(l !== Nil){
        a.push(l.head)
        l = l.tail
      }
      return a
    }
  }

  const ListType = {[Type]: List}

  const Nil = Object.create(ListType, {})
  const Cons = (head, tail) => {
    return Object.assign(Object.create(ListType), {head, tail})
  }

  return {List, Nil, Cons}
})


