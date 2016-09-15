"use strict"

function main() {

  const width = 60
  const height = 40

  const canvas = document.createElement('canvas')
  canvas.style.border = '1px solid blue'
  canvas.width = width
  canvas.height = height

  var ctx = canvas.getContext('2d')

  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.src = 'la-linea.webm'

  const padIndex = (i) => ("00" + i).substr(-2, 2)

  video.addEventListener('play', () => {
    const [w, h] = calculateAspectRatioFit(video.videoWidth, video.videoHeight, width, height)
    canvas.style.position = 'absolute'
    canvas.style.width = px(w * 8)
    canvas.style.height = px(h * 8)
    canvas.style.left = px(w * 15)

    function draw(matrix) {
      if(video.ended) {
        matrix.text('The End')
        matrix.stop();
        return
      }

      ctx.drawImage(video, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data
      const pixels = imageDataToPixels(data, w, h, 0.3)
      matrix.image(pixels, 0, 0)
    }

    let recorderVideo = []

    const encodePatch = patch => patch.map(({op, x, y, shortcut}) => {
      const opStr = (op ? 1 : 0)
      if(shortcut)
        return shortcut + opStr
      else
        return padIndex(x) + padIndex(y) + opStr
    }).join('')

    function setPatchShortcuts(patch) {
      for(let i = patch.length - 1; i > 0; i--){
        const n = patch[i]
        const p = patch[i - 1]
        const dx = n.x - p.x
        const dy = n.y - p.y

        if(dx === -1 && dy === -1)
          patch[i].shortcut = 'a'
        else if(dx === 0 && dy === -1)
          patch[i].shortcut = 'b'
        else if(dx === 1 && dy === -1)
          patch[i].shortcut = 'c'
        else if(dx === 1 && dy === 0)
          patch[i].shortcut = 'd'
        else if(dx === 1 && dy === 1)
          patch[i].shortcut = 'e'
        else if(dx === 0 && dy === 1)
          patch[i].shortcut = 'f'
        else if(dx === -1 && dy === 1)
          patch[i].shortcut = 'g'
        else if(dx === -1 && dy === 0)
          patch[i].shortcut = 'h'
      }
    }

    let frame = 0

    const recorder = patch => {
      if(patch.length > 0) {
        setPatchShortcuts(patch)
        recorderVideo[frame] = encodePatch(patch)
      }
      frame++
    }

    function onComplete() {
      console.log(recorderVideo)
    }

    LedMatrix(60, 40, 8, 2, draw, 200, recorder, onComplete)
  })

  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
}