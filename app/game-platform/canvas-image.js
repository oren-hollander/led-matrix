'use strict'

define(['range', 'image'], (range, Image) => {

  function CanvasImage(width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    function line(x1, y1, x2, y2) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    function clear() {
      ctx.clearRect(0, 0, width, height)
    }

    function point(x, y) {
      line(x, y, x + 1, y + 1)
    }

    function circle(x, y, r) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke()
    }

    function rectangle(x1, y1, x2, y2) {
      ctx.strokeRect(x1, y1, x2, y2)
    }

    function image(img) {
      const imageData = ctx.getImageData(0, 0, width, height)

      for (let x of range.from(0).until(img.width())) {
        for (let y of range.from(0).until(img.height())) {
          const index = (x + y * width) * 4
          imageData.data[index] = 0
          imageData.data[index + 1] = 0
          imageData.data[index + 2] = 0
          imageData.data[index + 3] = img.pixel(x, y) ? 0xFF : 0
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    function getImage() {
      const pixels = ctx.getImageData(0, 0, width, height).data
      const image = Image(width, height)

      for(let x of range.from(0).until(width)) {
        for(let y of range.from(0).until(height)){
          const i = (y * width + x) * 4
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]
          if(r === 0 && g === 0 && b === 0 && a === 0xFF)
            image.pixel(x, y, true)
        }
      }

      return image
    }

    return {clear, point, line, circle, rectangle, image, getImage, width: () => width, height: () => height}
  }

  return CanvasImage
})
