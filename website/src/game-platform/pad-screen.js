'use strict'

define([
  'lodash',
  'util/promise',
  'game-platform/colors',
  'game-platform/buttons',
  'geometry/geometry'
], (
  _,
  {createPromise},
  Colors,
  Buttons,
  {Point, pointInCircle}
) => {
  function PadScreen(){
    let ctx, width, height, promise, backgroundColor, station, padId

    let buttons = []
    const buttonTouches = Buttons(buttons)
    let debugMouse

    function mouseUp(x, y){
      const p = Point(x, y)
      debugMouse = p
      _.forEach(buttons, button => {
        if(pointInCircle(p, button)){
          station.onRelease(padId, button.name)
        }
      })
    }

    function mouseDown(x, y) {
      const p = Point(x, y)
      _.forEach(buttons, button => {
        if(pointInCircle(p, button)){
          station.onPress(padId, button.name)
        }
      })
    }

    function show(context, w, h, stationApi, padApi){
      station = stationApi

      padApi.setPadId = pid => {
        padId = pid
      }

      padApi.createButton = (name, x, y, r, color) => {
        buttons.push({name, x, y, r, color, pressed: false})
      }

      padApi.getBounds = () => ({w, h})
      padApi.setBackgroundColor = color => {
        backgroundColor = color
      }

      padApi.reset = () => {
        buttons = []
      }

      buttons.onPress = stationApi.onPress
      buttons.onRelease = stationApi.onRelease

      ctx = context
      width = w
      height = h
      promise = createPromise()
      return promise
    }

    function paint(){

      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'

      _.forEach(buttons, button => {
        ctx.fillStyle = button.color
        ctx.beginPath()
        ctx.arc(button.x, button.y, button.r, 0, Math.PI * 2)
        ctx.fill()
      })

      if(debugMouse){
        ctx.fillStyle = 'blue'
        ctx.beginPath()
        ctx.arc(debugMouse.x, debugMouse.y, buttons[0].r, 0, Math.PI * 2)
        ctx.fill()
      }

    }

    return {show, paint, mouseUp, mouseDown, updateTouches: buttonTouches.updateTouches}
  }

  return PadScreen
})
