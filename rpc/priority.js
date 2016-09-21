'use strict'

define([], () => ({
  CallPriority: Symbol('callPriority'),
  ReturnPriority: Symbol('returnPriority'),
  MessagePriorities: {
    Immediate: 'immediate',
    High: 'high',
    Medium: 'medium',
    Low: 'low',
    None: 'none'
  }
}))