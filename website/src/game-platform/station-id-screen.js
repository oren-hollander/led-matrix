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

  function StationIdScreen(deviceId){

    function paint(ctx, width, height){
      window.requestAnimationFrame(paint)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'
      ctx.fillStyle = Colors.primary[4]
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = Colors.primary[0]
      ctx.fillText(deviceId, width / 2, height / 2)
    }

    paint()
  }

  return StationIdScreen
})