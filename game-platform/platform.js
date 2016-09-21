'use strict'

require(['led-matrix', 'canvas-image', 'Image', 'range'], (LedMatrix, CanvasImage, Image, range) => {

  const matrix = LedMatrix(40, 30, 10, 2)
  matrix.line(0, 0, 10, 10)
  matrix.refresh()
  matrix.line(10, 0, 0, 10)
  matrix.refresh()

  const ci = CanvasImage(4, 4)
  const sourceImage = Image(4, 4)
  sourceImage.pixel(0, 0, true)
  ci.image(sourceImage)
  const image = ci.getImage()

  let s = ''
  for (let x of range.from(0).until(image.width())) {
    for (let y of range.from(0).until(image.height())) {
      s += image.pixel(x, y)
    }
    s += '\n'
  }

  console.log(s)
})
