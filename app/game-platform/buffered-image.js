'use strict'

define(['image', 'image-diff'], (Image, imageDiff) => {
  function BufferedImage(width, height) {
    let active = 0
    let inactive = 1

    const images = [Image(width, height), Image(width, height)]

    function flip() {
      active = inactive
      inactive = active === 0 ? 1 : 0
    }

    function pixel(x, y, value) {
      return images[inactive].pixel(x, y, value)
    }

    function diff() {
      const patch = imageDiff(images[active], images[inactive])
      patch.forEach(({x, y, op}) => {
        images[active].pixel(x, y, op)
      })
      flip(0)
      return patch
    }

    return {diff, pixel, width: () => width, height: () => height}
  }

  return BufferedImage
})