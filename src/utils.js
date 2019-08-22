import { Base64 } from 'js-base64'

export function getSeed () {
  return Base64.encodeURI(String(Math.random()).substr(2))
}

export function createUrl (object, mime = 'image/svg+xml') {
  return window.URL.createObjectURL(new Blob([object], { type: mime }))
}

export function cycle (array) {
  const length = array.length
  let index = 0

  return () => {
    const value = array[index]
    index += 1
    index %= length
    return value
  }
}
