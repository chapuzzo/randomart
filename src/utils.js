import { Base64 } from 'js-base64'

export function getSeed () {
  return Base64.encodeURI(String(Math.random()).substr(2))
}

export function createUrl (object, mime = 'image/svg+xml') {
  return window.URL.createObjectURL(new Blob([object], { type: mime }))
}
