'use strict'

define([
  'lodash'
], (
  _
) => {
  function View(ctx) {

    const floor = _.partial(_.mapValues, _, Math.floor)

    function line(l) {
      l = floor(l)
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    }

    function strokeCircle(c) {
      c = floor(c)
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI)
      ctx.stroke()
    }

    function fillCircle(c) {
      c = floor(c)
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI)
      ctx.fill()
    }

    function strokeRect(r) {
      r = floor(r)
      ctx.strokeRect(r.x, r.y, r.w, r.h)
    }

    function fillRect(r) {
      r = floor(r)
      ctx.fillRect(r.x, r.y, r.w, r.h)
    }

    function text(t, x, y) {
      ctx.fillText(t, x, y)
    }

    function clear(r) {
      ctx.clearRect(r.x, r.y, r.w, r.h)
    }

    function font(size) {
      ctx.font = `${size}px sans-serif`
    }

    return {clear, line, strokeCircle, fillCircle,  strokeRect, fillRect, text, font}
  }

  return View
})