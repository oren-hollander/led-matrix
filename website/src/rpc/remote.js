'use strict'

define([
  'lodash',
  'rpc/api-util',
  'util/promise'
], (
  _,
  {ApiSymbol, FunctionSymbol},
  {promisifyApi, promisifyFunction}
) => {
  const RemoteApi = api => Object.assign(promisifyApi(api), {[ApiSymbol]: true})
  const RemoteFunction = f => Object.assign(promisifyFunction(f), {[FunctionSymbol]: true})

  return {RemoteApi, RemoteFunction}
})