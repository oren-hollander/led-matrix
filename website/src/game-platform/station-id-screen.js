'use strict'

define([
  'lodash',
  'util/promise',
  'geometry/geometry',
  'canvas/view',
  'game-platform/colors'
], (
  _,
  {createPromise},
  {
    Point, Line, Circle, Rect, Box, HPill, clamp, rectToBox, boxToRect, pointsToLine, lineToPoints, circleToBox,
    resizeBox, scaleBox, translateBox, pointInRect, pointInBox, pointInHPill, pointInCircle, normalizeAngle,
    circleColliding, resolveCollision
  },
  View,
  Colors
) => {

  function StationIdScreen(){

    let ctx, width, height, promise, state

    function show(context, w, h, screenState) {
      ctx = context
      width = w
      height = h
      state = screenState
      promise = createPromise()
      return promise
    }

    function paint(){
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '72px sans-serif'
      ctx.fillStyle = Colors.primary[4]
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = Colors.primary[0]
      ctx.fillText(state.stationId, width / 2, height / 2)

      if(state.pads.length === 0){
        ctx.fillText('No pads connected', width / 2, height / 2 + height / 9)
      }
      else {
        state.pads.forEach((pad, i) => {
          ctx.fillStyle = state.colors[i][0]
          ctx.fillText(`Pad ${i + 1} connected`, width / 2, height / 2 + (i + 1) * (height / 9))
        })
      }
    }

    function close(){
      promise.resolve()
    }

    return {show, paint, close}
  }

  return StationIdScreen
})