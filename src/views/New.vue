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
        <input max="1000" min="100" step="5" type="range" v-model.number="maxSize">
        <span>{{maxSize}}</span>
      </label>

      <label class="setting">background triangles from image palette
        <input type="checkbox" v-model="trianglesFromImagePalette">
      </label>

      <label v-if="palette">
        <input type="button" @click="recreateTrianglesBackground" value="recreate triangles">
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
        :download="stepDownload"
        :imageStyle="stepStyle"
        :src="thumbURI"
        :uri="true"
      />

      <div
        class="palette"
        v-if="palette"
      >
        <div
          class="color"
          :key="`${color}-${index}`"
          :style="{
            backgroundColor: color
          }"
          v-for="(color, index) in palette">
        </div>
      </div>

      <div
        class="palette"
        v-if="lightPalette"
      >
        <div
          class="color"
          :key="`${color}-${index}`"
          :style="{
            backgroundColor: color
          }"
          v-for="(color, index) in lightPalette">
        </div>
      </div>

      <StepDisplay
        :download="stepDownload"
        :imageStyle="stepStyle"
        :src="triangles"
      />

      <StepDisplay
        :download="stepDownload"
        :imageStyle="stepStyle"
        :src="tracedTriangles"
      />

      <StepDisplay
        :download="stepDownload"
        :imageStyle="stepStyle"
        :src="posterizedThumb"
      />

      <StepDisplay
        :download="stepDownload"
        :imageStyle="stepStyle"
        :src="merged"
      />

      <StepDisplay
        :download="stepDownload"
        :imageStyle="stepStyle"
        :src="traced"
      />

      <StepDisplay
        :download="stepDownload"
        :imageStyle="stepStyle"
        :src="roughTraced"
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
import { createUrl, cycle, getColorInBounds, lightenPalette, shuffle } from '../utils'
import { saveAs } from 'file-saver'
import Color from 'color'
import pixels from 'image-pixels'
import palette from 'image-palette'

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

const createTriangles = options =>
  Trianglify({
    ...options
  }).svg({ includeNamespace: true })

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
      palette: null,
      lightPalette: null,
      backgroundColor: '#ffffff',
      backgroundOpacity: 1,
      simplification: 0,
      threshold: -1,
      maxSize: 500,
      fakeDelay: 700,
      trianglesFromImagePalette: false
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
    },

    trianglesFromImagePalette () {
      if (!this.palette) {
        return
      }

      this.recreateTrianglesBackground()
    }
  },

  mounted () {
    this.$on('changed-maxSize', () => this.selectedImage(this.image))

    this.$on('changed-image', this.posterizeThumb)
    this.$on('changed-image', this.extractPalette)

    this.$on('extracted-palette', this.createTriangles)

    this.$on('posterized-thumb', this.extractPosterPaths)

    this.$on('extracted-poster-paths', this.mergePaths)
    this.$on('extracted-poster-paths', this.tracePosterPaths)
    this.$on('extracted-poster-paths', this.roughifyPosterPaths)

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
          width: this.width,
          ...(this.trianglesFromImagePalette ? {
            x_colors: shuffle(this.lightPalette.slice(0)),
            y_colors: shuffle(this.lightPalette.slice(0))
          } : {})
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
          path.setAttribute('stroke', 'none')
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

    async extractPalette () {
      await this.withLoader(async () => {
        const imagePixels = await pixels(this.thumbURI)
        const imagePalette = palette(imagePixels)

        this.palette = imagePalette.colors.map(color => Color(color).hex())
        this.lightPalette = lightenPalette(this.palette)
      }, 'extracting palette')
      this.$emit('extracted-palette')
    },

    async roughifyPosterPaths () {
      const getColor = cycle(this.palette)

      const polygonFill = (options = {}) => ({
        fillStyle: 'hachure',
        roughness: 3,
        stroke: 'transparent',
        hachureAngle: Math.random() * 360,
        fill: getColor(),
        ...options
      })

      await this.withLoader(async () => {
        const traced = createSizedSVG(this.width, this.height)

        const rc = rough.svg(traced)

        // background for "empty" images
        //
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
          const polygonPath = originalPath.getAttribute('d').replace(/,\s+/g, ',')
          const color = getColorInBounds(originalPath, this.thumb, traced)

          const path = rc.path(polygonPath, {
            simplification: this.simplification,
            ...polygonFill({
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
    },

    recreateTrianglesBackground () {
      this.$once('created-triangles', this.mergePaths)
      this.createTriangles()
    }
  },
  computed: {
    ...mapState(['loading']),

    bgColor () {
      const [r, g, b] = Color.rgb(this.backgroundColor).array()
      return Color([r, g, b], this.backgroundOpacity).hex()
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
    min-width: 110px;
    margin: {
      left: auto;
      right: auto;
    };
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

    .palette {
      display: block;
      margin: 15px;

      .color  {
        display: inline-block;
        width: 25px;
        height: 25px;
        margin: 6px;
        border: 1px black solid;
      }
    }
  }
</style>
