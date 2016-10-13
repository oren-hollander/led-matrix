'use strict'

define([
  'lodash'
], (
  _
) => {
  function View(ctx, bounds) {

    const floor = _.partial(_.mapValues, _, Math.floor)

    bounds = floor(bounds)

    function line(l) {
      l = floor(l)
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    }

    function circle(c) {
      c = floor(c)
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI)
      ctx.stroke()
    }

    function rect(r) {
      r = floor(r)
      ctx.strokeRect(r.x, r.y, r.w, r.h)
    }

    function text(t, x, y) {
      ctx.fillText(t, x, y)
    }

    function clear() {
      ctx.clearRect(bounds.x, bounds.y, bounds.w, bounds.h)
    }

    return {clear, line, circle, rect, text}
  }

  return View
})