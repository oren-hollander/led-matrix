'use strict'

define([
  'geometry/geometry'
], (
  {Rect, Circle, Box, clamp, resizeBox, translateBox, pointInCircle, pointInBox,
    pointInRect, rectToBox, boxToRect, normalizeAngle, circleColliding, resolveCollision}
) => {

  const BallState = {
    Neutral: 0,
    Player1Front: 1,
    Player1Back: 2,
    Player2Front: 3,
    Player2Back: 4
  }

  const courtWidth = 2400
  const courtHeight = 1350

  const pad1Color = '#096A26'
  const pad2Color = '#802415'
  const brickColor = '#0F414F'

  const neutralBallColor = 'yellow'// '#D4A06'
  const player1BallColor = pad1Color
  const player2BallColor = pad2Color
  const player1BonusBallColor = '#09AA26'
  const player2BonusBallColor = '#CC2415'


  const brickColumnCount = 8
  const brickRowCount = 10
  const brickPad = 10
  const brickWidth = 50
  const brickHeight = (courtHeight - brickPad * (brickRowCount - 1)) / brickRowCount
  // const brickPad = (courtHeight - brickColumnCount * brickHeight ) / (brickColumnCount - 1)

  const backPaddleX = 20
  const frontPaddleX = 50
  const paddleWidth = 20
  const frontPaddleHeight = 200
  const backPaddleHeight = 200
  const ballRadius = 25
  const ballVelocity = 7// pixels per frame
  const paddleVelocity = 8
  const bricksX = courtWidth / 2 - 400

  function ballColor(ball) {
    switch(ball.state){
      case BallState.Neutral:
        return neutralBallColor
      case BallState.Player1Front:
      case BallState.Player1Back:
        return ball.bonus ? player1BonusBallColor : player1BallColor
      case BallState.Player2Front:
      case BallState.Player2Back:
        return ball.bonus ? player2BonusBallColor : player2BallColor
    }
  }

  const initGameState = () => {

    const bricks = new Array(brickColumnCount)
    for(let x = 0; x < brickColumnCount / 2; x++) {
      bricks[x] = new Array(brickRowCount)
      bricks[brickColumnCount - 1 - x] = new Array(brickRowCount)
      for(let y = 0; y < brickRowCount; y++) {
        const xOffset = bricksX + x * (brickWidth + brickPad)
        const yOffset = brickHeight / 2 + y * (brickHeight + brickPad)

        bricks[x][y] = {on: true, x: xOffset, y: yOffset}
        bricks[brickColumnCount - 1 - x][y] = {on: true, x: courtWidth - xOffset, y: yOffset}
      }
    }

    const player1 = {
      frontPaddleY: courtHeight / 3,
      backPaddleY: courtHeight * 2/ 3,
      frontPaddleVelocity: 0,
      backPaddleVelocity: 0,
      score: 0
    }

    const player2 = {
      frontPaddleY: courtHeight / 3,
      backPaddleY: courtHeight * 2 / 3,
      frontPaddleVelocity: 0,
      backPaddleVelocity: 0,
      score: 0
    }

    const ball1 = {
      x: bricksX - 4 * ballRadius,
      y: courtHeight / 2,
      r: ballRadius,
      velocity: ballVelocity,
      angle: 0.2 * Math.PI,
      state: BallState.Neutral,
      bonus: false
    }

    const ball2 = {
      x: courtWidth - ball1.x,
      y: courtHeight / 2,
      r: ballRadius,
      velocity: ballVelocity,
      angle: 0.1 * Math.PI,
      state: BallState.Neutral,
      bonus: false
    }

    return {
      bricks, player1, player2, ball1, ball2
    }
  }

  const gameState = initGameState()

  const limit = pad => (value, min, max) => clamp(value, min + pad, max - pad)

  function moveBall(ball) {
    const dy = Math.sin(ball.angle) * ball.velocity
    const dx = Math.cos(ball.angle) * ball.velocity

    ball.y += dy
    ball.x += dx
  }

  function detectWallCollision(ball) {
    ball.angle = normalizeAngle(ball.angle)
    if(ball.x < ball.r){
      if(ball.angle >= 0.5 * Math.PI || ball.angle <= -0.5 * Math.PI){
        ball.angle = Math.PI - ball.angle
        ball.state = BallState.Neutral
        ball.bonus = false
      }
    }

    if(ball.x > courtWidth - ball.r){
      if(ball.angle <= 0.5 * Math.PI || ball.angle >= -0.5 * Math.PI){
        ball.angle = Math.PI - ball.angle
        ball.state = BallState.Neutral
        ball.bonus = false
      }
    }

    if(ball.y < ball.r){
      if(ball.angle <= 0){
        ball.angle = -ball.angle
      }
    }

    if(ball.y > courtHeight - ball.r){
      if (ball.angle >= 0){
        ball.angle = -ball.angle
      }
    }
  }

  function detectBallsCollision(ball1, ball2){
    const distance = Math.sqrt((ball1.x - ball2.x) ** 2 + (ball1.y - ball2.y) ** 2)

    if(distance < ball1.r + ball2.r){
      // calculate angles
      const x1 = ball1.x
      const y1 = ball1.y
      const x2 = ball2.x
      const y2 = ball2.y
      const u1 = ball1.velocity
      const u2 = ball2.velocity
      const d1 = ball1.angle
      const d2 = ball2.angle

      const a = Math.atan2(y1 - y2, x1 - x2)

      const v1x = u1 * Math.cos(d1 - a)
      const v1y = u1 * Math.sin(d1 - a)
      const v2x = u2 * Math.cos(d2 - a)
      const v2y = u2 * Math.sin(d2 - a)

      const m1 = ball1.r
      const m2 = ball2.r

      const f1x = (v1x * (m1 - m2) + 2 * m2 * v2x) / (m1 + m2)
      const f2x = (v2x * (m1 - m2) + 2 * m2 * v1x) / (m1 + m2)

      const a1 = Math.atan2(v1y, f1x) + a
      const a2 = Math.atan2(v2y, f2x) + a

      ball1.angle = a1
      ball2.angle = a2
    }
  }

  function score(state){
    switch (state){
      case BallState.Neutral:
        break
      case BallState.Player1Front:
      case BallState.Player1Back:
        gameState.player1.score++
        break
      case BallState.Player2Front:
      case BallState.Player2Back:
        gameState.player2.score++
        break
    }
  }

  function detectBallPillCollision(ball, pill, keepAngles = false) {
    const body = Box(pill.x, pill.y, pill.hw, pill.hh - pill.hw)

    const left = Box(body.x - body.hw, body.y, ball.r, body.hh)
    const right = Box(body.x + body.hw, body.y, ball.r, body.hh)

    if (pointInBox(ball, left) || pointInBox(ball, right)) {
      if(!keepAngles)
        ball.angle = normalizeAngle(Math.PI - ball.angle)
      return true
    }

    const top = Circle(pill.x, pill.y - pill.hh + pill.hw, pill.hw)
    const bottom = Circle(pill.x, pill.y + pill.hh - pill.hw, pill.hw)
    top.angle = 0
    top.velocity = 0
    bottom.angle = 0
    bottom.velocity = 0

    if(circleColliding(ball, top)){
      if(!keepAngles)
        resolveCollision(ball, top)
      return true
    }

    if(circleColliding(ball, bottom)){
      if(!keepAngles)
        resolveCollision(ball, bottom)
      return true
    }

    return false
  }

  function detectBricksCollision(ball){
    for (let x = 0; x < brickColumnCount; x++){
      for (let y = 0; y < brickRowCount; y++) {
        const brick = gameState.bricks[x][y]
        const brickBox = Box(brick.x, brick.y, brickWidth / 2, brickHeight / 2)
        if(brick.on && detectBallPillCollision(ball, brickBox, ball.bonus)){
          score(ball.state)
          brick.on = false
        }
      }
    }
  }

  const player1FrontPaddleBox = () =>
    Box(frontPaddleX, gameState.player1.frontPaddleY, paddleWidth / 2, frontPaddleHeight / 2)

  const player1BackPaddleBox = () =>
    Box(courtWidth - backPaddleX, gameState.player1.backPaddleY, paddleWidth / 2, backPaddleHeight / 2)

  const player2FrontPaddleBox = () =>
    Box(courtWidth - frontPaddleX, gameState.player2.frontPaddleY, paddleWidth / 2, frontPaddleHeight / 2)

  const player2BackPaddleBox = () =>
    Box(backPaddleX, gameState.player2.backPaddleY, paddleWidth / 2, backPaddleHeight / 2)

  // function setBallOwnership(ball, newState){
  //   if(ball.state === newState){
  //   }
  //   else {
  //     ball.state = owner
  //   }
  // }

  function detectPaddleCollision(ball){
    if(detectBallPillCollision(ball, player1FrontPaddleBox())){
      ball.bonus = ball.state === BallState.Player1Back
      ball.state = BallState.Player1Front
    }

    if(detectBallPillCollision(ball, player1BackPaddleBox())){
      ball.bonus = ball.state === BallState.Player1Back || ball.state === BallState.Player1Front
      ball.state = BallState.Player1Back
    }

    if(detectBallPillCollision(ball, player2FrontPaddleBox())){
      ball.bonus = ball.state === BallState.Player2Back
      ball.state = BallState.Player2Front
    }

    if(detectBallPillCollision(ball, player2BackPaddleBox())){
      ball.bonus = ball.state === BallState.Player2Back || ball.state === BallState.Player2Front
      ball.state = BallState.Player2Back
    }
  }

  function detectCollision() {
    detectWallCollision(gameState.ball1)
    detectWallCollision(gameState.ball2)
    detectBricksCollision(gameState.ball1)
    detectBricksCollision(gameState.ball2)
    detectBallsCollision(gameState.ball1, gameState.ball2)
    detectPaddleCollision(gameState.ball1)
    detectPaddleCollision(gameState.ball2)
  }

  function moveBalls() {
    moveBall(gameState.ball1)
    moveBall(gameState.ball2)
  }

  const limitFrontPad = limit(frontPaddleHeight / 2)
  const limitBackPad = limit(backPaddleHeight / 2)

  function movePaddles(){
    gameState.player1.frontPaddleY = limitFrontPad(gameState.player1.frontPaddleY + gameState.player1.frontPaddleVelocity, 0, courtHeight)
    gameState.player1.backPaddleY = limitBackPad(gameState.player1.backPaddleY + gameState.player1.backPaddleVelocity, 0, courtHeight)
    gameState.player2.frontPaddleY = limitFrontPad(gameState.player2.frontPaddleY + gameState.player2.frontPaddleVelocity, 0, courtHeight)
    gameState.player2.backPaddleY = limitBackPad(gameState.player2.backPaddleY + gameState.player2.backPaddleVelocity, 0, courtHeight)
  }

  let station

  function paintPill(x, y, w, h) {
    const hh = h / 2
    const hw = w / 2
    station.box(Box(x, y, hw, hh - hw))
    station.circle(Circle(x, y - hh + hw, hw))
    station.circle(Circle(x, y + hh - hw, hw))
  }

  function gameOver() {
    for (let x = 0; x < brickColumnCount; x++) {
      for (let y = 0; y < brickRowCount; y++) {
        if(gameState.bricks[x][y].on)
          return false

      }
    }
    return true
  }

  const paint = () => {
    movePaddles()
    moveBalls()
    detectCollision()

    station.color('#E3F5FB')
    station.rect(0, 0, courtWidth, courtHeight)

    station.color(brickColor)
    for(let x = 0; x < brickColumnCount; x++) {
      for(let y = 0; y < brickRowCount; y++) {
        const brick = gameState.bricks[x][y]
        if(brick.on){
          paintPill(brick.x, brick.y, brickWidth, brickHeight)
        }
      }
    }

    station.color(pad1Color)
    paintPill(frontPaddleX, gameState.player1.frontPaddleY, paddleWidth, frontPaddleHeight)
    paintPill(courtWidth - backPaddleX, gameState.player1.backPaddleY, paddleWidth, backPaddleHeight)

    station.color(pad2Color)
    paintPill(courtWidth - frontPaddleX, gameState.player2.frontPaddleY, paddleWidth, frontPaddleHeight)
    paintPill(backPaddleX, gameState.player2.backPaddleY, paddleWidth, backPaddleHeight)

    // balls
    station.color(ballColor(gameState.ball1))
    station.circle(Circle(gameState.ball1.x, gameState.ball1.y, gameState.ball1.r))

    station.color(ballColor(gameState.ball2))
    station.circle(Circle(gameState.ball2.x, gameState.ball2.y, gameState.ball2.r))

    // score
    station.color(player1BallColor)
    station.text(gameState.player1.score, 3 * courtWidth / 4, 100)
    station.color(player2BallColor)
    station.text(gameState.player2.score, courtWidth / 4, 100)
    if(gameOver()){

    }
    else {
      setTimeout(paint, 1000 / 60)
    }
  }

  function start(stationApi) {
    station = stationApi
    paint()
  }

  function frontPad1UpPressed(){
    gameState.player1.frontPaddleVelocity = -paddleVelocity
  }

  function frontPad1DownPressed(){
    gameState.player1.frontPaddleVelocity = paddleVelocity
  }

  function backPad1UpPressed(){
    gameState.player1.backPaddleVelocity = -paddleVelocity
  }

  function backPad1DownPressed(){
    gameState.player1.backPaddleVelocity = paddleVelocity
  }

  function frontPad2UpPressed(){
    gameState.player2.frontPaddleVelocity = -paddleVelocity
  }

  function frontPad2DownPressed(){
    gameState.player2.frontPaddleVelocity = paddleVelocity
  }

  function backPad2UpPressed(){
    gameState.player2.backPaddleVelocity = -paddleVelocity
  }

  function backPad2DownPressed(){
    gameState.player2.backPaddleVelocity = paddleVelocity
  }

  function frontPad1UpReleased(){
    gameState.player1.frontPaddleVelocity = 0
  }

  function frontPad1DownReleased(){
    gameState.player1.frontPaddleVelocity = 0
  }

  function backPad1UpReleased(){
    gameState.player1.backPaddleVelocity = 0
  }

  function backPad1DownReleased(){
    gameState.player1.backPaddleVelocity = 0
  }

  function frontPad2UpReleased(){
    gameState.player2.frontPaddleVelocity = 0
  }

  function frontPad2DownReleased(){
    gameState.player2.frontPaddleVelocity = 0
  }

  function backPad2UpReleased(){
    gameState.player2.backPaddleVelocity = 0
  }

  function backPad2DownReleased(){
    gameState.player2.backPaddleVelocity = 0
  }

  return {
    start,
    frontPad1UpPressed,
    frontPad1DownPressed,
    backPad1UpPressed,
    backPad1DownPressed,
    frontPad2UpPressed,
    frontPad2DownPressed,
    backPad2UpPressed,
    backPad2DownPressed,
    frontPad1UpReleased,
    frontPad1DownReleased,
    backPad1UpReleased,
    backPad1DownReleased,
    frontPad2UpReleased,
    frontPad2DownReleased,
    backPad2UpReleased,
    backPad2DownReleased
  }
})