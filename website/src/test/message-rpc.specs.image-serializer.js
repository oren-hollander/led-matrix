'use strict'

define([], () => {
  return {
    writeValue: (writer, image) => {
      writer.uint32(image.length)
      _.forEach(image, ({red, green, blue}) => {
        writer.uint8(red)
        writer.uint8(green)
        writer.uint8(blue)
      })
    },
    readValue: reader => {
      const length = reader.uint32()
      const image = new Array(length)
      for(let i = 0; i < length; i++){
        image[i] = {red: reader.uint8(), green: reader.uint8(), blue: reader.uint8()}
      }
      return image
    }
  }
})