'use strict'

define([], () => {

  const Pi = Math.PI
  const Pi2 = 2 * Pi

  const Point = (x, y) => ({x, y})
  const Line = (x1, y1, x2, y2) => ({x1, y1, x2, y2})
  const Circle = (x, y, r) => ({x, y, r})
  const Rect = (x, y, w, h) => ({x, y, w, h})
  const Box = (x, y, hw, hh) => ({x, y, hw, hh})
  const HPill = (x, y, hw, hh, o) => ({x, y, hw, hh})

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
  const rectToBox = rect => Box(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2, rect.h / 2)
  const boxToRect = box => Rect(box.x - box.hw, box.y - box.hh, box.hw * 2, box.hh * 2)
  const pointsToLine = (p1, p2) => Line(p1.x. p2.y, p2.x, p2.y)
  const lineToPoints = line => [Point(line.x1, line.y1), Point(line.x2, line.y2)]

  const resizeBox = (box, dx, dy) => Box(box.x, box.y, box.hw + dx / 2, box.hh + dy / 2)
  const scaleBox = (box, s) => Box(box.x, box.y, box.hw * s, box.hh * s)
  const translateBox = (box, dx, dy) => Box(box.x + dx, box.y + dy, box.w, box.h)
  
  const pointInRect = (point, rect) =>
    point.x >= rect.x && point.x <= rect.x + rect.w &&
    point.y >= rect.y && point.y <= rect.y + rect.h

  const pointInBox = (point, box) =>
    point.x >= box.x - box.hw && point.x <= box.x + box.hw &&
    point.y >= box.y - box.hh && point.y <= box.y + box.hh

  const pointInHPill = (point, hPill) => {
    const body = Box(hPill.x, hPill.y, hPill.hw, hPill.hh - hPill.hw)
    const topArc = Circle(hPill.x, hPill.y - hPill.hh + hPill.hw, hPill.hw)
    const bottomArc = Circle(hPill.x, hPill.y + hPill.hh - hPill.hw, hPill.hw)

    return pointInBox(point, body) || pointInCircle(point, topArc) || pointInCircle(point, bottomArc)
  }

  const pointInCircle = (point, circle) =>
    Math.sqrt(Math.abs(point.x - circle.x) ** 2 + Math.abs(point.y - circle.y) ** 2) <= circle.r

  const circleToBox = circle => Box(circle.x, circle.y, circle.r, circle.r)

  const normalizeAngle = angle => {
    const alpha = angle % Pi2
    if(alpha > Pi)
      return alpha - Pi2
    if(alpha < -Pi)
      return alpha + Pi2

    return alpha
  }

  function sub(p1, p2){
    return {x: p1.x - p2.x, y: p1.y - p2.y}
  }

  function add(p1, p2){
    return {x: p1.x + p2.x, y: p1.y + p2.y}
  }

  function mul(p, s){
    return {x: p.x * s, y: p.y * s}
  }

  function dot(p1, p2){
    return p1.x * p2.x + p1.y * p2.y
  }

  function normalize(p){
    const m = mag(p)
    return {x: p.x / m, y: p.y / m}
  }

  const mag = p => Math.sqrt(p.x ** 2 + p.y ** 2)

  function circleColliding(c1, c2) {
    const xd = c1.x - c2.x
    const yd = c1.y - c2.y

    const sumRadius = c1.r + c2.r
    const sqrRadius = sumRadius ** 2

    const distSqr = xd ** 2 + yd ** 2

    return distSqr <= sqrRadius
  }

  function resolveCollision(c1, c2) {
    // get the mtd
    const delta = sub(c1, c2)
    const d = mag(delta)
    // minimum translation distance to push balls apart after intersecting
    const mtd = mul(delta, ((c1.r + c2.r) - d) / d)

    // resolve intersection --
    // inverse mass quantities
    const im1 = 1 / c1.r
    const im2 = 1 / c2.r

    // push-pull them apart based off their mass
    const c1p = add(c1, mul(mtd, im1 / (im1 + im2)))
    c1.x = c1p.x
    c1.y = c1p.y
    const c2p = sub(c2, mul(mtd, im2 / (im1 + im2)))
    c2.x = c2p.x
    c2.y = c2p.y

    let c1v = {x: c1.velocity * Math.cos(c1.angle), y: c1.velocity * Math.sin(c1.angle)}
    let c2v = {x: c2.velocity * Math.cos(c2.angle), y: c2.velocity * Math.sin(c2.angle)}

    // impact speed
    const v = sub(c1v, c2v)
    const vn = dot(v, normalize(mtd))

    // sphere intersecting but moving away from each other already
    if (vn > 0.0)
      return

    // collision impulse
    const i = (-(1.0 + 0.01) * vn) / (im1 + im2)
    const impulse = mul(mtd, i)

    // change in momentum
    c1v = add(c1v, mul(impulse, im1))
    c2v = sub(c2v, mul(impulse, im2))
    // c1.velocity = Math.sqrt(c1v.x ** 2 + c1v.y ** 2)
    c1.angle = Math.atan2(c1v.y, c1v.x)
    // c2.velocity = Math.sqrt(c2v.x ** 2 + c2v.y ** 2)
    c2.angle = Math.atan2(c2v.y, c2v.x)
  }
  return {
    Point, Line, Circle, Rect, Box, HPill, clamp, rectToBox, boxToRect, pointsToLine, lineToPoints, circleToBox,
    resizeBox, scaleBox, translateBox, pointInRect, pointInBox, pointInHPill, pointInCircle, normalizeAngle,
    circleColliding, resolveCollision
  }
})