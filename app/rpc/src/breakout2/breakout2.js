'use strict'

requirejs.config({
  baseUrl: '/app/rpc/src',
  paths: {
    lodash: ['/lib/lodash']
  }
});

require(['lodash'], (_) => {

  const brickColumnCount = 8
  const brickRowCount = 16
  const courtWidth = 800
  const courtHeight = 600
  const backPaddleX = 10
  const frontPaddleX = 20
  const paddleWidth = 8
  const frontPaddleHeight = 90
  const backPaddleHeight = 60
  const smallBallRadius = 10
  const largeBallRadius = 20
  const brickWidth = 20
  const brickHeight = 28
  const ballVelocity = 400 // pixels per second
  const paddleVelocity = 400
  const bricksX = courtWidth / 3
  const bricksY = brickHeight / 2
  const bricksXPad = (courtWidth - (2 * bricksX) - brickColumnCount * brickWidth) / (brickColumnCount - 1)
  const bricksYPad = (courtHeight - (2 * bricksY) - brickRowCount * brickHeight) / (brickRowCount - 1)
  const initialBallX = courtWidth / 3 - 20

  const initGameState = () => {
    const bricks = _.fill(new Array(brickColumnCount), _.fill(new Array(brickRowCount), true))

    const player1 = {
      frontPaddleY: courtHeight / 3,
      backPaddleY: courtHeight * 2/ 3
    }

    const player2 = {
      frontPaddleY: courtHeight  * 2 / 3,
      backPaddleY: courtHeight / 3
    }

    const ball1 = {x: initialBallX, y: courtHeight / 2, size: 'small'}
    const ball2 = {x: courtWidth - initialBallX, y: courtHeight / 2, size: 'small'}

    return {
      bricks, player1, player2, ball1, ball2
    }
  }

  const gameState = initGameState()

  const limit = (value, min, max, pad) => Math.max(min + pad, Math.min(max - pad, value))

  // const movePaddle = (player, paddle, distance) => {
  //   if(player == 1 && paddle = 1)
  //
  //   const paddleHeight = paddle === 0 ? frontPaddleHeight : backPaddleHeight
  //   gameState.paddles[player][paddle] = limit(gameState.paddles[player][paddle] + distance, 0, courtHeight, paddleHeight / 2)
  // }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  function px(pixels) {
    return pixels + 'px'
  }

  document.body.appendChild(canvas)
  canvas.width = courtWidth
  canvas.height = courtHeight
  // canvas.style.backgroundColor = '#202020'
  canvas.style.position = 'absolute'
  canvas.style.left = '0'
  canvas.style.right = '0'
  canvas.style.top = '0'
  canvas.style.bottom = '0'
  canvas.style.width = px(courtWidth / 2)
  canvas.style.height = px(courtHeight / 2)
  canvas.style.margin = 'auto auto'
  canvas.style.border = '4px solid black'

  canvas.style.width = `${width / 2}px`
  canvas.style.height = `${height / 2}px`
  const ballRadius = size => size === 'small' ? smallBallRadius : largeBallRadius

  const paint = () => {

    ctx.clearRect(0, 0, courtWidth, courtHeight)

    const brickRect = (x, y) => {
      const left = bricksX + x * (brickWidth + bricksXPad)
      const top = bricksY + y * (brickHeight + bricksYPad)
      return [left, top, brickWidth, brickHeight]
    }

    for(let x = 0; x < brickColumnCount; x++) {
      for(let y = 0; y < brickRowCount; y++) {
        if(gameState.bricks[x][y]){
          const rect = brickRect(x, y)
          ctx.fillRect(rect[0], rect[1], rect[2], rect[3])
        }
      }
    }

    ctx.fillStyle = 'red'
    ctx.fillRect(frontPaddleX, gameState.player1.frontPaddleY - frontPaddleHeight / 2, paddleWidth, frontPaddleHeight)
    ctx.fillRect(courtWidth - frontPaddleX - paddleWidth, gameState.player1.backPaddleY - backPaddleHeight / 2, paddleWidth, frontPaddleHeight)
    ctx.fillStyle = 'blue'
    ctx.fillRect(backPaddleX, gameState.player2.frontPaddleY - frontPaddleHeight / 2, paddleWidth, backPaddleHeight)
    ctx.fillRect(courtWidth - backPaddleX - paddleWidth, gameState.player2.backPaddleY - backPaddleHeight / 2, paddleWidth, backPaddleHeight)

    ctx.fillStyle = 'gray'
    ctx.beginPath()
    ctx.arc(gameState.ball1.x, gameState.ball1.y, ballRadius(gameState.ball1.size), 0, Math.PI * 2)
    ctx.arc(gameState.ball2.x, gameState.ball2.y, ballRadius(gameState.ball2.size), 0, Math.PI * 2)
    ctx.fill()

  }


  paint()
})

