'use strict'

define([], () => {

  function Pad(buttons) {
    let station

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