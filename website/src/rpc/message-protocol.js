'use strict'

define([], () => {
  return {
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
})