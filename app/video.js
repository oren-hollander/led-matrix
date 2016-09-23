"use strict"

function main() {

  const width = 80
  const height = 60

  const canvas = document.createElement('canvas')
  canvas.style.border = '1px solid blue'
  canvas.width = width
  canvas.height = height

  var ctx = canvas.getContext('2d')

  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.src = 'la-linea.webm'

  // const padIndex = (i) => ("00" + i).substr(-2, 2)

  const coord = (n) => String.fromCharCode(33 + n);
  const charForCode = (n) => String.fromCharCode(33 + 32 + n);

  video.addEventListener('play', () => {
    const [w, h] = calculateAspectRatioFit(video.videoWidth, video.videoHeight, width, height)

    function draw(matrix) {
      if (video.ended) {
        matrix.text('The', undefined, 4);
        matrix.text('End', undefined, 14);
        matrix.stop();
        return
      }

      ctx.drawImage(video, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data
      const pixels = imageDataToPixels(data, w, h, 0.3)
      matrix.image(pixels, 0, 0)
    }

    let recorderVideo = []

    function encodePatches(patch) {
      return patch.map(({x, y, shortcut}) => {
        if (shortcut)
          return shortcut;
        else
          return coord(x) + coord(y);
      }).join('');
    }

    function encodePatch(patch) {
      const onPatches = patch.filter((p) => p.op);
      const offPatches = patch.filter((p) => !p.op);

      setPatchShortcuts(onPatches);
      setPatchShortcuts(offPatches);

      return encodePatches(onPatches) + charForCode(9) + encodePatches(offPatches);
    }

    function setPatchShortcuts(patch) {
      for(let i = patch.length - 1; i > 0; i--){
        const n = patch[i]
        const p = patch[i - 1]
        const dx = n.x - p.x
        const dy = n.y - p.y

        if(dx === -1 && dy === -1)
          patch[i].shortcut = charForCode(1);
        else if(dx === 0 && dy === -1)
          patch[i].shortcut = charForCode(2);
        else if(dx === 1 && dy === -1)
          patch[i].shortcut = charForCode(3);
        else if(dx === 1 && dy === 0)
          patch[i].shortcut = charForCode(4);
        else if(dx === 1 && dy === 1)
          patch[i].shortcut = charForCode(5);
        else if(dx === 0 && dy === 1)
          patch[i].shortcut = charForCode(6);
        else if(dx === -1 && dy === 1)
          patch[i].shortcut = charForCode(7);
        else if(dx === -1 && dy === 0)
          patch[i].shortcut = charForCode(8);
      }
    }

    let frame = 0

    const recorder = patch => {
      if(patch.length > 0) {
        recorderVideo[frame] = patch;
      }
      frame++
    }

    function onComplete() {
      recorderVideo = recorderVideo.map(encodePatch);
      const buf = recorderVideo.join(charForCode(10));
      console.log(buf.length)
    }

    LedMatrix(width, height, 8, 2, draw, 200, recorder, onComplete)
  })

  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
}
