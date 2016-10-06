'use strict'

define([
  'lodash',
  'rpc/priority'
], (
  _,
  {CallPriority, ReturnPriority, MessagePriorities: {Immediate, High, Low, Animation}, withPriority}
) => {

  describe("defineApi", function() {
    it("should prepare an API for being transferred remotely", function() {

      const api = {}
      api.f1 = () => [api[CallPriority], api[ReturnPriority], api.f1[CallPriority], api.f1[ReturnPriority]]
      api.f2 = () => [api[CallPriority], api[ReturnPriority], api.f2[CallPriority], api.f2[ReturnPriority]]
      api[CallPriority] = Immediate
      api[ReturnPriority] = Immediate

      const f3 = () => [f3[CallPriority], f3[ReturnPriority]]
      f3[CallPriority] = Immediate
      f3[ReturnPriority] = Immediate

      withPriority(api).Do(api => {
        expect(api.f1()).toEqual([Immediate, Immediate, undefined, undefined])
        expect(api.f2()).toEqual([Immediate, Immediate, undefined, undefined])
      })

      withPriority(api).Call(High).Return(Low).Do(api => {
        expect(api.f1()).toEqual([High, Low, undefined, undefined])
        expect(api.f2()).toEqual([High, Low, undefined, undefined])
      })

      withPriority(api).Call(High).Return(Low).Do(api => {
        expect(api.f1()).toEqual([High, Low, undefined, undefined])
        withPriority(api.f2).Call(Animation).Do(f2 => {
          expect(f2()).toEqual([High, Low, Animation, undefined])
        })
      })

      withPriority(f3).Call(High).Do(f3 => {
        expect(f3()).toEqual([High, Immediate])
        expect(f3()).toEqual([High, Immediate])
      })
    })
  });
})

