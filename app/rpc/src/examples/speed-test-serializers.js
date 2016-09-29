'use strict'

define(['lodash'], (_) => {
  return {
    Image: {
      read: reader => {
        const pixelCount = reader.uint32()
        const image = new Array(pixelCount)
        for(let i = 0; i < pixelCount; i++){
          const red = reader.uint8()
          const green = reader.uint8()
          const blue = reader.uint8()
          image[i] = {red, green, blue}
        }
        return image
      },
      write: (writer, value) => {
        writer.uint32(value.length)
        _.forEach(value, pixel => {
          writer.uint8(pixel.red)
          writer.uint8(pixel.green)
          writer.uint8(pixel.blue)
        })
      }
    }
  }
})