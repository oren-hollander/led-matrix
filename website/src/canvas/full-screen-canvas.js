'use strict'

define([
  'lodash',
  'util/html',
  'canvas/view',
  'geometry/geometry'
], (
  _,
  {px},
  View,
  {Line, Rect}
) => {

  function FullScreenCanvas() {

    let orientation = getScreenOrientation()

    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)

    document.body.parentNode.style.height = '100%'
    document.body.parentNode.style.margin = '0'
    document.body.style.height = '100%'
    document.body.style.margin = '0'

    canvas.style.position = 'absolute'
    canvas.style.margin = 'auto auto'
    canvas.style.border = '0'
    canvas.style.left = '0'
    canvas.style.right = '0'
    canvas.style.top = '0'
    canvas.style.bottom = '0'
    const ctx = canvas.getContext('2d')

    function isInFullScreen() {
      return !!document.webkitFullscreenElement
    }

    function getScreenOrientation() {
      return window.screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape'
    }

    function requestFullScreen() {
      if(!isInFullScreen()){
        canvas.webkitRequestFullScreen()
      }
    }

    canvas.addEventListener('click', requestFullScreen)

    window.screen.orientation.addEventListener('change', () => {
      if(isInFullScreen()){
        setCanvasSize()
      }
    })

    document.addEventListener('webkitfullscreenchange', fullScreenChange)

    function fullScreenChange() {
      if(isInFullScreen()) {
        if(getScreenOrientation() === orientation){
          setCanvasSize()
        }
        window.screen.orientation.lock(orientation)
      }
    }

    function setCanvasSize(){
      canvas.width = screen.width * window.devicePixelRatio
      canvas.height = screen.height * window.devicePixelRatio
      canvas.style.width = px(screen.width)
      canvas.style.height = px(screen.height)

      const ctx = canvas.getContext('2d')
      const view = View(ctx, Rect(0, 0, canvas.width, canvas.height))

      view.line(Line(0, 0, canvas.width, canvas.height))
      view.line(Line(0, canvas.height, canvas.width, 0))
      view.line(Line(0, canvas.height / 2, canvas.width, canvas.height / 2))
      view.line(Line(canvas.width / 2, 0, canvas.width / 2, canvas.height))

      if(component)
        component.layout(Rect(0, 0, canvas.width, canvas.height))
    }

    let component

    function setComponent(c) {
      component = c
    }

    function paint() {
      window.requestAnimationFrame(paint)

      if(isInFullScreen()){
        if(!component)
          return

        if(!component.shouldPaint || component.shouldPaint()) {
          component.paint(ctx)
        }
      }
      else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#DD1122'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = '48px sans-serif'
        ctx.fillText('Full screen', canvas.width / 2, canvas.height / 2)
      }
    }

    window.requestAnimationFrame(paint)

    function setOrientation(o) {
      orientation = o
    }

    const handleTouch = e => {
      if(!isInFullScreen())
        return

      if(e.cancelable)
        e.preventDefault()

      if(api.onTouch)
        api.onTouch(e)
    }

    canvas.addEventListener('touchstart', handleTouch, false)
    canvas.addEventListener('touchmove', handleTouch, false)
    canvas.addEventListener('touchcancel', handleTouch, false)
    canvas.addEventListener('touchend', handleTouch, false)

    const api = {setComponent, setOrientation, onTouch: undefined}

    return api
  }

  return FullScreenCanvas
})