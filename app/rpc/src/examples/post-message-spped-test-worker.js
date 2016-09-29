'use strict'

self.onmessage = ({data}) => {
  self.postMessage({count: data.count})
}