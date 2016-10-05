'use strict'

// const host = '127.0.0.1'
const host = '10.0.0.6'
const serverConnection = new WebSocket(`wss://${host}:8000`)

serverConnection.onmessage = gotMessageFromServer

let count = 1

serverConnection.onopen = () => {
  console.log('connected')
}

function buttonMouseDown() {
  serverConnection.send('hello')
}

function gotMessageFromServer(message) {
  console.log('received', message.data, count++)
}

function startup() {
  var el = document.getElementsByTagName("canvas")[0];
  el.addEventListener("touchstart", handleStart, false);
  // el.addEventListener("touchend", handleEnd, false);
  // el.addEventListener("touchcancel", handleCancel, false);
  // el.addEventListener("touchmove", handleMove, false);
}

function handleStart(evt) {
  evt.preventDefault();
  serverConnection.send('touch' + (count++))

}