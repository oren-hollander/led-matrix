'use strict'

define([
  'util/annotations'
], (
  {registerAnnotation}
) => {
  const CallPriority = Symbol('call-priority')
  const ReturnPriority = Symbol('return-priority')

  registerAnnotation('CallPriority', CallPriority)
  registerAnnotation('ReturnPriority', ReturnPriority)

  const MessagePriorities = {
    None: -2,
    Immediate: -1,
    High: 0,
    Animation: 1000 / 60,
    Low: 50
  }

  const setPriority = (functionOrApi, callPriority, returnPriority = callPriority) => {
    functionOrApi[CallPriority] = callPriority
    functionOrApi[ReturnPriority] = returnPriority
    return functionOrApi
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