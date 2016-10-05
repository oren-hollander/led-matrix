'use strict'

importScripts('/src/lib/require.js')

requirejs.config({
  baseUrl: '/src',
  paths: {
    'lodash': ['lib/lodash']
  }
});

require([
  'lodash',
  'rpc/message-rpc',
  'rpc/remote',
  'rpc/messenger',
  'rpc/priority',
  'breakout/game'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerMessenger},
  {setPriority, MessagePriorities},
  Game
) => {

  let station
  let player1Pad
  let player2Pad

  const stationPad1Api = {
    buttonPressed: (buttonName) => {
      switch(buttonName){
        case 'front-up':
          Game.frontPad1UpPressed()
          break
        case 'front-down':
          Game.frontPad1DownPressed()
          break
        case 'back-up':
          Game.backPad1UpPressed()
          break
        case 'back-down':
          Game.backPad1DownPressed()
          break
      }
    },
    buttonReleased: (buttonName) => {
      switch(buttonName){
        case 'front-up':
          Game.frontPad1UpReleased()
          break
        case 'front-down':
          Game.frontPad1DownReleased()
          break
        case 'back-up':
          Game.backPad1UpReleased()
          break
        case 'back-down':
          Game.backPad1DownReleased()
          break
      }
    }
  }

  const stationPad2Api = {
    buttonPressed: (buttonName) => {
      switch(buttonName) {
        case 'front-up':
          Game.frontPad2UpPressed()
          break
        case 'front-down':
          Game.frontPad2DownPressed()
          break
        case 'back-up':
          Game.backPad2UpPressed()
          break
        case 'back-down':
          Game.backPad2DownPressed()
          break
      }    },
    buttonReleased: (buttonName) => {
      switch(buttonName) {
        case 'front-up':
          Game.frontPad2UpReleased()
          break
        case 'front-down':
          Game.frontPad2DownReleased()
          break
        case 'back-up':
          Game.backPad2UpReleased()
          break
        case 'back-down':
          Game.backPad2DownReleased()
          break
      }
    }
  }

  const breakout = {
    onReady: () => {
      Game.start(station)
    },
    connectPad: pad => {
      if(!player1Pad) {
        player1Pad = pad
        pad.createButton('front-up',   0.25, 0.25, 0.1, '#2F7083')
        pad.createButton('front-down', 0.25, 0.75, 0.1, '#349C53')
        pad.createButton('back-up',    0.75, 0.25, 0.1, '#D35A47')
        pad.createButton('back-down',  0.75, 0.75, 0.1, '#D38E47')
        return RemoteApi(stationPad1Api)
      }
      else if(!player2Pad){
        player2Pad = pad
        pad.createButton('front-up',   0.75, 0.25, 0.1, '#2F7083')
        pad.createButton('front-down', 0.75, 0.75, 0.1, '#349C53')
        pad.createButton('back-up',    0.25, 0.25, 0.1, '#D35A47')
        pad.createButton('back-down',  0.25, 0.75, 0.1, '#D38E47')
        return RemoteApi(stationPad2Api)
      }
      else {
        return false
      }
    }
  }

  MessageRPC(RemoteApi(breakout), WebWorkerMessenger(self)).then(({api}) => {
    // station = setPriority(api, MessagePriorities.High, MessagePriorities.None)
    station = setPriority(api, MessagePriorities.High)
  })
})