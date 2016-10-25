'use strict'

requirejs.config({
  baseUrl: 'src',
  paths: {
    lodash: ['lib/lodash']
  }
})

require([
  'lodash',
  'canvas/canvas',
  'canvas/screens',
  'util/promise',
  'canvas/view',
  'geometry/geometry',
  'game-platform/colors'
], (
  _,
  {Canvas, setCanvasSize},
  Screens,
  {createPromise},
  View,
  {Circle, Rect, Point, Box, Line, pointInCircle, pointInRect, boxToRect, circleToBox},
  Colors
) => {

  const Grid = (xs, ys, w, h) => (x, y) => Point(x / xs * w, y / ys * h)

  function Hand(table) {
    const log = []
    return {
      action: (player, action) => {
        log.push({player, action})
      },
      log: () => ({table, log})
    }
  }

  function Table() {
    let button = 0
    let seats = []

    function verify(seat) {
      if(seat < 0 || seat > 9)
        throw new Error(`seat ${seat} out of index`)
      else
        return seat
    }

    return {
      setPlayer: (seat, initials, sitOut) => {
        if(_.includes(seats, initials)){
          throw new Error(`Player ${initials} already exists`)
        }
        seats[verify(seat)] = {initials, sitOut}
      },
      getPlayer: seat => seats[verify(seat)],
      removePlayer: seat => {
        seats[verify(seat)] = undefined
      },
      setButton: seat => {
        button = verify(seat)
      },
      getButton: () => button,
      log: () => ({button, seats})
    }
  }

  function LogHand() {
    const FOLD = 0
    const CALL = 1
    const RAISE = 2

    let ctx, width, height
    let promise

    let players
    const actions = []
    let redoStack = []

    let activeSeat
    let activeAction = CALL

    const actionLabel = action => {
      switch (action){
        case FOLD:
          return 'F'
        case CALL:
          return 'C'
        case RAISE:
          return 'R'
      }
    }

    function toggleActiveAction(){
      switch (activeAction){
        case FOLD:
          activeAction = CALL
          break
        case CALL:
          activeAction = RAISE
          break
        case RAISE:
          activeAction = FOLD
          break
      }
    }

    function foldPlayers(fromSeat, toSeat){
      let seats
      if(fromSeat < toSeat)
        seats = _.range(fromSeat, toSeat)
      else
        seats = _.concat(_.range(fromSeat, players.length), _.range(0, toSeat))

      _.forEach(seats, seat => {
        actions.push({seat, action: FOLD})
      })
      redoStack = []
    }

    function clickSeat(seat){
      if(seat === activeSeat) {
        toggleActiveAction()
      }
      else {
        actions.push({seat: activeSeat, action: activeAction})
        redoStack = []
        foldPlayers(activeSeat + 1, seat)

        activeSeat = seat
        toggleActiveAction()
      }
    }

    function undo(){
      if(actions.length > 0)
        redoStack.push(actions.pop())
    }

    function redo(){
      if(redoStack.length > 0)
        actions.push(redoStack.pop())
    }

    function mouseUp(x, y){
      const p = Point(x, y)
      if(pointInRect(p, stopRect)){
        promise.resolve('log')
      }
      else if(pointInCircle(p, cancelCircle)) {
        promise.reject()
      }
      else if(pointInCircle(p, undoCircle)) {
        undo()
      }
      else if(pointInCircle(p, redoCircle)) {
        redo()
      }
      else {
        const seat =_.findIndex(seats, _.partial(pointInCircle, p))
        if(seat >= 0)
          clickSeat(seat)
      }
    }

    let seats
    let stopBox, stopRect
    let table
    let undoCircle
    let redoCircle
    let cancelCircle

    function show(context, w, h, t){
      table = t
      players = _(_.range((table.getButton() + 1) % 10, 10))
        .concat(_.range(0, (table.getButton() + 1) % 10))
        .map(seat => _.assign({seat}, table.getPlayer(seat)))
        .reject(p => !p.initials)
        .reject('sitOut')
        .map(p => _.pick(p, ['seat', 'initials']))
        .value()

      activeSeat = 3

      width = w
      height = h
      ctx = context
      promise = createPromise()

      const grid = Grid(8, 10, width, height)
      const seatCircle = p => Circle(p.x, p.y, 50)

      seats = [
        seatCircle(grid(3, 1)),
        seatCircle(grid(5, 1)),
        seatCircle(grid(7, 3)),
        seatCircle(grid(7, 5)),
        seatCircle(grid(7, 7)),
        seatCircle(grid(5, 9)),
        seatCircle(grid(3, 9)),
        seatCircle(grid(1, 7)),
        seatCircle(grid(1, 5)),
        seatCircle(grid(1, 3))
      ]

      stopBox = Box(width / 2, height / 2, width / 7, width / 7)
      stopRect = boxToRect(stopBox)

      undoCircle = Circle(stopRect.x, stopRect.y + stopRect.h * 1.5, stopRect.h / 4)
      redoCircle = Circle(stopRect.x + stopRect.w, stopRect.y + stopRect.h * 1.5, stopRect.h / 4)
      cancelCircle = Circle(stopRect.x + stopRect.w / 2, stopRect.y - stopRect.h * 0.5, stopRect.h / 4)
      return promise
    }

    function paint(){

      const view = View(ctx)
      ctx.fillStyle = Colors.secondary2[2]
      view.fillRect(Rect(0, 0, width, height))

      _.forEach(seats, (seatCircle, seat) => {
        const player = table.getPlayer(seat)

        const actionsRect = boxToRect(circleToBox(seatCircle))
        actionsRect.y += actionsRect.h * 1.05
        actionsRect.h = actionsRect.h / 2

        ctx.fillStyle = Colors.secondary2[1]
        view.fillRect(actionsRect)

        if(seat === activeSeat){
          ctx.fillStyle = Colors.secondary2[1]
          view.fillCircle(Circle(seatCircle.x, seatCircle.y, seatCircle.r + 25))
          ctx.fillStyle = Colors.primary[4]
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.font = '32px sans-serif'
          ctx.fillText(actionLabel(activeAction), actionsRect.x + actionsRect.w / 2, actionsRect.y + actionsRect.h / 2)
          // ctx.fillText(actionLabel(activeAction), actionsRect.x, actionsRect.y)
        }

        if(seat === table.getButton()){
          ctx.fillStyle = Colors.secondary1[1]
          view.fillCircle(Circle(seatCircle.x, seatCircle.y, seatCircle.r + 15))
        }


        if(player){
          ctx.fillStyle = Colors.primary[4]
          view.fillCircle(seatCircle)
          ctx.fillStyle = Colors.primary[2]
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.font = '48px sans-serif'
          view.text(player.initials, seatCircle.x, seatCircle.y)
        }
        else {
          ctx.fillStyle = Colors.primary[1]
          view.fillCircle(seatCircle)
        }
      })

      ctx.fillStyle = Colors.secondary2[4]
      view.fillRect(stopRect)

      ctx.fillStyle = Colors.secondary2[0]
      view.fillRect(boxToRect(Box(stopBox.x, stopBox.y, stopBox.hw * 0.7, stopBox.hh * 0.7)))

      ctx.fillStyle = Colors.secondary2[4]
      view.fillCircle(undoCircle)
      view.fillCircle(redoCircle)
      view.fillCircle(cancelCircle)

      ctx.fillStyle = Colors.secondary2[2]
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'
      view.text('U', undoCircle.x, undoCircle.y)
      view.text('R', redoCircle.x, redoCircle.y)
      view.text('C', cancelCircle.x, cancelCircle.y)

    }

    return {show, paint, mouseUp}
  }

  function EditTable(screens) {

    let ctx, width, height
    let promise

    const table = Table()
    table.setPlayer(0, 'AA', false)
    table.setPlayer(1, 'BB', true)
    // table.setPlayer(2, 'CC', false)
    table.setPlayer(3, 'DD', false)
    table.setPlayer(4, 'EE', false)
    // table.setPlayer(5, 'FF', false)
    // table.setPlayer(6, 'GG', false)
    table.setPlayer(7, 'HH', false)
    // table.setPlayer(8, 'II', false)
    table.setPlayer(9, 'JJ', false)

    function clickSeat(seat, longClick){
      if(longClick){
        const player = table.getPlayer(seat)
        screens.show('editPlayer', _.get(player, 'initials'), _.get(player, 'sitOut'))
          .then(({initials, sitOut}) => {
            table.setPlayer(seat, initials, sitOut)
          })
          .catch(() => {})
      }
      else {
        table.setButton(seat)
      }
    }

    let seats
    let startBox, startRect

    function show(context, w, h) {
      width = w
      height = h
      ctx = context
      promise = createPromise()
      const grid = Grid(8, 10, width, height)
      const seatCircle = p => Circle(p.x, p.y, 50)

      seats = [
        seatCircle(grid(3, 1)),
        seatCircle(grid(5, 1)),
        seatCircle(grid(7, 3)),
        seatCircle(grid(7, 5)),
        seatCircle(grid(7, 7)),
        seatCircle(grid(5, 9)),
        seatCircle(grid(3, 9)),
        seatCircle(grid(1, 7)),
        seatCircle(grid(1, 5)),
        seatCircle(grid(1, 3))
      ]

      startBox = Box(width / 2, height / 2, width / 7, width / 7)
      startRect = boxToRect(startBox)
      return promise
    }

    let lastDown

    function mouseDown(x, y) {
      const seat =_.findIndex(seats, _.partial(pointInCircle, Point(x, y)))
      if(seat >= 0){
        lastDown = {seat, time: Date.now()}
      }
      else {
        lastDown = undefined
      }
    }

    function mouseUp(x, y) {
      if(pointInRect(Point(x, y), startRect)){
          screens.show('logHand', table)
            .then(log => {
              table.setButton((table.getButton() + 1) % 10)
            })
            .catch(() => {})
      }

      if(lastDown){
        const longPress = Date.now() - lastDown.time > 500
        const seat =_.findIndex(seats, _.partial(pointInCircle, Point(x, y)))
        if(seat === lastDown.seat)
          clickSeat(seat, longPress)
      }
    }

    function paint() {
      const view = View(ctx)
      ctx.fillStyle = Colors.primary[2]
      view.fillRect(Rect(0, 0, width, height))

      _.forEach(seats, (seatCircle, seat) => {
        const player = table.getPlayer(seat)
        if(seat === table.getButton()){
          ctx.fillStyle = Colors.primary[3]
          view.fillCircle(Circle(seatCircle.x, seatCircle.y, seatCircle.r + 15))
        }

        if(player){
          ctx.fillStyle = player.sitOut ? Colors.secondary2[2] : Colors.primary[4]
          view.fillCircle(seatCircle)
          ctx.fillStyle = player.sitOut ? Colors.secondary2[0] : Colors.primary[2]
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.font = '48px sans-serif'
          view.text(player.initials, seatCircle.x, seatCircle.y)
        }
        else {
          ctx.fillStyle = Colors.primary[1]
          view.fillCircle(seatCircle)
        }
      })

      ctx.fillStyle = Colors.secondary2[4]
      view.fillRect(startRect)

      const startInnerRect = boxToRect(Box(startBox.x, startBox.y, startBox.hw * 0.7, startBox.hh * 0.7))
      ctx.fillStyle = Colors.secondary2[0]

      ctx.beginPath()
      ctx.moveTo(startInnerRect.x, startInnerRect.y)
      ctx.lineTo(startInnerRect.x + startInnerRect.w, startInnerRect.y + startInnerRect.h / 2)
      ctx.lineTo(startInnerRect.x, startInnerRect.y + startInnerRect.h)
      ctx.closePath()
      ctx.fill()
    }

    return {mouseDown, mouseUp, paint, show}
  }

  function EditPlayer(){
    let ctx, width, height
    let promise
    let state

    function toggleSitOut(){
      state.sitOut = !state.sitOut
    }

    function letter(l) {
      if(state.initials.length < 2)
        state.initials.push(l)
    }

    function back() {
      if(state.initials.length > 0)
        state.initials.pop()
    }

    function cancel() {
      promise.reject()
    }

    function enter() {
      if(state.initials.length === 2){
        promise.resolve({initials: state.initials.join(''), sitOut: state.sitOut})
      }
      else if(state.initials.length === 0){
        promise.resolve({initials: undefined, sitPut: false})
      }
    }

    function mouseUp(x, y){
      const key =_.findIndex(keyCircles, _.partial(pointInCircle, Point(x, y)))

      if(key >= 0 && key < 26) {
        letter(keys[key])
      }
      else if (key === 26){
        back()
      }
      else if (key === 27){
        cancel()
      }
      else if (key === 28){
        enter()
      }
      else if(pointInRect(Point(x, y), sitOutRect)){
        toggleSitOut()
      }
    }

    const keys = 'QWERTYUIOPASDFGHJKLZXCVBNM' + String.fromCharCode(8592) + String.fromCharCode(10006) + String.fromCharCode(8629)
    let keyCircles
    let sitOutRect

    function show(context, w, h, initials, sitOut) {
      state = {initials: _.map(initials), sitOut}
      width = w
      height = h
      ctx = context

      const grid1 = Grid(20, 30, width, height)
      const keyCircle = p => Circle(p.x, p.y, 30)
      const offset = (p, x) => Point(p.x + x, p.y)

      keyCircles = [
        keyCircle(grid1(1, 22)),
        keyCircle(grid1(3, 22)),
        keyCircle(grid1(5, 22)),
        keyCircle(grid1(7, 22)),
        keyCircle(grid1(9, 22)),
        keyCircle(grid1(11, 22)),
        keyCircle(grid1(13, 22)),
        keyCircle(grid1(15, 22)),
        keyCircle(grid1(17, 22)),
        keyCircle(grid1(19, 22)),

        keyCircle(offset(grid1(1,  24), 10)),
        keyCircle(offset(grid1(3,  24), 10)),
        keyCircle(offset(grid1(5,  24), 10)),
        keyCircle(offset(grid1(7,  24), 10)),
        keyCircle(offset(grid1(9,  24), 10)),
        keyCircle(offset(grid1(11, 24), 10)),
        keyCircle(offset(grid1(13, 24), 10)),
        keyCircle(offset(grid1(15, 24), 10)),
        keyCircle(offset(grid1(17, 24), 10)),

        keyCircle(offset(grid1(1,  26), 30)),
        keyCircle(offset(grid1(3,  26), 30)),
        keyCircle(offset(grid1(5,  26), 30)),
        keyCircle(offset(grid1(7,  26), 30)),
        keyCircle(offset(grid1(9,  26), 30)),
        keyCircle(offset(grid1(11, 26), 30)),
        keyCircle(offset(grid1(13, 26), 30)),

        keyCircle(grid1(3, 28)),
        keyCircle(grid1(10, 28)),
        keyCircle(grid1(17, 28))
      ]

      sitOutRect = Rect(width / 10, width / 10, width / 5, width / 10)
      promise = createPromise()
      return promise
    }

    function paint(){
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '48px sans-serif'

      const view = View(ctx)
      ctx.fillStyle = Colors.complement[0]
      ctx.fillRect(0, 0, width, height)
      keyCircles.forEach((circle, key) => {
        const keyChar = keys.charAt(key)
        ctx.fillStyle = Colors.complement[4]
        view.fillCircle(circle)
        ctx.fillStyle = Colors.complement[2]
        view.text(keyChar, circle.x, circle.y)
      })

      ctx.fillStyle = Colors.complement[2]
      view.fillRect(Rect(width / 9, height / 3, width / 3, width / 3))
      view.fillRect(Rect(width * 5 / 9, height / 3, width / 3, width / 3))
      ctx.fillStyle = Colors.complement[4]
      ctx.font = (width / 3) + 'px sans-serif'

      if(state.initials.length > 0){
        view.text(state.initials[0], width * 2.5 / 9, height / 3 + width / 9 * 1.5)
      }
      if(state.initials.length > 1){
        view.text(state.initials[1], width * 6.5 / 9, height / 3 + width / 9 * 1.5)
      }

      const sitOutColor = state.sitOut ? Colors.complement[4] : Colors.complement[1]

      ctx.fillStyle = sitOutColor
      view.fillRect(sitOutRect)
      ctx.fillStyle = Colors.complement[2]
      ctx.font = '48px sans-serif'
      view.text('Sit out', sitOutRect.x + sitOutRect.w / 2, sitOutRect.y + sitOutRect.h / 2)
    }

    return {paint, show, mouseUp}

  }

  const canvas = Canvas()
  setCanvasSize(canvas, 400, 600)

  const screens = Screens(canvas, {editTable: EditTable, editPlayer: EditPlayer, logHand: LogHand})

  screens.show('editTable')
})

