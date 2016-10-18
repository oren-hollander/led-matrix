'use strict'

define([], () => {

  function Screen(canvas){
    const ctx = canvas.getContext('2d')
    let paintFunction

    function paint() {
      window.requestAnimationFrame(paint)
      if(paintFunction)
        paintFunction(ctx, canvas.width, canvas.height)
    }

    paint()

    function setPainter(pf) {
      paintFunction = pf
    }

    return {setPainter}
  }

  return Screen
})