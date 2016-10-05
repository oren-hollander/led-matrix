'use strict'

define([], () => {
  const Types = {
    Point: 0,
    Line: 1,
    Circle: 2,
    Box: 3,
    HPill: 4,
    Shape: 5
  }

  const sqrt = Math.sqrt
  const atan2 = Math.atan2

  const Point = (x, y) => ({t: Types.Point, x, y})
  const Line = (p1, p2) => ({t: Types.Line, p1, p2})
  const Circle = (c, r) => ({t: Types.Circle, c, r})
  const Box = (c, hw, hh) => ({t: Types.Box, c, hw, hh})
  const HPill = (c, hw, hh) => ({t: Types.HPill, c, hw, hh})
  const Shape = shapes => ({t: Types.Shape, shapes})

  const lineLength = line => sqrt((line.p1.x - line.p2.x) ** 2 + (line.p1.y - line.p2.y) ** 2)

  function distanceFromLine(p, l) {
    var l2 = lineLength(l)

    if (l2 == 0)
      return lineLength(Line(p, l.p1))

    var t = ((p.x - l.p1.x) * (l.p2.x - l.p1.x) + (p.y - l.p1.y) * (l.p2.y - l.p1.y)) / l2

    if (t < 0)
      return lineLength(Line(p, l.p1))

    if (t > 1)
      return lineLength(Line(p, l.p2))

    const v = Point(l.p1.x + t * (l.p2.x - l.p1.x), l.p1.y + t * (l.p2.y - l.p2.y))

    return lineLength(Line(p, v));
  }


  function pointInShape(point, shape){
    switch (shape.t){
      case Types.Point:
        return shape.x === point.x && shape.y === point.y
      case Types.Line:
        return distanceFromLine(point, shape) === 0
      case Types.Circle:
        return lineLength(Line(shape.c, point)) < shape.r
      case Types.Box:
        return point.x >= point.c - p.hw && point.x <= point.c + point.hw &&
          point.y >= point.c - p.hh && point.y <= point.c + point.hh
      case Types.Shape:
        return _.some(shape.shapes, _.partial(pointInShape, point))
    }
  }
})