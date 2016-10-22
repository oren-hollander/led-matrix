'use strict'

define([
  'lodash',
  'util/promise'
], (
  _,
  {createPromise}
) => {
  function GameScreen() {
    let ctx, width, height, promise, gameState, frameOps = []

    function show(context, w, h, state) {
      gameState = state
      width = w
      height = h
      ctx = context

      _.forEach(gameState.pads, ({pad}) => {
        pad.reset()
      })

      promise = createPromise()
      return promise
    }

    function paintReady(ops){
      frameOps = _.concat(frameOps, ops)
    }

    function paint() {
      if (frameOps.length > 0) {
        ctx.clearRect(0, 0, width, height)
        _.forEach(frameOps, op => {
          switch (op.op) {
            case 'color':
              ctx.fillStyle = op.color
              break
            case 'rect':
              ctx.fillRect(op.rect.x, op.rect.y, op.rect.w, op.rect.h)
              break
            case 'box':
              ctx.fillRect(op.box.x - op.box.hw, op.box.y - op.box.hh, op.box.hw * 2, op.box.hh * 2)
              break
            case 'circle':
              ctx.beginPath()
              ctx.arc(op.circle.x, op.circle.y, op.circle.r, 0, Math.PI * 2)
              ctx.fill()
              break
            case 'text':
              ctx.textAlign = 'center'
              ctx.font = '72px sans-serif'
              ctx.fillText(op.text, op.x, op.y)
          }
        })
        frameOps = []
      }
    }

    return {show, paint, paintReady}
  }

  return GameScreen
})