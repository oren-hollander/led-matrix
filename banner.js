'use strict'

function main() {

  const width = (fontWidth + 1) * 15 + 1

  let x = width
  const text = 'Hello, I am a banner !!!'
  let textWidth = text.length * (fontWidth + 1) - 1

  function update(matrix) {
    matrix.text(text, x, 1)
    x--
    if(x < -textWidth)
      x = width
  }

  LedMatrix(width, fontHeight + 2, 12, 2, update, 0)
}