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
    </fieldset>

    <div class="steps">
      <div :style="stepStyle" class="step" v-if="thumbURI"><img :src="thumbURI" alt=""></div>
      <div :style="stepStyle" class="step" v-html="posterizedThumb" v-if="posterizedThumb"></div>
      <div :style="stepStyle" class="step" v-html="triangles" v-if="triangles"></div>
      <div :style="stepStyle" class="step" v-html="merged" v-if="merged"></div>
  <!--    <img v-if="merged" :src="createURL" alt="">-->
      <div :style="stepStyle" class="step" v-html="traced" v-if="traced"></div>
    </div>

  </div>
</template>

<script>
import ImageSelector from '../components/ImageSelector'
import Jimp from 'jimp'
import { Posterizer } from 'potrace'
import Trianglify from 'trianglify'
import rough from 'roughjs/bin/wrappers/rough'
import GridLoader from 'vue-spinner/src/GridLoader'
import { mapActions, mapState } from 'vuex'

const createThumb = (image, maxSize = 200) => {
  let newDimensions = [maxSize, Jimp.AUTO]

  if (image.getWidth() < image.getHeight()) {
    newDimensions.reverse()
  }

  return image.resize(...newDimensions)
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
  }).svg()
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
      simplification: 1,
      threshold: -1,
      maxSize: 200,
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

    simplification () {
      if (!this.posterPaths) {
        return
      }

      this.$emit('changed-simplification')
    }
  },

  mounted () {
    this.$on('changed-image', this.createTriangles)
    this.$on('created-triangles', this.posterizeThumb)
    this.$on('posterized-thumb', this.extractPosterPaths)
    this.$on('extracted-poster-paths', this.mergePaths)
    this.$on('merged-paths', this.tracePosterPaths)

    this.$on('changed-threshold', this.posterizeThumb)
    this.$on('changed-simplification', this.tracePosterPaths)
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
    }

  },
  computed: {
    ...mapState(['loading']),

    stepStyle () {
      return {
        maxHeight: `${this.maxSize}px`,
        maxWidth: `${this.maxSize}px`
      }
    }
  },
  components: {
    ImageSelector,
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

    .step {
      display: inline;
      margin: 15px auto;
    }
  }

</style>
