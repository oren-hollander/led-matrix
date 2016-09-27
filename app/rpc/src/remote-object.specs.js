'use strict'

define(['lodash', 'remote-object'],
  (_, {RemoteObject, ExposedObject, ShadowObject, ExposedObjectProxy, ShadowObjectProxy}) => {

  describe('Exposed and shadow objects', function () {
    it('should connect and update properties', function (done) {

      const o = {
        prop1: 42,
        f1: () => 42,
        setProp1: value => o.prop1 = value
      }

      const {remoteApi, localApi} = ExposedObject(o)
      ShadowObject(remoteApi).then(shadow => {
        shadow.setProp1(43)
        expect(localApi.prop1).toBe(43)

        localApi.setProp1(44)
        expect(shadow.prop1).toBe(44)
        done()
      })
    })
  })

  describe('Exposed and shadow proxies', function () {
    it('should connect and update properties', function (done) {
      const o = {
        prop1: 42,
        f1: () => 42
      }

      const {remoteApi, localApi} = ExposedObjectProxy(o)
      ShadowObjectProxy(remoteApi).then(shadow => {
        shadow.prop1 = 43
        expect(localApi.prop1).toBe(43)
        expect(shadow.prop1).toBe(43)

        localApi.prop1 = 44
        expect(localApi.prop1).toBe(44)
        expect(shadow.prop1).toBe(44)
        done()
      })
    })
  })
})
