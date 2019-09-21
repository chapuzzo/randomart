import { Base64 } from 'js-base64'
import Color from 'color'
import inside from 'point-in-polygon'

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

const getBBox = from => {
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

const createDebugPoint = (coords, color, size = 5) => {
  const point = document.createElement('circle')

  point.setAttribute('cx', coords.x)
  point.setAttribute('cy', coords.y)
  point.setAttribute('r', size)
  point.setAttribute('fill', color)

  return point
}

const getColorAt = (coords, image) => {
  const color = image.getPixelColor(coords.x, coords.y)

  const r = (color >> 24) & 0xff
  const g = (color >> 16) & 0xff
  const b = (color >> 8) & 0xff
  const a = (color >> 0) & 0xff

  return Color.rgb([r, g, b, a]).hex()
}

const addColouredPointAt = (coords, color, svg, size = 5, stroke = false) => {
  const point = createDebugPoint(coords, color, size)

  if (stroke) {
    point.setAttribute('stroke', 'black')
  }

  svg.appendChild(point)
}

const getPoint = boundaries => {
  const coords = {
    x: boundaries.x + Math.random() * boundaries.width,
    y: boundaries.y + Math.random() * boundaries.height
  }

  return coords
}

const discretize = svgGraphicsElement => {
  const length = svgGraphicsElement.getTotalLength()
  const step = Math.floor(length / 100)
  const amount = Math.floor(length / step)

  return Array(amount).fill().map((_, index) => {
    const point = svgGraphicsElement.getPointAtLength(index * step)

    return [point.x, point.y]
  })
}

const isInside = (container, point) => {
  const points = discretize(container)

  return inside([point.x, point.y], points)
}

export const getColorInBounds = (path, image, svg, debug = false) => {
  const bbox = getBBox(path)

  let count = 0
  let point = getPoint(bbox)

  while (!isInside(path, point) && count++ < 15) {
    point = getPoint(bbox)
    if (debug) {
      addColouredPointAt(point, getColorAt(point, image), svg)
    }
  }

  const extractedColor = getColorAt(point, image)

  if (debug) {
    addColouredPointAt(point, extractedColor, svg, 5, true)
    console.log(`%c ${extractedColor}`, `color: ${extractedColor};`)
  }

  return extractedColor
}

export const lightenPalette = (palette, amount = 0.5) => palette.map(color => {
  const parsedColor = Color(color)
  const lightColor = parsedColor.lighten(amount).hex()

  return lightColor
})
