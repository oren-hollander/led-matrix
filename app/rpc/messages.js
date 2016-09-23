'use strict'

define(['priority'], ({MessagePriorities}) => {
  const MessageTypes = {
    Init: 'init',
    Batch: 'batch',
    Call: 'call',
    Return: 'return',
    Error: 'error',
    DataValue: 'data-value',
    ApiValue: 'api-value'
  }

  const init = (api) => ({type: MessageTypes.Init, api})
  const batch = rpcMessages => ({type: MessageTypes.Batch, rpcMessages})

  const rpcDataValue = data => ({type: MessageTypes.DataValue, data})
  const rpcApiValue = (api, stub) => ({type: MessageTypes.ApiValue, api, stub})
  const rpcCall = (id, stub, func, args, returnPriority) => ({type: MessageTypes.Call, id, stub, func, args, returnPriority})
  const rpcReturn = (id, stub, value) => ({type: MessageTypes.Return, id, stub, value})
  const rpcError = (id, stub, error) => ({type: MessageTypes.Error, id, stub, error})

  const isCall = rpcMessage => rpcMessage.type === MessageTypes.Call
  const isReturn = rpcMessage => rpcMessage.type === MessageTypes.Return
  const isError = rpcMessage => rpcMessage.type === MessageTypes.Error

  const messageProtocol = {
    Message: {
      MessageType: {
        enum: [MessageTypes.Init, MessageTypes.Batch],
      },
      RpcMessageType: {
        enum: [MessageTypes.Call, MessageTypes.Return, MessageTypes.Error]
      },
      RpcValueType: {
        enum: [MessageTypes.DataValue, MessageTypes.ApiValue]
      },
      Priority: {
        enum: [MessagePriorities.Immediate, MessagePriorities.High, MessagePriorities.Medium, MessagePriorities.Low, MessagePriorities.None]
      },

      RpcDataValue: {
        struct: {
          type: 'RpcValueType',
          data: 'string'
        }
      },

      RpcApiValue: {
        struct: {
          type: 'RpcValueType',
          api: {array: 'string'},
          stub: 'uint32'
        }
      },

      RpcValue: {
        union: {
          tag: 'type',
          cases: {
            [MessageTypes.DataValue]: 'RpcDataValue',
            [MessageTypes.ApiValue]: 'RpcApiValue'
          }
        }
      },

      RpcCall: {
        struct: {
          type: 'RpcMessageType',
          id: 'uint32',
          stub: 'uint16',
          func: 'string',
          args: {array: 'RpcValue'},
          returnPriority: 'Priority'
        }
      },

      RpcReturn: {
        struct: {
          type: 'RpcMessageType',
          id: 'uint32',
          stub: 'uint16',
          value: 'RpcValue'
        }
      },

      RpcError: {
        struct: {
          type: 'RpcMessageType',
          id: 'uint32',
          stub: 'uint16',
          error: 'string'
        }
      },

      RpcMessage: {
        union: {
          tag: 'type',
          cases: {
            [MessageTypes.Call]: 'RpcCall',
            [MessageTypes.Return]: 'RpcReturn',
            [MessageTypes.Error]: 'RpcError'
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
  }

  return {Types: MessageTypes, init, batch, rpcCall, rpcReturn, rpcError,
    rpcDataValue, rpcApiValue, isCall, isReturn, isError, messageProtocol}
})