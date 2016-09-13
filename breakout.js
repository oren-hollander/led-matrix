'use strict'

function main() {

  const width = 60
  const paddleWidth = 5
  const brickRows = 8
  const brickCols = 15
  const brickWidth = 4
  const paddleY = 38
  let paddle
  const bricks = []
  const ball = {}
  const angle = {}
  let lost
  let won
  let pause
  let autoPilot
  let speed
  const matrix = LedMatrix(width, 40, 8, 2)

  document.body.addEventListener('keydown', e => {
    if((lost || won) && e.keyCode === 32) {
      init()
      return
    }

    if(e.keyCode === 32)
      pause = !pause

    if(!pause) {
      if (e.keyCode === 65)
        autoPilot = !autoPilot

      if(!autoPilot){
        if (e.keyCode === 39)
          right()

        if (e.keyCode === 37)
          left()
      }
    }
  })

  function init() {
    lost = false
    won = false
    pause = true
    autoPilot = false
    angle.x = 1
    angle.y = 1
    paddle = width / 2
    ball.x =  width / 2
    ball.y =  17
    speed = 100

    for(let y = 0; y < brickRows; y++) {
      bricks[y] = []
      for(let x = 0; x < brickCols; x++){
        bricks[y][x] = true
      }
    }
  }

  function brickBounds(x, y) {
    return {left: x * brickWidth, right: (x + 1) * brickWidth - 1, y: y + 5}
  }

  function drawBrick(x, y) {
    const {left, right, y: brickY} = brickBounds(x, y)
    matrix.line(left, brickY, right, brickY, bricks[y][x])
  }

  function drawBricks() {
    for (let x = 0; x < brickCols; x++)
      for (let y = 0; y < brickRows; y++)
        drawBrick(x, y)
  }

  function drawPaddle() {
    matrix.line(paddle - Math.floor(paddleWidth / 2), paddleY, paddle + Math.floor(paddleWidth / 2), paddleY)
  }

  function drawBall() {
    matrix.line(ball.x, ball.y, ball.x, ball.y)
  }

  const ballNextPosition = () => ({x: ball.x + angle.x, y: ball.y + angle.y})

  function detectBrickHit() {
    for (let x = 0; x < brickCols; x++) {
      for (let y = 0; y < brickRows; y++) {
        if (bricks[y][x]) {
          const {left, right, y: brickY} = brickBounds(x, y)

          const np = ballNextPosition()
          if (np.x >= left && np.x <= right && np.y === brickY){
            bricks[y][x] = false
            angle.y = -angle.y
          }
        }
      }
    }
  }

  function detectPaddleHit() {
    if(ball.y === paddleY - 1 && ball.x >= paddle - 2 && ball.x <= paddle + 2){
      angle.y = -angle.y
    }
  }

  function detectWallHit(){
    if(ball.x == width - 1 || ball.x == 0)
      angle.x = -angle.x
    if(ball.y == 0)
      angle.y = -angle.y
  }

  function detectLosing() {
    lost = ball.y > paddleY
  }

  function detectWinning() {
    let win = true
    for (let x = 0; x < brickCols; x++)
      for (let y = 0; y < brickRows; y++)
        win = win && !bricks[y][x]

    won = win
  }

  function moveBall() {
    if(!pause){
      ball.x += angle.x
      ball.y += angle.y
    }
  }

  function draw(){
    drawBricks()
    drawPaddle()
    drawBall()
  }

  function left(x = 1) {
    if(paddle - paddleWidth / 2 >= 0)
      paddle -= x
  }

  function right(x = 1) {
    if(paddle + paddleWidth / 2 < width - 1)
      paddle += x
  }

  function updatePaddle() {
    if(ball.x > paddle)
      right(ball.x - paddle)
    if(ball.x < paddle)
      left(paddle - ball.x)
  }

  function update(){
    if(lost){
      matrix.clear()
      matrix.text("Loser!")
    }
    else if(won){
      matrix.clear()
      matrix.text("Winner!")
    }
    else {
      matrix.clear()
      draw()
      moveBall()
      detectPaddleHit()
      detectWallHit()
      detectBrickHit()
      if(autoPilot)
        updatePaddle()
      detectWinning()
      detectLosing()
    }

    window.setTimeout(update, speed)
  }

  window.setInterval(() => {
    if(!pause && speed > 0)
      speed -= 1
  }, 1000)

  init()
  update()
}
