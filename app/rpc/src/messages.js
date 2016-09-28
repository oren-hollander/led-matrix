'use strict'

define(['priority', 'config'], ({MessagePriorities}, {debug}) => {
  const MessageTypes = {
    Init: 'init',
    Batch: 'batch',

    ApiCall: 'api-call',
    FunctionCall: 'function-call',
    Return: 'return',
    Error: 'error',
    StubPropertyUpdate: 'stub-prop-update',
    ProxyPropertyUpdate: 'proxy-prop-update',

    Value: 'value',
    Api: 'api',
    Function: 'function',
    SharedObject: 'shared-object'
  }

  const rpcMessage = (type, args) => {
    if(debug)
      return Object.assign({type}, {ts: Date.now()}, args)
    else
      return Object.assign({type}, args)
  }

  const init = (api) => ({type: MessageTypes.Init, api})
  const batch = rpcMessages => ({type: MessageTypes.Batch, rpcMessages})

  const rpcValue = value => ({type: MessageTypes.Value, value})
  const rpcApi = (stub, functionNames) => ({type: MessageTypes.Api, functionNames, stub})
  const rpcFunction = stub => ({type: MessageTypes.Function, stub})
  const rpcSharedObject = (stub, properties) => ({type: MessageTypes.SharedObject, properties, stub})

  const rpcApiCall = (id, stub, func, args, returnPriority, protocols) =>
    rpcMessage(MessageTypes.ApiCall, {id, stub, func, args, returnPriority, protocols})
  const rpcFunctionCall = (id, stub, args, returnPriority) => rpcMessage(MessageTypes.FunctionCall, {id, stub, args, returnPriority})
  const rpcReturn = (id, stub, value, callTimestamp) => debug
    ? rpcMessage(MessageTypes.Return, {id, stub, value, callTimestamp})
    : rpcMessage(MessageTypes.Return, {id, stub, value})

  const rpcError = (id, stub, error, callTimestamp) => debug
    ? rpcMessage(MessageTypes.Error, {id, stub, error, callTimestamp})
    : rpcMessage(MessageTypes.Error, {id, stub, error})

  const rpcStubPropertyUpdate = (stub, prop, value) => rpcMessage(MessageTypes.StubPropertyUpdate, {stub, prop, value})
  const rpcProxyPropertyUpdate = (stub, prop, value) => rpcMessage(MessageTypes.ProxyPropertyUpdate, {stub, prop, value})

  const isApiCall = rpcMessage => rpcMessage.type === MessageTypes.ApiCall
  const isFunctionCall = rpcMessage => rpcMessage.type === MessageTypes.FunctionCall
  const isReturn = rpcMessage => rpcMessage.type === MessageTypes.Return
  const isError = rpcMessage => rpcMessage.type === MessageTypes.Error
  const isProxyPropertyUpdate = rpcMessage => rpcMessage.type === MessageTypes.ProxyPropertyUpdate
  const isStubPropertyUpdate = rpcMessage => rpcMessage.type === MessageTypes.StubPropertyUpdate

  const messageProtocol = {
    MessageType: {
      enum: [MessageTypes.Init, MessageTypes.Batch],
    },
    RpcMessageType: {
      enum: [MessageTypes.ApiCall, MessageTypes.FunctionCall, MessageTypes.Return, MessageTypes.Error,
        MessageTypes.StubPropertyUpdate, MessageTypes.ProxyPropertyUpdate]
    },
    RpcValueType: {
      enum: [MessageTypes.Value, MessageTypes.Api, MessageTypes.Function, MessageTypes.SharedObject]
    },
    Priority: {
      enum: [MessagePriorities.Immediate, MessagePriorities.High, MessagePriorities.Medium, MessagePriorities.Low, MessagePriorities.None]
    },

    RpcValueValue: {
      struct: {
        type: 'RpcValueType',
        value: 'json'
      }
    },

    RpcApiValue: {
      struct: {
        type: 'RpcValueType',
        functionNames: {array: 'string'},
        stub: 'uint32'
      }
    },

    RpcFunctionValue: {
      struct: {
        type: 'RpcValueType',
        stub: 'uint32'
      }
    },

    RpcSharedObjectProperty: {
      struct: {
        name: 'string',
        value: 'json'
      }
    },

    RpcSharedObjectValue: {
      struct: {
        type: 'RpcValueType',
        properties: 'json', //{array: 'RpcSharedObjectProperty'},
        stub: 'uint32'
      }
    },

    RpcValue: {
      union: {
        tag: 'type',
        cases: {
          [MessageTypes.Value]: 'RpcValueValue',
          [MessageTypes.Api]: 'RpcApiValue',
          [MessageTypes.Function]: 'RpcFunctionValue',
          [MessageTypes.SharedObject]: 'RpcSharedObjectValue'
        }
      }
    },

    RpcApiCall: {
      struct: {
        type: 'RpcMessageType',
        id: 'uint32',
        stub: 'uint32',
        func: 'string',
        args: {array: 'RpcValue'},
        returnPriority: 'Priority'
      }
    },

    RpcFunctionCall: {
      struct: {
        type: 'RpcMessageType',
        id: 'uint32',
        stub: 'uint32',
        args: {array: 'RpcValue'},
        returnPriority: 'Priority'
      }
    },

    RpcReturn: {
      struct: {
        type: 'RpcMessageType',
        id: 'uint32',
        stub: 'uint32',
        value: 'RpcValue'
      }
    },

    RpcError: {
      struct: {
        type: 'RpcMessageType',
        id: 'uint32',
        stub: 'uint32',
        error: 'string'
      }
    },

    RpcStubPropertyUpdate: {
      struct: {
        type: 'RpcMessageType',
        stub: 'uint32',
        prop: 'string',
        value: 'json'
      }
    },

    RpcProxyPropertyUpdate: {
      struct: {
        type: 'RpcMessageType',
        stub: 'uint32',
        prop: 'string',
        value: 'json'
      }
    },

    RpcMessage: {
      union: {
        tag: 'type',
        cases: {
          [MessageTypes.ApiCall]: 'RpcApiCall',
          [MessageTypes.FunctionCall]: 'RpcFunctionCall',
          [MessageTypes.Return]: 'RpcReturn',
          [MessageTypes.Error]: 'RpcError',
          [MessageTypes.StubPropertyUpdate]: 'RpcStubPropertyUpdate',
          [MessageTypes.ProxyPropertyUpdate]: 'RpcProxyPropertyUpdate'
        }
      }
    },

    BatchMessage: {
      struct: {
        type: 'MessageType',
        rpcMessages: {array: 'RpcMessage'}
      }
    },

    InitMessage: {
      struct: {
        type: 'MessageType',
        api: {array: 'string'}
      }
    },

    Message: {
      union: {
        tag: 'type',
        cases: {
          [MessageTypes.Init]: 'InitMessage',
          [MessageTypes.Batch]: 'BatchMessage'
        }
      }
    }
  }

  return {Types: MessageTypes, init, batch, rpcApiCall, rpcFunctionCall, rpcReturn, rpcError, rpcStubPropertyUpdate, rpcProxyPropertyUpdate,
    rpcValue, rpcApi, rpcFunction, rpcSharedObject,
    isApiCall, isFunctionCall, isReturn, isError, isProxyPropertyUpdate, isStubPropertyUpdate, messageProtocol}
})