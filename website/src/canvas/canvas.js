'use strict'

define([
  'lodash',
  'util/html'
], (
  _,
  {px}
) => {


  let canvas
  let ctx

  function FullScreenCanvas(width, height, fullScreenStateChange) {
    const div = document.createElement('div')
    document.body.appendChild(div)

    canvas = document.createElement('canvas')
    div.appendChild(canvas)

    div.style.minHeight = '100%'
    document.body.parentNode.style.height = '100%'
    document.body.parentNode.style.margin = '0'
    document.body.style.height = '100%'
    document.body.style.margin = '0'

    canvas.style.position = 'absolute'
    canvas.style.margin = 'auto auto'
    canvas.style.border = '0'
    canvas.style.left = '0'
    canvas.style.right = '0'
    canvas.style.top = '0'
    canvas.style.bottom = '0'

    ctx = canvas.getContext('2d')

    canvas.addEventListener('click', () => {
      if(!document.webkitFullscreenElement)
        canvas.webkitRequestFullScreen()
    })

    canvas.width = width
    canvas.height = height
    canvas.style.width = px(width / window.devicePixelRatio)
    canvas.style.height = px(height / window.devicePixelRatio)

    document.addEventListener('webkitfullscreenchange', () => {
      if(fullScreenStateChange){
        fullScreenStateChange(document.webkitFullscreenElement === undefined)
      }
    })

    return {context: ctx, canvas, exitFullScreen: window.webkitExitFullscreen}
    // function showRequestFullScreenMessage() {
    //   ctx.clearRect(0, 0, canvas.width, canvas.height)
    //   ctx.lineWidth = 8
    //   ctx.strokeStyle = '#22AA22'
    //
    //   ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
    //
    //   ctx.fillStyle = '#DD1122'
    //   ctx.textAlign = 'center'
    //   ctx.font = "72px sans-serif";
    //   ctx.fillText('Click here for', 400, 200)
    //
    //   ctx.font = "100px sans-serif";
    //   ctx.fillText('full screen', 400, 400)
    //
    //   ctx.fillText(`pix rat: ${window.devicePixelRatio}`, 400, 500)
    //
    // }

    // function showSizeError() {
    //   ctx.clearRect(0, 0, canvas.width, canvas.height)
    //   ctx.lineWidth = 8
    //   ctx.strokeStyle = '#22AA22'
    //
    //   ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
    //
    //   ctx.fillStyle = '#DD1122'
    //   ctx.textAlign = 'center'
    //   ctx.font = "72px sans-serif";
    //   ctx.fillText('Window too small !', 400, 200)
    // }


    // showRequestFullScreenMessage()

    // function pause() {
    //   paused = true
    // }

    // function resume() {
    //   // if(document.body.clientWidth < width / window.devicePixelRatio || document.body.clientHeight < height / window.devicePixelRatio) {
    //   //   document.webkitExitFullscreen()
    //   //   showSizeError()
    //   // }
    //   // else {
    //     paused = false
    //     setCanvasSize(width, height)
    //     window.requestAnimationFrame(onAnimationFrame)
    //   // }
    // }
    //
    // function onAnimationFrame() {
    //   if(paused) {
    //     setCanvasSize(800, 600)
    //     showRequestFullScreenMessage()
    //   }
    //   else {
    //     painter(ctx)
    //     window.requestAnimationFrame(onAnimationFrame)
    //   }
    // }
  }

  return {FullScreenCanvas}
})