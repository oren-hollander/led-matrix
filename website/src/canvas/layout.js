'use strict'

define([
  'lodash',
  'util/html',
  'canvas/view',
  'geometry/geometry'
], (
  _,
  {px},
  View,
  {Line, Rect}
) => {

  const layout = f => {
    f({fw: 1.6, fh: 1})
  }

  addComponent(keypad, layout(({fw, fh}) => ({x: 0, y: 0, w: fw, h: fh})))
})