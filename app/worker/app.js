'use strict'

function add(a, b) {
  console.log(`${a} + ${b} = ${a + b}`)
  return a + b
}

function mul(a, b) {
  console.log(`${a} * ${b} = ${a + b}`)
  return a * b
}

function randomNumber() {
  return Math.floor(Math.random() * 100)
}

function main(){
  WorkerProxy({add, mul}, new Worker('worker.js')).then(api => {
    console.log('calling multiply')
    api.multiply(2, 10).then(r => console.log(`2 * 10 = ${r}`))
  })
}

// function main() {
//   WorkerProxy({add, mul}, new Worker('worker.js')).then(api => {
//
//     let count = 5
//
//     function calculate(){
//         api.calculate(randomNumber(), randomNumber(), randomNumber())
//         count--
//         if(count >= 0)
//           setTimeout(calculate, 1000)
//     }
//
//     calculate()
//   })
// }