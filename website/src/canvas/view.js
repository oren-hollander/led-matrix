'use strict'

define([
  'lodash'
], (
  _
) => {
  function View(canvas, bounds) {

    const ctx = canvas.getContext('2d')

    ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h)
    ctx.clip()
    ctx.translate(bounds.x, bounds.y)

    function line(l) {
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    }

    function circle(c) {
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI)
      ctx.stroke()
    }

    function rect(r) {
      ctx.strokeRect(r.x, r.y, r.w, r.h)
    }

    function text(t, x, y) {
      ctx.fillText(t, x, y)
    }

    return {line, circle, rect, text}
  }

  return View
})