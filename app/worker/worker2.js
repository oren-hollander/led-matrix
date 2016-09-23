'use strict'

importScripts('proxy.js')

const mul = proxy('mul')

setInterval(() => {mul(2, 3).then(r => mul(r, 4)).then(r => console.log(r))}, 400)

