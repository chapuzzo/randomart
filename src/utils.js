import { Base64 } from 'js-base64'

export function getSeed () {
  return Base64.encodeURI(String(Math.random()).substr(2))
}
