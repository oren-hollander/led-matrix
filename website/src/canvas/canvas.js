'use strict'

define([
  'lodash',
  'util/html'
], (
  _,
  {px}
) => {

  function Canvas() {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)

    document.documentElement.style.height = '100%'
    document.documentElement.style.margin = '0'
    document.body.style.height = '100%'
    document.body.style.margin = '0'

    canvas.style.position = 'absolute'
    canvas.style.margin = 'auto auto'
    canvas.style.border = '0'
    canvas.style.left = '0'
    canvas.style.right = '0'
    canvas.style.top = '0'
    canvas.style.bottom = '0'

    return canvas
  }

  function setCanvasSize(canvas, w, h){
    canvas.width = w * window.devicePixelRatio
    canvas.height = h * window.devicePixelRatio
    canvas.style.width = px(w)
    canvas.style.height = px(h)
  }


  function stretchCanvas(canvas) {
    canvas.width = screen.width * window.devicePixelRatio
    canvas.height = screen.height * window.devicePixelRatio
    canvas.style.width = px(screen.width)
    canvas.style.height = px(screen.height)
  }

  return {Canvas, setCanvasSize, stretchCanvas}
})



