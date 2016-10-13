'use strict'

define([], () => {
  function Pad() {
    const api = {
      onPress: undefined,
      onRelease: undefined,
      buttonPressed: button => {
        if(api.onPress){
          api.onPress(button)
        }
      },
      buttonReleased: button => {
        if(api.onRelease){
          api.onRelease(button)
        }
      },
    }

    return api
  }

  return Pad
})