'use strict'

define([
  'lodash',
  'geometry/geometry'
], (
  _,
  {pointInCircle}
) => {

  const Buttons = () => {
    let buttons = []

    function add(button) {
      buttons.push(button)
    }

    function pressButton(button) {
      if(!button.pressed) {
        button.pressed = true
        if(api.onPress)
          api.onPress(button.name)
      }
    }

    function releaseButton(button) {
      if(button.pressed) {
        button.pressed = false
        if(api.onRelease)
          api.onRelease(button.name)
      }
    }

    function updateTouches(touches) {
      _.forEach(buttons, button => {
        if(_.some(touches, touch => pointInCircle(touch, button)))
          pressButton(button)
        else
          releaseButton(button)
      })
    }

    function clear() {
      buttons = []
    }

    const api = {add, updateTouches, clear, onPress: undefined, onRelease: undefined}

    return api
  }

  return Buttons
})