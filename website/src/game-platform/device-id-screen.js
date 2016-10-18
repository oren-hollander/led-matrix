'use strict'

define([
  'lodash',
  'util/promise',
  'geometry/geometry',
  'canvas/view',
  'canvas/grid',
  'game-platform/colors'
], (
  _,
  {createPromise},
  {Point, Circle, Box, boxToRect, pointInCircle},
  View,
  grid,
  Colors
) => {
  function DeviceIdScreen(canvas) {
    const ctx = canvas.getContext('2d')
    let quit = false
    const digits = []

    const size = Math.min(canvas.width, canvas.height)
    const x = (canvas.width - size) / 2
    const y = (canvas.height - size) / 2
    const codeBoxSize = size / 5 * 0.7
    const codePad = (size - 5 * codeBoxSize) / 6
    const codesHeight = codeBoxSize + 2 * codePad

    const buttonsHeight = size - codesHeight
    const buttonRadius = buttonsHeight / 8 * 0.7

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const codeBoxes = _(5)
      .range()
      .map(i => Box(x + codeBoxSize * 0.5 + codePad + i * (codeBoxSize + codePad), 0.5 * codesHeight, codeBoxSize * 0.5, codeBoxSize * 0.5))
      .value()

    const onDigitPressed = digit => () => {
      if(digits.length < 5)
        digits.push(digit)
    }

    function onDeletePressed() {
      if(digits.length > 0)
        digits.pop()
    }

    function onEnterPressed() {
      if(digits.length === 5){
        const code = digits.join('')
        quit = true
        promise.resolve(code)
      }
    }

    const Button = (circle, label, onClick) => ({circle, label, onClick})

    const buttonGrid = grid(0, 1, 3, 5, 6)(0, 1, 3, 5, 7, 8)(size, buttonsHeight)

    const buttonCircle = p => Circle(x + p.x, y + codesHeight + p.y, buttonRadius)

    const buttons = [
      Button(buttonCircle(buttonGrid(1, 1)), '1', onDigitPressed('1')),
      Button(buttonCircle(buttonGrid(2, 1)), '2', onDigitPressed('2')),
      Button(buttonCircle(buttonGrid(3, 1)), '3', onDigitPressed('3')),
      Button(buttonCircle(buttonGrid(1, 2)), '4', onDigitPressed('4')),
      Button(buttonCircle(buttonGrid(2, 2)), '5', onDigitPressed('5')),
      Button(buttonCircle(buttonGrid(3, 2)), '6', onDigitPressed('6')),
      Button(buttonCircle(buttonGrid(1, 3)), '7', onDigitPressed('7')),
      Button(buttonCircle(buttonGrid(2, 3)), '8', onDigitPressed('8')),
      Button(buttonCircle(buttonGrid(3, 3)), '9', onDigitPressed('9')),
      Button(buttonCircle(buttonGrid(1, 4)), '<', onDeletePressed),
      Button(buttonCircle(buttonGrid(2, 4)), '0', onDigitPressed('0')),
      Button(buttonCircle(buttonGrid(3, 4)), 'E', onEnterPressed),
    ]

    canvas.addEventListener('click', e => {
      const p = Point(e.offsetX * window.devicePixelRatio, e.offsetY * devicePixelRatio)
      const buttonUnderMouse = _(buttons).find(b => pointInCircle(p, b.circle))
      if(buttonUnderMouse){
        buttonUnderMouse.onClick()
      }
    })

    function paint(){
      if(!quit){
        window.requestAnimationFrame(paint)
      }

      const view = View(ctx)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'

      // draw code boxes
      ctx.fillStyle = Colors.secondary1[0]
      ctx.fillRect(x, y, size, codesHeight)
      ctx.fillStyle = Colors.secondary1[4]
      _(codeBoxes).map(boxToRect).forEach(view.fillRect)

      ctx.fillStyle = Colors.secondary1[0]
      _(codeBoxes).take(digits.length).zip(digits).forEach(([rect, digit]) => {
        view.text(digit, rect.x, rect.y)
      })

      // draw keypad
      ctx.fillStyle = Colors.secondary2[0]
      ctx.fillRect(x, y + codesHeight, size, buttonsHeight)
      ctx.fillStyle = Colors.secondary2[4]
      _(buttons).map('circle').forEach(view.fillCircle)

      ctx.fillStyle = Colors.secondary2[0]
      _.forEach(buttons, b => {
        view.text(b.label, b.circle.x, b.circle.y)
      })
    }

    paint()

    const promise = createPromise()
    return promise
  }

  return DeviceIdScreen
})