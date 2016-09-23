'use strict'

define(['range'], (range) => {

  function Image(width, height) {
    const pixels = []

    function pixel(x, y, value) {
      if(value !== undefined) {
        const previousValue = pixels[x][y]
        pixels[x][y] = value
        return previousValue
      }
      else {
        return pixels[x][y]
      }
    }

    for (let x of range.from(0).until(width)){
      pixels[x] = []
      for (let y of range.from(0).until(height)){
        pixel(x, y, false)
      }
    }

    return {pixel, width: () => width, height: () => height}
  }

  return Image
})