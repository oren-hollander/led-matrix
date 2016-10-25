'use strict'

requirejs.config({
  baseUrl: 'src',
  paths: {
    lodash: ['lib/lodash']
  }
})

require([
  'lodash',
  'canvas/canvas',
  'canvas/screens',
  'util/promise',
  'canvas/view',
  'geometry/geometry',
  'game-platform/colors'
], (
  _,
  {Canvas, setCanvasSize},
  Screens,
  {createPromise},
  View,
  {Circle, Rect, Point, Box, Line, pointInCircle, pointInRect, boxToRect, circleToBox},
  Colors
) => {

  function ChessScreen(){
    let ctx, width, height, promise

    const White = 0, Black = 1

    const WK = String.fromCharCode(0x2654)
    const WQ = String.fromCharCode(0x2655)
    const WR = String.fromCharCode(0x2656)
    const WB = String.fromCharCode(0x2657)
    const WN = String.fromCharCode(0x2658)
    const WP = String.fromCharCode(0x2659)
    const BK = String.fromCharCode(0x265A)
    const BQ = String.fromCharCode(0x265B)
    const BR = String.fromCharCode(0x265C)
    const BB = String.fromCharCode(0x265D)
    const BN = String.fromCharCode(0x265E)
    const BP = String.fromCharCode(0x265F)

    const pieces = [
      [BR, BN, BB, BK, BQ, BB, BN, BR],
      [BP, BP, BP, BP, BP, BP, BP, BP],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      [WP, WP, WP, WP, WP, WP, WP, WP],
      [WR, WN, WB, WK, WQ, WB, WN, WR]
    ]

    function show(context, w, h) {
      width = w
      height = h
      ctx = context
      promise = createPromise()
      return promise
    }

    function paint() {
      ctx.fillStyle = 'red'
      ctx.fillRect(0, 0, width, height)

      const size = Math.min(width, height)
      const l = (width - size) / 2
      const t = (height - size) / 2
      const squareSize = size / 8

      ctx.fillStyle = 'white'
      ctx.fillRect(l, t, size, size)

      ctx.fillStyle = 'black'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${squareSize * 0.8}px sans-serif`

      for(let i = 0; i < 8; i++){
        for(let j = 0; j < 8; j++){
          if((i % 2) && (j % 2) || !(i % 2) && !(j % 2)){
            ctx.fillStyle = 'black'

            ctx.fillRect(l + squareSize * i, t + squareSize * j, squareSize, squareSize)
            ctx.fillStyle = 'white'
            ctx.fillText(pieces[j][i], l + squareSize * i + squareSize / 2, t + squareSize * j + squareSize / 2)
          }
          else {
            ctx.fillStyle = 'black'
            ctx.fillText(pieces[j][i], l + squareSize * i + squareSize / 2, t + squareSize * j + squareSize / 2)

          }
        }
      }
    }

    return {show, paint}
  }

  const canvas = Canvas()
  setCanvasSize(canvas, window.innerWidth, window.innerHeight)

  const screens = Screens(canvas, {chess: ChessScreen})
  screens.show('chess')

})