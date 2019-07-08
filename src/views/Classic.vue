<template>
  <div class="home">
    <div class="controls">
      <fieldset>
        <legend>triangles</legend>
        <label>zoom
          <input max="200" min="20" step="1" type="range" v-model.number="cellSize">
        </label>
        <label>seed
          <input type="text" v-model="seed"/>
        </label>
        <label>
          <input @click="regenerateSeed" type="button" value="regen">
        </label>
      </fieldset>
    </div>
    <TrianglesDisplay
      :cell-size="cellSize"
      :height="height"
      :seed="seed"
      :width="width"
      @updatedPattern="updatedPattern('triangle', $event)"
    />
    <div class="controls">
      <fieldset>
        <legend>roughness</legend>
        <label>roughness
          <input max="12" min="0" step="0.5" type="range" v-model.number="roughness">
        </label>
        <label>bowing
          <input max="12" min="0" step="0.5" type="range" v-model.number="bowing">
        </label>
      </fieldset>
      <fieldset>
        <legend>border</legend>
        <label>color
          <input type="color" v-model="strokeColor">
        </label>
        <label>width
          <input max="12" min="0" step="0.5" type="range" v-model.number="strokeWidth">
        </label>
      </fieldset>
      <fieldset>
        <legend>fill</legend>
        <label>weight
          <input max="20" min="0" step="0.5" type="range" v-model.number="fillWeight">
        </label>
        <label>gap
          <input max="20" min="0" step="0.5" type="range" v-model.number="hachureGap">
        </label>
        <label>angle
          <input max="360" min="0" step="0.5" type="range" v-model.number="hachureAngle">
        </label>
        <label>style
          <select v-model="fillStyle">
            <option value="hachure">hachure</option>
            <option value="solid">solid</option>
            <option value="zigzag">zigzag</option>
            <option value="cross-hatch">cross-hatch</option>
            <option value="dots">dots</option>
            <option value="sunburst">sunburst</option>
            <option value="dashed">dashed</option>
            <option value="zigzag-line">zigzag-line</option>
          </select>
        </label>
      </fieldset>
    </div>
    <RoughDisplay
      :bowing="bowing"
      :fill-style="fillStyle"
      :fill-weight="fillWeight"
      :hachure-angle="hachureAngle"
      :hachure-gap="hachureGap"
      :height="height"
      :roughness="roughness"
      :stroke-color="strokeColor"
      :stroke-width="strokeWidth"
      :width="width"
      @updatedPattern="updatedPattern('rough', $event)"
      :pattern="backgroundPatterns.triangle"
    />
    <div class="controls">
      <fieldset>
        <legend>image</legend>
        <label>
          <span class="input">select</span>
          <input @change="loadFile" hidden type="file">
        </label>
        <label>threshold
          <input max="255" min="0" type="range" v-model.number="threshold">
        </label>
        <label>fill
          <select v-model="backgroundPattern">
            <option v-for="(value, type) in backgroundPatterns"
                    :value="value"
                    :key="type"
            >
              {{type}}
            </option>
          </select>
        </label>
      </fieldset>
    </div>

    <div id="result" v-html="svg"></div>
    <div><img id="image" :src="blobUrl" :alt="blobUrl"></div>
    <div class="controls">
      <input @click="downloadImage('#image')" type="button" v-if="svg" value="download">
    </div>

  </div>
</template>

<script>
import TrianglesDisplay from '../components/TrianglesDisplay.vue'
import RoughDisplay from '../components/RoughDisplay.vue'
import { getSeed } from '../utils'
import potrace from 'potrace'
import Jimp from 'jimp'

export default {
  name: 'home',
  data () {
    return {
      seed: getSeed(),
      bowing: 1,
      cellSize: 20,
      strokeColor: '#ff0000',
      roughness: 2,
      strokeWidth: 1,
      fillWeight: 2,
      hachureAngle: 45,
      hachureGap: 5,
      fillStyle: 'hachure',
      width: 200,
      height: 200,
      threshold: 120,
      blobUrl: null,
      image: null,
      svg: null,
      backgroundPattern: 'stockTriangles',
      backgroundPatterns: {
        stockTriangles: '#trianglesPattern',
        stockRough: '#roughPattern'
      }
    }
  },
  components: {
    TrianglesDisplay,
    RoughDisplay
  },

  computed: {
    background () {
      return this.backgroundPatterns[this.backgroundPattern]
    }
  },

  methods: {
    regenerateSeed () {
      this.seed = getSeed()
    },

    createUrl (object, mime = 'image/svg+xml') {
      return window.URL.createObjectURL(new Blob([object], { type: mime }))
    },

    loadFile (event) {
      const fileReader = new FileReader()
      fileReader.addEventListener('load', (e) => {
        Jimp.read(e.target.result)
          .then(loadedImage => {
            const resizedImage = loadedImage.resize(Jimp.AUTO, 500)
            this.height = resizedImage.getHeight()
            this.width = resizedImage.getWidth()

            this.image = resizedImage
          })
      })
      fileReader.readAsDataURL(event.target.files[0])
    },

    updatedPattern (type, value) {
      console.log({ type, value })
      this.backgroundPatterns[type] = `${value}#pattern`
    },

    trace () {
      if (!this.image) {
        return null
      }

      potrace.posterize(this.image, {
        background: `url(${this.background})`,
        color: 'black',
        threshold: this.threshold
      }, (err, svg) => {
        if (err) {
          console.error(err)
          return
        }
        this.blobUrl = this.createUrl(svg)
        this.svg = svg
      })
    },

    downloadImage (selector) {
      const extracted = (image) => {
        console.log('loaded image')
        const canvas = document.createElement('canvas')
        canvas.setAttribute('width', this.width)
        canvas.setAttribute('height', this.height)
        console.log('set image attrs')

        const context = canvas.getContext('2d')

        context.drawImage(image, 0, 0)
        console.log('drawn in canvas')

        const a = document.createElement('a')
        a.download = 'generated_image.png'
        a.href = canvas.toDataURL('image/png')
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        console.log('scheduled download')
      }

      if (!selector) {
        const image = new Image()
        console.log(image)
        image.src = this.blobUrl

        image.addEventListener('load', () => {
          extracted(image)
        })
        return
      }

      const image = document.querySelector(selector)
      extracted(image)
    }
  },
  watch: {
    backgroundPattern (newValue, oldValue) {
      if (newValue === oldValue) {
        return
      }

      this.trace()
    },

    threshold (newValue, oldValue) {
      if (newValue === oldValue) {
        return
      }

      this.trace()
    },
    image (newValue) {
      if (!newValue) {
        return
      }

      this.trace()
    }
  }
}
</script>

<style lang="scss" scoped>
  .controls {
    margin-left: auto;
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-end;

    > input, fieldset {
      width: 25%;

      label {
        display: flex;
        justify-content: flex-end;

        > input[type="color"] {
          margin-left: 6px;
        }
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
  }
</style>
