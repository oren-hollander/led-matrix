'use strict'

function main() {

  const width = 91

  const matrix = LedMatrix(width, fontHeight + 2, 12, 2)
  const matrixApi = batchApi({pixel: matrix.pixel, refresh: matrix.refresh, add: (a, b) => a + b})

  WorkerProxy(matrixApi, new Worker('banner-worker.js')).then(api => {
    api.update()
    // let pts
    // function onFrame(ts) {
    //   if(!pts)
    //     pts = ts
    //
    //   if (ts - pts >= 50) {
    //     api.update()
    //     pts = ts
    //   }
    //   requestAnimationFrame(onFrame)
    // }
    //
    // requestAnimationFrame(onFrame)
  })
}