'use strict'

define([
  'lodash',
  'game-platform/colors'
], (
  _,
  Colors
) => {
  function PadScreen (canvas, pad){
    const ctx = canvas.getContext('2d')

    function paint(){
      window.requestAnimationFrame(paint)
      ctx.fillStyle = Colors.primary[0]
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'
      ctx.fillStyle = Colors.primary[4]
      ctx.fillText('Connecting...', canvas.width / 2, canvas.height / 2)
    }
    paint()
  }

  return PadScreen
})
