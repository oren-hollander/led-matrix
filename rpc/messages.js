'use strict'

define([], () => {
  const MessageTypes = {
    Init: 'init',
    Batch: 'batch'
  }

  const init = (api) => ({type: MessageTypes.Init, api})
  const batch = rpcMessages => ({type: MessageTypes.Batch, rpcMessages})

  const call = (id, func, args, returnPriority) => ({id, func, args, returnPriority})
  const result = (id, value) => ({id, value})
  const error = (id, error) => ({id, error})

  const serialize = json => JSON.stringify(json)
  const deserialize = str => JSON.parse(str)

  const isCall = rpcMessage => rpcMessage.func
  const isReturn = rpcMessage => rpcMessage.value
  const isError = rpcMessage => rpcMessage.error

  return {Types: MessageTypes, init, batch, call, result, error, serialize, deserialize, isCall, isReturn, isError}
})