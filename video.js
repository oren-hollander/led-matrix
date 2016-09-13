"use strict"

function main() {

  const matrix = LedMatrix(60, 40, 8, 2)

  const canvas = document.createElement('canvas')
  canvas.style.border = '1px solid blue'
  canvas.width = matrix.width
  canvas.height = matrix.height

  var ctx = canvas.getContext('2d')

  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.src = 'la-linea.webm'

  video.addEventListener('play', () => {
    const [w, h] = calculateAspectRatioFit(video.videoWidth, video.videoHeight, matrix.width, matrix.height)
    canvas.style.position = 'absolute'
    canvas.style.width = px(w * 8)
    canvas.style.height = px(h * 8)
    canvas.style.left = px(w * 15)

    function draw() {
      if(video.ended) {
        matrix.clear()
        matrix.text('The End')
        return false;
      }

      ctx.drawImage(video, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data
      const pixels = imageDataToPixels(data, w, h, 0.3)
      matrix.image(pixels, 0, 0)
      setTimeout(draw, 20);
    }

    draw()
  })

  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
}