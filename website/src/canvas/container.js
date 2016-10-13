'use strict'

define([], () => {

  function Container(bounds, components = []){

    function addComponent(component) {
      components.push(component)
    }

    function paint(ctx) {
      _.forEach(components, component => {
        ctx.save()
        ctx.rect(component.bounds.x, component.bounds.y, component.bounds.w, component.bounds.h)
        ctx.clip()
        ctx.translate(component.bounds.x, component.bounds.y)
        component.paint(ctx)
        ctx.restore()
      })
    }

    const shouldPaint = () => _.some(components, component => !component.shouldPaint || component.shouldPaint())

    return {bounds, paint, shouldPaint, addComponent}
  }

  return Container
})

