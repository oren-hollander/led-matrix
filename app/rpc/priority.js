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

  const setPriority = (func, callPriority, returnPriority = callPriority) => {
    func[CallPriority] = callPriority
    func[ReturnPriority] = returnPriority
  }

  const withPriority = (func, callPriority, returnPriority = callPriority) => (... args) => {
    const currentCallPriority = func[CallPriority]
    const currentReturnPriority = func[ReturnPriority]

    func[CallPriority] = callPriority
    func[ReturnPriority] = returnPriority

    const result = func(...args)

    func[CallPriority] = currentCallPriority
    func[ReturnPriority] = currentReturnPriority

    return result
  }

  return {
    CallPriority,
    ReturnPriority,
    MessagePriorities,
    setPriority,
    withPriority
  }
})