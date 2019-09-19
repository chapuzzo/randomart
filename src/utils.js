import { Base64 } from 'js-base64'
import colorString from 'color-string'

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

function getBBox (from) {
  const _getBBox = SVGGraphicsElement.prototype.getBBox
  var bbox, tempDiv, tempSvg
  if (document.contains(from)) {
    return _getBBox.apply(from)
  } else {
    tempDiv = document.createElement('div')
    tempDiv.setAttribute('style', 'position:absolute; visibility:hidden; width:0; height:0')
    if (from.tagName === 'svg') {
      tempSvg = from.cloneNode(true)
    } else {
      tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      tempSvg.appendChild(from.cloneNode(true))
    }
    tempDiv.appendChild(tempSvg)
    document.body.appendChild(tempDiv)
    bbox = _getBBox.apply(tempSvg)
    document.body.removeChild(tempDiv)
    return bbox
  }
}

const createPoint = (coords) => {
  const point = document.createElement('circle')

  point.setAttribute('cx', coords.x)
  point.setAttribute('cy', coords.y)
  point.setAttribute('r', 5)

  return point
}

const getColorAt = (coords, image) => {
  const color = image.getPixelColor(coords.x, coords.y)

  const r = (color >> 24) & 0xff
  const g = (color >> 16) & 0xff
  const b = (color >> 8) & 0xff
  const a = (color >> 0) & 0xff

  const hex = colorString.to.hex(r, g, b, a)

  return hex
}

const addColouredPointAt = (coords, color, svg, stroke = false) => {
  const point = createPoint(coords)

  point.setAttribute('fill', color)

  if (stroke) {
    point.setAttribute('stroke', 'black')
  }

  svg.appendChild(point)
}

export function getColorInBounds (path, image, svg, debug = false) {
  const bbox = getBBox(path)

  const getPoint = () => {
    const point = DOMPoint.fromPoint({
      x: bbox.x + Math.random() * bbox.width,
      y: bbox.y + Math.random() * bbox.height
    })

    return point
  }

  let point = getPoint(bbox)
  while (!path.isPointInFill(point)) {
    point = getPoint(bbox)
    if (debug) {
      addColouredPointAt(point, getColorAt(point, image), svg)
    }
  }

  const color = getColorAt(point, image)
  if (debug) {
    addColouredPointAt(point, color, svg, true)
    console.log(`%c ${color}`, `color: ${color};`)
  }


  return color
}
