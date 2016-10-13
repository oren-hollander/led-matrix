'use strict'

define([], () => {

  function Screen(component, canvas){
    let stopped = false
    const ctx = canvas.getContext('2d')

    function paint() {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // ctx.beginPath()
      // ctx.moveTo(0, 0)
      // ctx.lineTo(canvas.width, canvas.height)
      // ctx.stroke()

      if(!component.shouldPaint || component.shouldPaint())
        component.paint(ctx)

      if(!stopped)
        window.requestAnimationFrame(paint)
    }

    function start() {
      stopped = false
      window.requestAnimationFrame(paint)
    }

    function stop() {
      stopped = true
    }

    return {start, stop}
  }

  return Screen
})