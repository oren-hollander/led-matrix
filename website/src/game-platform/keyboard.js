'use strict'

define([
  'lodash',
  'geometry/geometry',
  'canvas/view'
], (
  _,
  {Box, Point, boxToRect, Circle, Rect, Line},
  View
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

  function Keypad(buttons) {

    let keypad
    let keyRadius
    let canvasBounds

    function layout(bounds) {
      canvasBounds = bounds
      const keypadGrid = grid(0, 1, 3, 5, 6)(0, 1, 3, 5, 7, 8)(bounds.h * 0.75, bounds.h * .75)

      keypad = _.mapValues(keys, keypadGrid.mapPoint)
      keyRadius = (keypad['4'].y - keypad['1'].y) * 3 / 8

      buttons.clear()
      const left = bounds.x + bounds
      _.forEach(keypad, (point, key) => {
        buttons.add({name: key, x: bounds.x + point.x, y: bounds.y + point.y, r: keyRadius, pressed: false})
      })
    }


    function paint(ctx) {
      const view = View(ctx, canvasBounds)
      view.clear()

      ctx.lineWidth = 3
      ctx.strokeStyle = 'blue'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'

      _.forEach(keypad, (point, key) => {
        view.circle(Circle(point.x, point.y, keyRadius))
        view.text(key, point.x, point.y)
      })
    }

    let codeCount = 0
    let codes = []

    function addCode(code){
      if(codes.length < 5)
        codes = _.concat(codes, code)
    }

    function resetCodes() {
      codes = []
    }

    function back(){
      codes = _.dropRight(codes, 1)
    }

    buttons.onRelease = buttonName => {
      codeCount++
      addCode(buttonName)
      if(codeCount === 5){
        api.onCode(parseInt(codes.join('')))
      }
    }

    const api = {paint, layout, onCode: undefined}
    return api
  }

  function CodeInput(bounds, count) {

    let codes = []

    function paint(ctx) {
      const view = View(ctx, bounds)
      view.clear()
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
          view.rect(Rect(bounds.x + codeBounds.x, bounds.y + codeBounds.y, codeBounds.w, codeBounds.h))
        })

      codeCenters
        .take(codes.length)
        .zip(codes)
        .forEach(([p, code]) => {
          view.text(code, bounds.x + p.x, bounds.y + p.y)
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

    function getCode() {
      return parseInt(codes.join(''))
    }

    return {paint, bounds, reset, back, add, getCode}
  }

  return {Keypad, CodeInput}
})