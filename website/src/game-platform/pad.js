'use strict'

define([
  'game-platform/buttons'
], (
  Buttons
) => {

  function Pad() {
    let station
    const buttons = Buttons()

    const pad = {
      buttonPressed: button => {
        if(station){
          station.onPress(button)
        }
      },
      buttonReleased: button => {
        if(station){
          station.onRelease(button)
        }
      },

      createButton: (name, x, y, r, color) => {
        console.log('createButton', name)
        buttons.add({name, x, y, r, color, pressed: false})
      },

      setStation: s => {
        station = s
      }
    }

    return pad
  }

  return Pad
})