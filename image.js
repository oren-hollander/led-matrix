'use strict'

function main() {
  const matrix = LedMatrix(60, 40, 8, 2)

  function loadImage(url, contrastThreshold, callback) {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = matrix.width
      canvas.height = matrix.height
      const ctx = canvas.getContext('2d')

      const [w, h] = calculateAspectRatioFit(img.width, img.height, matrix.width, matrix.height)
      ctx.drawImage(img, 0, 0, w, h)

      const pixels = ctx.getImageData(0, 0, w, h).data
      const imagePixels = imageDataToPixels(pixels, w, h, contrastThreshold)
      callback(imagePixels)
    }
    img.src = url
  }

  loadImage('mm.jpg', undefined, pixels => {
    let x = matrix.width
    function update() {
      matrix.clear()
      matrix.image(pixels, x, 0)
      x--
      if(x < -pixels[0].length)
        x = matrix.width
    }

    window.setInterval(update, 75)
  })
}

