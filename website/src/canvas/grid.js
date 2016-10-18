'use strict'

define([
  'geometry/geometry'
], (
  {Point}
) => (...xs) => (...ys) => (w, h) => (x, y) => Point(xs[x] / _.last(xs) * w, ys[y] / _.last(ys) * h))