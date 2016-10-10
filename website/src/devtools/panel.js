'use strict'

const logDiv = document.createElement('div')
document.body.appendChild(logDiv)
logDiv.appendChild(document.createTextNode('No log'))

let logIsEmpty = true

function clearLog() {
  while(logDiv.firstChild){
    logDiv.removeChild(logDiv.firstChild)
  }
}

setInterval(() => {

  chrome.devtools.inspectedWindow.eval('const log = window.__RPC_DEVTOOLS_LOG__; window.__RPC_DEVTOOLS_LOG__ = []; log', log => {

    if(log.length > 0){
      if(logIsEmpty){
        clearLog()
        logIsEmpty = false
      }

      log.forEach(entry => {
        const lineDiv = document.createElement('div')
        lineDiv.appendChild(document.createTextNode(entry))
        logDiv.appendChild(lineDiv)
      })
    }

  })
}, 1000)

