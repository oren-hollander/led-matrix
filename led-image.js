'use strict';

function LedImage(width, height) {
  const pixels = [];

  for (let x = 0; x < width; x++) {
    pixels[x] = [];
    for (let y = 0; y < height; y++) {
      pixels[x][y] = {current: false, next: false};
    }
  }

  function pixel(x, y, on = true) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      pixels[x][y].next = on;
    }
  }

  function patch() {
    const commands = [];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const pixel = pixels[x][y];
        if (pixel.current !== pixel.next) {
          commands.push({x, y, op: pixel.next});
        }
      }
    }

    return commands;
  }

  function flip() {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const pixel = pixels[x][y];
        pixel.current = pixel.next;
        pixel.next = false;
      }
    }
  }

  return {pixel, patch, flip};
}