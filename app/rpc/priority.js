'use strict'

define([], () => {
  const CallPriority = Symbol('callPriority')
  const ReturnPriority = Symbol('returnPriority')

  const MessagePriorities = {
    Immediate: 'immediate',
    High: 'high',
    Medium: 'medium',
    Low: 'low',
    None: 'none'
  }

  const setPriority = (functionOrApi, callPriority, returnPriority = callPriority) => {
    functionOrApi[CallPriority] = callPriority
    functionOrApi[ReturnPriority] = returnPriority
  }

  function withPriority(functionOrApi) {
    const ctx = {
      callPriority: functionOrApi[CallPriority],
      returnPriority: functionOrApi[ReturnPriority]
    }

    const withPriorityBuilder = {
      Call: priority => {
        ctx.callPriority = priority
        return withPriorityBuilder
      },
      Return: priority => {
        ctx.returnPriority = priority
        return withPriorityBuilder
      },
      Do: f => {
        const currentCallPriority = functionOrApi[CallPriority]
        const currentReturnPriority = functionOrApi[ReturnPriority]
        functionOrApi[CallPriority] = ctx.callPriority
        functionOrApi[ReturnPriority] = ctx.returnPriority
        f(functionOrApi)
        functionOrApi[CallPriority] = currentCallPriority
        functionOrApi[ReturnPriority] = currentReturnPriority
      }
    }

    return withPriorityBuilder
  }

  return {
    CallPriority,
    ReturnPriority,
    MessagePriorities,
    setPriority,
    withPriority
  }
})