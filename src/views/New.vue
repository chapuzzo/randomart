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
        <div>
          <span @click="recreateTrianglesBackground" class="input">recreate triangles</span>
        </div>
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
          :key="`${color}-${index}`"
          :style="{
            backgroundColor: color
          }"
          class="color"
          v-for="(color, index) in palette">
        </div>
      </div>

      <div
        class="palette"
        v-if="lightPalette"
      >
        <div
          :key="`${color}-${index}`"
          :style="{
            backgroundColor: color
          }"
          class="color"
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
import GridLoader from 'vue-spinner/src/GridLoader'
import { mapActions, mapState } from 'vuex'
import {
  applyOpacity,
  createSizedSVG,
  createUrl,
  cycle,
  extractPalettes,
  extractPaths,
  mergePaths,
  posterize,
  roughTracer,
  thumbnailize,
  simpleTracer,
  traceTriangles,
  trianglize
} from '../utils'
import { saveAs } from 'file-saver'

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

      try {
        const [, value] = await Promise.all([
          new Promise((resolve) => {
            setTimeout(resolve, this.fakeDelay)
          }),
          callback()
        ])
        // console.log('<wl ' + message)
        return value
      } catch (e) {
        console.error(e)
      } finally {
        this.disableLoader()
      }
    },

    async selectedImage (image) {
      await this.withLoader(async () => {
        this.image = image

        Object.assign(this, await thumbnailize(image, this.maxSize))
      }, 'creating thumb')
      this.$emit('changed-image')
    },

    async createTriangles () {
      await this.withLoader(async () => {
        Object.assign(this, trianglize(this.height, this.width, this.trianglesFromImagePalette ? this.lightPalette : null))
      }, 'creating triangles pattern')
      this.$emit('created-triangles')
    },

    async traceTriangles () {
      await this.withLoader(async () => {
        this.tracedTriangles = traceTriangles(this.width, this.height)
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
        const posterizedImage = this.posterizedThumb

        this.posterPaths = extractPaths(posterizedImage)
      }, 'extracting paths from posterized')
      this.$emit('extracted-poster-paths')
    },

    async mergePaths () {
      await this.withLoader(async () => {
        const merged = createSizedSVG(this.width, this.height)

        const trianglePaths = this.trianglePaths
        const posterPaths = this.posterPaths

        this.merged = mergePaths(trianglePaths, posterPaths, merged)
      }, 'merging paths')
      this.$emit('merged-paths')
    },

    async tracePosterPaths () {
      await this.withLoader(async () => {
        this.traced = simpleTracer(this.posterPaths, this.width, this.height, this.simplification)
      }, 'tracing paths')
      this.$emit('traced-poster-paths')
    },

    async extractPalette () {
      await this.withLoader(async () => {
        Object.assign(this, await extractPalettes(this.thumb.resize(50, 50).getBufferAsync('image/png')))
      }, 'extracting palette')
      this.$emit('extracted-palette')
    },

    async roughifyPosterPaths () {
      const getColor = cycle(this.palette)

      await this.withLoader(async () => {
        this.roughTraced = roughTracer(this.posterPaths, this.thumb, this.width, this.height, this.simplification, getColor)
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
      return applyOpacity(this.backgroundColor, this.backgroundOpacity)
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
    display: inline-block;
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

      .color {
        display: inline-block;
        width: 25px;
        height: 25px;
        margin: 6px;
        border: 1px black solid;
      }
    }
  }
</style>
