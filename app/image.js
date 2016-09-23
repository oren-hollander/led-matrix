'use strict'

function main() {

  const width = 60
  const height = 40

  function loadImage(url, contrastThreshold, callback) {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      const [w, h] = calculateAspectRatioFit(img.width, img.height, width, height)
      ctx.drawImage(img, 0, 0, w, h)

      const pixels = ctx.getImageData(0, 0, w, h).data
      const imagePixels = imageDataToPixels(pixels, w, h, contrastThreshold)
      callback(imagePixels)
    }
    img.src = url
  }

  loadImage('mm.jpg', undefined, pixels => {

    let x = width

    function update(matrix) {
      matrix.image(pixels, x, 0)
      x--
      if(x < -pixels[0].length)
        x = width
    }

    LedMatrix(width, height, 8, 2, update, 0)
  })
}

