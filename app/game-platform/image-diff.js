'use strict'

define(['range'], (range) => {

  return (source, target) => {
    if(source.width() !== target.width() || source.height() !== target.height())
      throw `images doesn't match`

    const commands = [];
    for (let x of range.from(0).until(source.width())){
      for (let y of range.from(0).until(source.height())) {
        const targetPixel = target.pixel(x, y)
        if (source.pixel(x, y) !== targetPixel) {
          commands.push({x, y, op: targetPixel});
        }
      }
    }

    return commands;
  }
})
