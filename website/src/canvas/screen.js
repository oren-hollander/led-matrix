'use strict'

requirejs.config({
  baseUrl: 'src',
  paths: {
    lodash: ['lib/lodash']
  }
});

require([
  'util/promise',
  'canvas/canvas',
  'canvas/screens'
], (
  {createPromise},
  {Canvas, setCanvasSize},
  Screens
) => {

  function MyThirdScreen() {
    let ctx, width, height
    let promise
    // let mouseIsDown = false

    // function mouseUp(x, y) {
    //   mouseIsDown = false
    // }
    //
    // function mouseMove(x, y) {
    //   if(mouseIsDown) {
    //     ctx.lineWidth = 3
    //     ctx.strokeStyle = 'black'
    //     ctx.beginPath()
    //     ctx.moveTo(x, y)
    //     ctx.lineTo(x + 1, y + 1)
    //     ctx.moveTo(0, 0)
    //     ctx.lineTo(1000, 1000)
    //     ctx.stroke()
    //   }
    // }

    function mouseUp(x, y) {
      promise.resolve('hello from screen 3')
    }

    function paint(){
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'red'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'
      ctx.fillText('Third screen', width / 2, height / 2)
    }

    function show(context, w, h){
      width = w
      height = h
      ctx = context
      promise = createPromise()
      return promise
    }

    return {mouseUp, paint, show}
  }

  function MySecondScreen(screens) {
    let promise
    let ctx, width, height

    function mouseUp(x, y) {
      if(x < width / 2){
        promise.resolve('hello from screen 2')
      }
      else{
        screens.show('screen3').then(promise.resolve)
      }
    }

    function paint(){
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'red'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'
      ctx.fillText('Second screen', width / 2, height / 2)
    }

    function show(context, w, h){
      promise = createPromise()
      width = w
      height = h
      ctx = context
      return promise
    }

    return {mouseUp, paint, show}
  }

  function MyScreen(screens) {

    let ctx, width, height
    let promise

    function mouseUp(x, y) {
      screens.show('screen2').then(r => {
        console.log(r)
      })
    }

    function paint(){
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'red'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'
      ctx.fillText('First screen', width / 2, height / 2)
    }

    function show(context, w, h){
      width = w
      height = h
      ctx = context
      promise = createPromise()
      return promise
    }

    return {mouseUp, paint, show}
  }

  const screen1 = MyScreen
  const screen2 = MySecondScreen
  const screen3 = MyThirdScreen
  const canvas = Canvas()
  setCanvasSize(canvas, window.screen.width * 0.9, window.screen.height * 0.9)

  const screens = Screens(canvas, {screen1, screen2, screen3})

  screens.show('screen1')
})