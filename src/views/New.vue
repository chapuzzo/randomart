<template>
  <div class="editor">
    <div class="overlay" v-if="loading">
      <GridLoader size="20px"/>
      <span v-if="loadingMessage" class="message">{{loadingMessage}}</span>
    </div>
    <ImageSelector :startLoading="enableLoader" @selected="changedImage"/>
    <label>simplification
      <input max="200" min="-100" type="range" v-model.number="simplification">
    </label>

    <img :src="thumb" alt="">
    <div style="display: inline;" v-html="posterizedThumb" v-if="posterizedThumb"></div>
    <div style="display: inline;" v-html="triangles" v-if="triangles"></div>
    <div style="display: inline;" v-html="merged" v-if="merged"></div>
    <div style="display: inline;" v-html="traced" v-if="traced"></div>
  </div>
</template>

<script>
import ImageSelector from '../components/ImageSelector'
import Jimp from 'jimp'
import potrace from 'potrace'
import Trianglify from 'trianglify'
import rough from 'roughjs/bin/wrappers/rough'
import GridLoader from 'vue-spinner/src/GridLoader'
import { mapActions, mapState } from 'vuex'

const createThumb = (image, maxSize = 150) => {
  let newDimensions = [maxSize, Jimp.AUTO]

  if (image.getWidth() < image.getHeight()) {
    newDimensions.reverse()
  }

  return image.resize(...newDimensions)
}

const posterize = (image) => {
  const posterizer = new potrace.Posterizer()
  return new Promise((resolve, reject) => {
    posterizer.loadImage(image, error => {
      if (error) {
        reject(error)
      }

      resolve(posterizer.getSVG())
    })
  })
}

export default {
  name: 'Editor',
  data () {
    return {
      image: null,
      thumb: null,
      posterizedThumb: null,
      triangles: null,
      simplification: 1,
      loadingMessage: '',
      trianglePaths: null,
      posterPaths: null
    }
  },
  methods: {
    ...mapActions(['enableLoader', 'disableLoader']),

    async changedImage (image) {
      this.enableLoader()
      this.image = image

      this.loadingMessage = 'creating thumb'
      let thumb = createThumb(image)
      this.height = thumb.getHeight()
      this.width = thumb.getWidth()

      this.thumb = await thumb.getBase64Async('image/png')

      this.loadingMessage = 'creating posterized thumb'
      this.posterizedThumb = await posterize(thumb)

      this.loadingMessage = 'creating triangles pattern'
      const triangles = Trianglify({
        height: this.height,
        width: this.width
      }).svg()

      this.triangles = triangles.outerHTML

      this.loadingMessage = 'merging triangles with posterized'
      const domParser = new DOMParser()
      const posterizedThumb = domParser.parseFromString(this.posterizedThumb, 'image/svg+xml')

      this.loadingMessage = 'extracting paths from triangles'
      this.trianglePaths = Array.from(triangles.querySelectorAll('path'))

      this.loadingMessage = 'extracting paths from posterized'
      this.posterPaths = Array.from(posterizedThumb.querySelectorAll('path'))

      this.disableLoader()
    }
  },
  computed: {
    ...mapState(['loading']),

    merged () {
      if (!this.trianglePaths || !this.posterPaths) {
        return null
      }

      const merged = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      merged.setAttribute('width', this.width)
      merged.setAttribute('height', this.height)

      this.trianglePaths.forEach(path => {
        merged.appendChild(path)
      })

      this.posterPaths.forEach(path => {
        merged.appendChild(path)
      })

      return merged.outerHTML
    },

    traced () {
      if (!this.posterPaths) {
        return null
      }

      const traced = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      traced.setAttribute('width', this.width)
      traced.setAttribute('height', this.height)

      const rc = rough.svg(traced)
      // const roughPosterPaths = posterPaths.map(path => rc.path(path.getAttribute('d'), {
      //   simplification: this.simplification
      // }))
      //
      // roughPosterPaths.forEach(path => {
      //   traced.appendChild(path)
      // })
      //
      this.posterPaths.forEach(originalPath => {
        const path = rc.path(originalPath.getAttribute('d'), {
          simplification: this.simplification
        })
        console.log({ path, originalPath })
        traced.appendChild(path)
      })

      return traced.outerHTML
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
</style>
