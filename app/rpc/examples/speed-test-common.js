'use strict'

define([], () => {
  const speedTestProtocol = {
    // ProcessImage: {
    //   tuple: ['Image']
    // },
    Pixel: {
      struct: {
        red: 'uint8',
        green: 'uint8',
        blue: 'uint8'
      }
    },
    Image: {
      array: 'Pixel'
    }
  }

  return speedTestProtocol
})