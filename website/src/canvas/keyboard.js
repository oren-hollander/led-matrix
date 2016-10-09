'use strict'

define([
  'lodash',
  'geometry/geometry'
], (
  _,
  {Rect, Box, Point, boxToRect}
) => {

  const grid = (...xs) => (...ys) => (x, y) => {
    const xMax = _.last(xs)
    const yMax = _.last(ys)

    return {
      mapPoint: p =>
        Point(xs[p.x] / xMax * x, ys[p.y] / yMax * y)
    }
  }

  const keys = {
    '1': Point(1, 1),
    '2': Point(2, 1),
    '3': Point(3, 1),
    '4': Point(1, 2),
    '5': Point(2, 2),
    '6': Point(3, 2),
    '7': Point(1, 3),
    '8': Point(2, 3),
    '9': Point(3, 3),
    '0': Point(2, 4)
  }

  function Keypad(canvas) {
    const ctx = canvas.getContext('2d')

    function circle(x, y, r) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, 2 * Math.PI)
      ctx.stroke()
    }

    function paint(bounds) {
      ctx.clearRect(bounds.x, bounds.y, bounds.w, bounds.h)
      const keypadGrid = grid(0, 1, 3, 5, 6)(0, 1, 3, 5, 7, 8)(bounds.w, bounds.h)
      const keypad = _.mapValues(keys, keypadGrid.mapPoint)
      const keyRadius = (keypad['2'].x - keypad['1'].x) * 3 / 8

      ctx.lineWidth = 3
      ctx.strokeStyle = 'blue'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'
      _.forEach(keypad, (point, key) => {
        circle(bounds.x + point.x, bounds.y + point.y, keyRadius)
        ctx.fillText(key, bounds.x + point.x, bounds.y + point.y)
      })
    }

    return {paint}
  }

  function CodeInput(canvas, count) {
    const ctx = canvas.getContext('2d')

    let codes = []

    function paint(bounds) {
      ctx.clearRect(bounds.x, bounds.y, bounds.w, bounds.h)
      const codeSize = bounds.w / count
      const codeHalfSize = codeSize * 0.8 / 2
      ctx.strokeStyle = 'red'
      ctx.lineWidth = 6

      const codeCenters = _(count)
        .range()
        .map(n => (n + 0.5) * codeSize)
        .map(x => Point(x, bounds.y))

      codeCenters
        .map(p => Box(p.x, p.y, codeHalfSize, codeHalfSize))
        .map(boxToRect)
        .forEach(codeBounds => {
          ctx.strokeRect(bounds.x + codeBounds.x, bounds.y + codeBounds.y, codeBounds.w, codeBounds.h)
        })

      codeCenters
        .take(codes.length)
        .zip(codes)
        .forEach(([p, code]) => {
          ctx.fillText(code, bounds.x + p.x, bounds.y + p.y)
        })
    }

    function reset() {
      codes = []
    }

    function back(){
      codes = _.dropRight(codes, 1)
    }

    function add(code){
      if(codes.length < count)
        codes = _.concat(codes, code)
    }

    return {paint, reset, back, add}
  }

  return {Keypad, CodeInput}
})