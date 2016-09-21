'use strict'

define(['image', 'buffered-image'], (Image, BufferedImage) => {

  function px(pixels) {
    return pixels + "px"
  }

  function LedMatrix(width, height, ledSize, padding) {

    const leds = []

    const matrix = document.createElement('div')
    document.body.appendChild(matrix)
    matrix.style.backgroundColor = '#202020'
    matrix.style.position = 'absolute'
    matrix.style.left = '0'
    matrix.style.right = '0'
    matrix.style.top = '0'
    matrix.style.bottom = '0'
    matrix.style.width = px(padding + width * (ledSize + padding))
    matrix.style.height = px(padding + height * (ledSize + padding))
    matrix.style.margin = 'auto auto'

    for(let y = 0; y < height; y++) {
      const row = []
      leds.push(row)
      for(let x = 0; x < width; x++) {
        const onLed = document.createElement('div')
        const offLed = document.createElement('div')
        matrix.appendChild(offLed)
        matrix.appendChild(onLed)

        onLed.style.position = 'absolute'
        onLed.style.left = px(padding + x * (ledSize + padding))
        onLed.style.top = px(padding + y * (ledSize + padding))
        onLed.style.width = px(ledSize)
        onLed.style.height = px(ledSize)
        onLed.style.backgroundColor = '#d01010'
        onLed.style.borderRadius = px(ledSize / 2)
        onLed.style.visibility = 'hidden'

        offLed.style.position = 'absolute'
        offLed.style.left = px(padding + x * (ledSize + padding))
        offLed.style.top = px(padding + y * (ledSize + padding))
        offLed.style.width = px(ledSize)
        offLed.style.height = px(ledSize)
        offLed.style.backgroundColor = '#401010'
        offLed.style.borderRadius = px(ledSize / 2)
        row.push(onLed)
      }
    }

    function show(x, y) {
      leds[y][x].style.visibility = ''
    }

    function hide(x, y) {
      leds[y][x].style.visibility = 'hidden'
    }

    const ledImage = BufferedImage(width, height)

    function line (x1, y1, x2, y2, on = true) {
      var dx = Math.abs(x2 - x1)
      var dy = Math.abs(y2 - y1)
      var sx = (x1 < x2) ? 1 : -1
      var sy = (y1 < y2) ? 1 : -1
      var err = dx - dy

      ledImage.pixel(x1, y1, on)

      while (!((x1 == x2) && (y1 == y2))) {
        var e2 = err << 1
        if (e2 > -dy) {
          err -= dy
          x1 += sx
        }
        if (e2 < dx) {
          err += dx
          y1 += sy
        }

        ledImage.pixel(x1, y1, on)
      }
    }

    function char(x, y, ch, on = true){
      const charCode = ch.charCodeAt(0)
      if(charCode >= 0x20 && charCode <= 0x7f){
        for(let py = 0; py < fontHeight; py++){
          const row = ascii[charCode][py]
          for(let px = 0; px < fontWidth; px++){
            const pOn = ((row >> px) & 1) !== 0
            ledImage.pixel(x + (fontWidth - 1 - px), y + py, on ? pOn : !pOn)
          }
        }
      }
    }

    function text(str, x, y, on = true){
      if(x === undefined)
        x = Math.floor((width - (fontWidth + 1) * str.length) / 2)
      if(y === undefined)
        y = Math.floor((height - (fontHeight + 1)) / 2)

      for(let i = 0; i < str.length; i++){
        char(x, y, str[i], on)
        x += fontWidth + 1
      }
    }

    function image(img, x = 0, y = 0, on = true) {
      for(let py = 0; py < img.length; py++){
        for(let px = 0; px < img[py].length; px++){
          ledImage.pixel(x + px, y + py, on ? img[py][px] : !img[py][px])
        }
      }
    }

    function refresh() {
      ledImage.diff().forEach(({x, y, op}) => {
        if(op)
          show(x, y)
        else
          hide(x, y)
      })
    }

    return {
      pixel: ledImage.pixel, line, text, image, refresh
    }
  }

  return LedMatrix
})

