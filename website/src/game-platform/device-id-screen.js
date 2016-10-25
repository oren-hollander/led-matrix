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
  function DeviceIdScreen() {
    let ctx, width, height, promise
    let digits, codeBoxSize, codePad, codesHeight, buttonsHeight, buttonRadius, codeBoxes, x, y, size

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
        promise.resolve(code)
      }
    }

    const Button = (circle, label, onClick) => ({circle, label, onClick})
    let buttons

    function mouseUp(x, y) {
      const p = Point(x, y)
      const buttonUnderMouse = _(buttons).find(b => pointInCircle(p, b.circle))
      if(buttonUnderMouse){
        buttonUnderMouse.onClick()
      }
    }

    function show(context, w, h){
      width = w
      height = h
      ctx = context

      digits = ['0', '0', '0', '0', '0']

      size = Math.min(width, height)

      x = (width - size) / 2
      y = (height - size) / 2

      codeBoxSize = size / 5 * 0.7
      codePad = (size - 5 * codeBoxSize) / 6
      codesHeight = codeBoxSize + 2 * codePad

      codeBoxes = _(5)
        .range()
        .map(i => Box(x + codeBoxSize * 0.5 + codePad + i * (codeBoxSize + codePad), 0.5 * codesHeight, codeBoxSize * 0.5, codeBoxSize * 0.5))
        .value()

      const buttonCircle = p => Circle(x + p.x, y + codesHeight + p.y, buttonRadius)


      buttonsHeight = size - codesHeight
      buttonRadius = buttonsHeight / 8 * 0.7

      const buttonGrid = grid(0, 1, 3, 5, 6)(0, 1, 3, 5, 7, 8)(size, buttonsHeight)

      buttons = [
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

      promise = createPromise()
      return promise
    }

    function paint(){
      ctx.clearRect(0, 0, width, height)

      const view = View(ctx)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      view.font(buttonRadius * 1.8)

      // draw code boxes
      ctx.fillStyle = Colors.secondary1[0]
      ctx.fillRect(x, y, size, codesHeight)
      ctx.fillStyle = Colors.secondary1[4]
      _(codeBoxes).map(boxToRect).forEach(view.fillRect)

      ctx.fillStyle = Colors.secondary1[1]
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

    return {show, paint, mouseUp}
  }

  return DeviceIdScreen
})