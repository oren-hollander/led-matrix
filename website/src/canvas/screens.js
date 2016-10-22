'use strict'

define([
  'lodash',
  'util/promise'
], (
  _,
  {createPromise}
) => {

  function Screens(canvas, screenConstructors){
    const screens = _.mapValues(screenConstructors, ctor => ctor({show}))
    const ctx = canvas.getContext('2d')
    let activeScreen

    canvas.addEventListener('mouseup', e => {
      if(activeScreen && activeScreen.mouseUp){
        activeScreen.mouseUp(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio)
      }
    })

    canvas.addEventListener('mousedown', e => {
      if(activeScreen && activeScreen.mouseDown){
        activeScreen.mouseDown(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio)
      }
    })

    canvas.addEventListener('mousemove', e => {
      if(activeScreen && activeScreen.mouseMove){
        activeScreen.mouseMove(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio)
      }
    })

    const handleTouch = e => {
      if(activeScreen && activeScreen.updateTouches){
        const screenTouches = _.map(e.touches, touch => ({x: touch.offsetX * window.devicePixelRatio, y: touch.offsetY * window.devicePixelRatio}))
        activeScreen.updateTouches(screenTouches)
      }
    }

    canvas.addEventListener('touchstart', handleTouch, false)
    canvas.addEventListener('touchmove', handleTouch, false)
    canvas.addEventListener('touchcancel', handleTouch, false)
    canvas.addEventListener('touchend', handleTouch, false)

    function show(screenName, ...args){
      const screen = screens[screenName]
      let promise = screen.show(ctx, canvas.width, canvas.height, ...args)
      if(activeScreen){
        const prevActiveScreen = activeScreen
        const closePromise = createPromise()
        promise
          .then(r => {
            activeScreen = prevActiveScreen
            closePromise.resolve(r)
          })
          .catch(e => {
            activeScreen = prevActiveScreen
            closePromise.reject(e)
          })
        promise = closePromise
      }

      activeScreen = screen
      return promise
    }

    function screen(screenName){
      return screens[screenName]
    }

    function paint(){
      window.requestAnimationFrame(paint)
      if(activeScreen){
        activeScreen.paint()
      }
      else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    paint()
    return {show, screen}
  }

  return Screens
})