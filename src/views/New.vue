<template>
  <div class="editor">
    <div class="overlay" v-if="loading">
      <GridLoader size="20px"/>
      <span class="message" v-if="loadingMessage">{{loadingMessage}}</span>
    </div>

    <ImageSelector :withLoader="withLoader" @selected="selectedImage"/>

    <fieldset>
      <legend>trace options</legend>
      <label class="setting">threshold
        <input max="255" min="-1" type="range" v-model.number="threshold">
        <span>{{threshold}}</span>
      </label>

      <label class="setting">simplification
        <input max="5" min="-5" type="range" v-model.number="simplification">
        <span>{{simplification}}</span>
      </label>

      <label class="setting">max size
        <input max="100" min="1000" type="range" v-model.number="maxSize">
        <span>{{maxSize}}</span>
      </label>
    </fieldset>

    <fieldset>
      <legend>background</legend>
      <label class="setting">color
        <input type="color" v-model="backgroundColor">
      </label>

      <label class="setting">opacity
        <input max="1" min="0" step="0.1" type="range" v-model.number="backgroundOpacity">
        <span>{{backgroundOpacity}}</span>
      </label>
    </fieldset>

    <div class="steps">
      <StepDisplay
        :src="thumbURI"
        :imageStyle="stepStyle"
        :download="stepDownload"
        :uri="true"
      />

      <StepDisplay
        :src="triangles"
        :imageStyle="stepStyle"
        :download="stepDownload"
      />

      <StepDisplay
        :src="tracedTriangles"
        :imageStyle="stepStyle"
        :download="stepDownload"
      />

      <StepDisplay
        :src="posterizedThumb"
        :imageStyle="stepStyle"
        :download="stepDownload"
      />

      <StepDisplay
        :src="merged"
        :imageStyle="stepStyle"
        :download="stepDownload"
      />

      <StepDisplay
        :src="traced"
        :imageStyle="stepStyle"
        :download="stepDownload"
      />

      <StepDisplay
        :src="roughTraced"
        :imageStyle="stepStyle"
        :download="stepDownload"
      />
    </div>

  </div>
</template>

<script>
import ImageSelector from '../components/ImageSelector'
import StepDisplay from '../components/StepDisplay'
import Jimp from 'jimp'
import { Posterizer } from 'potrace'
import Trianglify from 'trianglify'
import rough from 'roughjs/bin/wrappers/rough'
import GridLoader from 'vue-spinner/src/GridLoader'
import { mapActions, mapState } from 'vuex'
import { createUrl, cycle } from '../utils'
import { saveAs } from 'file-saver'
import colorString from 'color-string'
import pixels from 'image-pixels'
import palette from 'image-palette'
import * as _ from 'lodash'

const createThumb = (image, maxSize = 200) => {
  let newDimensions = [maxSize, Jimp.AUTO]

  if (image.getWidth() < image.getHeight()) {
    newDimensions.reverse()
  }

  return image.clone().resize(...newDimensions)
}

const posterize = (image, options) => {
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

const createTriangles = ({ height, width }) => {
  return Trianglify({
    height,
    width
  }).svg({ includeNamespace: true })
}

function createSizedSVG (width, height) {
  const namespaceURI = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(namespaceURI, 'svg')
  svg.setAttribute('xmlns', namespaceURI)

  svg.setAttribute('width', width)
  svg.setAttribute('height', height)

  return svg
}

export default {
  name: 'Editor',
  data () {
    return {
      image: null,
      thumb: null,
      thumbURI: null,
      posterizedThumb: null,
      triangles: null,
      loadingMessage: null,
      trianglePaths: null,
      posterPaths: null,
      merged: null,
      traced: null,
      tracedTriangles: null,
      roughTraced: null,
      height: null,
      width: null,
      backgroundColor: '#ffffff',
      backgroundOpacity: 1,
      simplification: 0,
      threshold: -1,
      maxSize: 500,
      fakeDelay: 700
    }
  },

  watch: {
    threshold () {
      if (!this.image) {
        return
      }

      this.$emit('changed-threshold')
    },

    maxSize () {
      if (!this.image) {
        return
      }

      this.$emit('changed-maxSize')
    },

    simplification () {
      if (!this.posterPaths) {
        return
      }

      this.$emit('changed-simplification')
    }
  },

  mounted () {
    this.$on('changed-maxSize', () => this.selectedImage(this.image))
    this.$on('changed-image', this.createTriangles)
    this.$on('created-triangles', this.posterizeThumb)
    this.$on('created-triangles', this.traceTriangles)
    this.$on('posterized-thumb', this.extractPosterPaths)
    this.$on('extracted-poster-paths', this.mergePaths)
    this.$on('extracted-poster-paths', this.roughifyPosterPaths)
    this.$on('merged-paths', this.tracePosterPaths)

    this.$on('changed-threshold', this.posterizeThumb)
    this.$on('changed-simplification', this.tracePosterPaths)
    this.$on('changed-simplification', this.roughifyPosterPaths)
  },

  methods: {
    ...mapActions(['enableLoader', 'disableLoader']),

    async withLoader (callback, message) {
      this.enableLoader()
      // console.log('wl> ' + message)
      this.loadingMessage = message
      const [, value] = await Promise.all([
        new Promise((resolve, reject) => {
          setTimeout(resolve, this.fakeDelay)
        }),
        callback()
      ])
      // console.log('<wl ' + message)
      this.disableLoader()
      return value
    },

    async selectedImage (image) {
      await this.withLoader(async () => {
        this.image = image

        this.thumb = createThumb(image, this.maxSize)
        this.height = this.thumb.getHeight()
        this.width = this.thumb.getWidth()

        this.thumbURI = await this.thumb.getBase64Async('image/png')
      }, 'creating thumb')
      this.$emit('changed-image')
    },

    async createTriangles () {
      await this.withLoader(async () => {
        const triangles = createTriangles({
          height: this.height,
          width: this.width
        })

        this.triangles = triangles.outerHTML

        this.trianglePaths = Array.from(triangles.querySelectorAll('path'))
      }, 'creating triangles pattern')
      this.$emit('created-triangles')
    },

    async traceTriangles () {
      await this.withLoader(async () => {
        const triangles = Trianglify({
          height: this.height,
          width: this.width
        })

        const traced = createSizedSVG(this.width, this.height)

        const rc = rough.svg(traced)

        triangles.polys.forEach(([color, points]) => {
          const polygon = rc.polygon(points, {
            stroke: color,
            roughness: 3,
            fillStyle: 'hachure',
            fill: color,
            hachureAngle: Math.random() * 360
            // strokeWidth: Math.random() * 8
          })

          traced.appendChild(polygon)
        })

        this.tracedTriangles = traced.outerHTML
      }, 'tracing triangles')
      this.$emit('traced-triangles')
    },

    async posterizeThumb () {
      await this.withLoader(async () => {
        this.posterizedThumb = await posterize(this.thumb, {
          threshold: this.threshold
        })
      }, 'creating posterized thumb')
      this.$emit('posterized-thumb')
    },

    async extractPosterPaths () {
      await this.withLoader(async () => {
        const domParser = new DOMParser()
        const posterizedThumb = domParser.parseFromString(this.posterizedThumb, 'image/svg+xml')

        this.posterPaths = Array.from(posterizedThumb.querySelectorAll('path'))
      }, 'extracting paths from posterized')
      this.$emit('extracted-poster-paths')
    },

    async mergePaths () {
      await this.withLoader(async () => {
        const merged = createSizedSVG(this.width, this.height)

        this.trianglePaths.forEach(path => {
          merged.appendChild(path)
        })

        this.posterPaths.forEach(path => {
          merged.appendChild(path)
        })

        this.merged = merged.outerHTML
      }, 'merging paths')
      this.$emit('merged-paths')
    },

    async tracePosterPaths () {
      await this.withLoader(async () => {
        const traced = createSizedSVG(this.width, this.height)

        const rc = rough.svg(traced)
        this.posterPaths.forEach(originalPath => {
          const path = rc.path(originalPath.getAttribute('d'), {
            simplification: this.simplification
          })
          traced.appendChild(path)
        })

        this.traced = traced.outerHTML
      }, 'tracing paths')
      this.$emit('traced-poster-paths')
    },

    async roughifyPosterPaths () {
      const imagePixels = await pixels(this.thumbURI)
      const imagePalette = palette(imagePixels, 15)

      const colorGenerator = cycle(imagePalette.colors)
      const getColor = () => colorString.to.hex(colorGenerator())

      // console.log(imagePalette.colors.map(colorString.to.hex))

      // imagePalette.colors.forEach(color => {
      //   console.log(`%c ${color}`, `color: ${colorString.to.hex(color)};`)
      // })

      const polygonFill = () => ({
        fillStyle: 'hachure',
        // roughness: 3,
        stroke: 'transparent',
        hachureAngle: Math.random() * 360,
        fill: getColor()
      })

      await this.withLoader(async () => {
        const traced = createSizedSVG(this.width, this.height)

        const rc = rough.svg(traced)

        // const bg = rc.polygon([
        //   [0, 0],
        //   [0, this.height],
        //   [this.width, this.height],
        //   [this.width, 0],
        //   [0, 0]
        // ], {
        //   ...polygonFill()
        // })
        // traced.appendChild(bg)

        this.posterPaths.forEach(originalPath => {
          const path = rc.path(originalPath.getAttribute('d'), {
            simplification: this.simplification,
            ...polygonFill()
          })
          originalPath.removeAttribute('style')
          // originalPath.removeAttribute('fill')
          originalPath.setAttribute('fill', 'none')
          originalPath.setAttribute('stroke', 'black')
          originalPath.setAttribute('stroke-width', 0.5)
          traced.appendChild(originalPath)
          traced.appendChild(path)
        })

        this.roughTraced = traced.outerHTML
      }, 'roughing paths')
      this.$emit('roughed-poster-paths')
    },

    stepDownload (src, dataURI = false) {
      const image = new Image()
      image.src = dataURI ? src : createUrl(src)
      image.addEventListener('load', () => {
        const canvas = document.createElement('canvas')
        canvas.setAttribute('height', this.height)
        canvas.setAttribute('width', this.width)

        const context = canvas.getContext('2d')

        context.fillStyle = this.backgroundColor
        context.globalAlpha = this.backgroundOpacity
        context.fillRect(0, 0, this.width, this.height)
        context.globalAlpha = 1

        context.drawImage(image, 0, 0)

        canvas.toBlob(blob => saveAs(blob, 'traced.png'))
      })
    }
  },
  computed: {
    ...mapState(['loading']),

    bgColor () {
      const [r, g, b] = colorString.get.rgb(this.backgroundColor)
      return colorString.to.hex([r, g, b], this.backgroundOpacity)
    },

    stepStyle () {
      return {
        height: `${this.height}px`,
        width: `${this.width}px`,
        backgroundColor: this.bgColor
      }
    }
  },
  components: {
    ImageSelector,
    StepDisplay,
    GridLoader
  }
}

</script>

<style lang="scss" scoped>
  @import '../style/loader';

  .input, input[type="button"] {
    display: block;
    border: 1px black solid;
    border-radius: 3px;
    padding: 5px;
    cursor: pointer;
    background-color: beige;
  }

  .setting {
    padding: 10px;
    display: inline-flex;
    align-items: center;

    span {
      padding: {
        left: 15px;
        right: 15px;
      };
    }
  }

  .steps {
    display: block;
    padding: 15px;
  }
</style>
