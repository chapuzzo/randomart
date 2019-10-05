import { Base64 } from 'js-base64'
import Color from 'color'
import inside from 'point-in-polygon'
import Trianglify from 'trianglify'
import rough from 'roughjs/bin/wrappers/rough'
import { Posterizer } from 'potrace'
import Jimp from 'jimp'

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

  return parsedColor.lighten(amount).hex()
})

export const shuffle = (array, inplace = false) => {
  if (!inplace) {
    array = array.slice(0)
  }

  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }

  return array
}

const createThumb = (image, maxSize = 200) => {
  let newDimensions = [maxSize, Jimp.AUTO]

  if (image.getWidth() < image.getHeight()) {
    newDimensions.reverse()
  }

  return image.clone().resize(...newDimensions)
    .blur(2)
}

export const posterize = (image, options) => {
  const posterizer = new Posterizer(options)

  return new Promise((resolve, reject) => {
    posterizer.loadImage(image, error => {
      if (error) {
        reject(error)
      }

      resolve(posterizer.getSVG())
    })
  })
}

const createTriangles = options =>
  Trianglify({
    ...options
  }).svg({ includeNamespace: true })

export function createSizedSVG (width, height) {
  const namespaceURI = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(namespaceURI, 'svg')
  svg.setAttribute('xmlns', namespaceURI)

  svg.setAttribute('width', width)
  svg.setAttribute('height', height)

  return svg
}

export function extractPaths (posterizedImage) {
  const domParser = new DOMParser()
  const posterizedThumb = domParser.parseFromString(posterizedImage, 'image/svg+xml')

  return Array.from(posterizedThumb.querySelectorAll('path'))
}

export function mergePaths (trianglePaths, posterPaths, svg) {
  trianglePaths.forEach(path => {
    svg.appendChild(path)
  })

  posterPaths.forEach(path => {
    path.setAttribute('stroke', 'none')
    svg.appendChild(path)
  })

  return svg.outerHTML
}

export function thumbnailize (image, maxSize, mime = 'image/png') {
  const thumb = createThumb(image, maxSize)

  return new Promise((resolve, reject) => {
    thumb.getBase64(mime, (error, thumbURI) => {
      if (error) {
        reject(error)
      }

      resolve({
        thumb,
        thumbURI,
        height: thumb.getHeight(),
        width: thumb.getWidth()
      })
    })
  })
}

export function trianglize (height, width, palette) {
  const triangles = createTriangles({
    height,
    width,
    ...(palette ? {
      x_colors: shuffle(palette),
      y_colors: shuffle(palette)
    } : {})
  })

  return {
    triangles: triangles.outerHTML,
    trianglePaths: Array.from(triangles.querySelectorAll('path'))
  }
}

const polygonFill = (getColor, options = {}) => ({
  fillStyle: 'hachure',
  roughness: 3,
  stroke: 'transparent',
  hachureAngle: Math.random() * 360,
  fill: getColor(),
  ...options
})

export function tracer (paths, thumb, width, height, simplification, getColor) {
  const traced = createSizedSVG(width, height)

  const rc = rough.svg(traced)

  paths.forEach(originalPath => {
    const polygonPath = originalPath.getAttribute('d').replace(/,\s+/g, ',')
    const color = getColorInBounds(originalPath, thumb, traced)

    const path = rc.path(polygonPath, {
      simplification,
      ...polygonFill(getColor, {
        fill: `${color}`
      })
    })

    originalPath.removeAttribute('style')
    // originalPath.setAttribute('fill', 'none')
    originalPath.setAttribute('fill', color)
    originalPath.setAttribute('stroke', getColor())
    originalPath.setAttribute('stroke', color)
    originalPath.setAttribute('stroke-width', 1)
    traced.appendChild(originalPath)
    traced.appendChild(path)
  })

  return traced.outerHTML
}
