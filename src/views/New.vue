<template>
  <div class="editor">
    <div class="overlay" v-if="loading">
      <GridLoader size="20px"/>
    </div>
    <ImageSelector :startLoading="() => {this.loading = true}" @selected="changedImage"/>
    <label>simplification
      <input max="200" min="-100" type="range" v-model.number="simplification">
    </label>

    <img :src="thumb" alt="">
    <!--    <img :src="thumbBlob" alt="">-->
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

// const createUrl = (object, mime = 'image/svg+xml') =>
//   window.URL.createObjectURL(new Blob([object], { type: mime }))

export default {
  name: 'Editor',
  data () {
    return {
      image: null,
      thumb: null,
      posterizedThumb: null,
      // thumbBlob: null,
      triangles: null,
      merged: null,
      simplification: 1,
      loading: false,
      posterPaths: []
    }
  },
  methods: {
    async changedImage (image) {
      this.loading = true
      this.image = image

      let thumb = createThumb(image)
      this.height = thumb.getHeight()
      this.width = thumb.getWidth()

      this.thumb = await thumb.getBase64Async('image/png')
      // this.thumbBlob = createUrl(await thumb.getBufferAsync('image/jpeg'))

      this.posterizedThumb = await posterize(thumb)

      const triangles = Trianglify({
        height: this.height,
        width: this.width
      }).svg()

      this.triangles = triangles.outerHTML

      const domParser = new DOMParser()
      const posterizedThumb = domParser.parseFromString(this.posterizedThumb, 'image/svg+xml')

      const trianglePaths = Array.from(triangles.querySelectorAll('path'))
      this.posterPaths = Array.from(posterizedThumb.querySelectorAll('path'))

      const merged = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      merged.setAttribute('width', this.width)
      merged.setAttribute('height', this.height)

      trianglePaths.forEach(path => {
        merged.appendChild(path)
      })
      this.posterPaths.forEach(path => {
        merged.appendChild(path)
      })

      this.merged = merged.outerHTML

      this.loading = false
    }
  },
  computed: {
    traced () {
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

<style lang="scss">
  .overlay {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(128, 128, 128, 0.5);

    .v-spinner {
      margin-top: 50%;
      margin-left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .input, input[type="button"] {
    display: block;
    border: 1px black solid;
    border-radius: 3px;
    padding: 5px;
    cursor: pointer;
    background-color: beige;
  }
</style>
