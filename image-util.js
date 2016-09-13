'use strict'

const grayscale = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)

  return [Math.floor(srcWidth * ratio), Math.floor(srcHeight * ratio)]
}

function imageDataToPixels(imageData, width, height, contrastThreshold = 0.5) {
  const imagePixels = []
  for(let y = 0; y < height; y++) {
    const row = []
    imagePixels.push(row)
    for(let x = 0; x < width; x++){
      const i = (y * width + x) * 4
      const r = imageData[i]
      const g = imageData[i + 1]
      const b = imageData[i + 2]
      const gs = grayscale(r, g, b) / 256
      row.push(gs > contrastThreshold)
    }
  }
  return imagePixels
}

