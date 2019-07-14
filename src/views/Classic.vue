<template>
  <div class="home">
    <div class="overlay" v-if="loading">
      <GridLoader size="20px"/>
    </div>
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
      @updated-pattern="updatedTrianglesPattern"
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
        <template v-if="fillStyle !== 'solid'">
          <label>weight
            <input max="20" min="0" step="0.5" type="range" v-model.number="fillWeight">
          </label>
          <label>gap
            <input max="20" min="0" step="0.5" type="range" v-model.number="hachureGap">
          </label>
          <label>angle
            <input max="360" min="0" step="0.5" type="range" v-model.number="hachureAngle">
          </label>
        </template>
      </fieldset>
    </div>
    <RoughDisplay
      :bowing="bowing"
      :fill-style="fillStyle"
      :fill-weight="fillWeight"
      :hachure-angle="hachureAngle"
      :hachure-gap="hachureGap"
      :height="height"
      :pattern="backgroundPatterns.triangle"
      :roughness="roughness"
      :stroke-color="strokeColor"
      :stroke-width="strokeWidth"
      :width="width"
      @updated-pattern="updatedRoughPattern"
    />
    <div class="controls">
      <fieldset>
        <legend>image</legend>
        <label>
          <span class="input">select</span>
          <input @change="loadFile" hidden type="file">
        </label>
        <label>background color
          <input type="color" v-model="backgroundColor">
        </label>
        <label>threshold
          <input max="255" min="0" type="range" v-model.number="threshold">
        </label>
        <label>fill
          <select v-model="backgroundPattern">
            <option :key="type"
                    :value="type"
                    v-for="(value, type) in backgroundPatterns"
            >
              {{type}}
            </option>
          </select>
        </label>
      </fieldset>
    </div>

    <CompositeImageDisplay
      :background="backgroundPatterns[backgroundPattern]"
      :background-color="backgroundColor"
      :image="image"
      :threshold="threshold"
      :width="width"
      :height="height"
    />

  </div>
</template>

<script>
import GridLoader from 'vue-spinner/src/GridLoader'
import TrianglesDisplay from '../components/TrianglesDisplay.vue'
import RoughDisplay from '../components/RoughDisplay.vue'
import CompositeImageDisplay from '../components/CompositeImageDisplay.vue'
import { getSeed } from '../utils'
import Jimp from 'jimp'
import { mapActions, mapState } from 'vuex'

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
      backgroundColor: '#ffffff',
      backgroundPattern: 'triangle',
      backgroundPatterns: {
        triangle: null,
        rough: null
      }
    }
  },
  components: {
    TrianglesDisplay,
    RoughDisplay,
    CompositeImageDisplay,
    GridLoader
  },

  computed: {
    ...mapState(['loading'])
  },

  methods: {
    ...mapActions(['enableLoader', 'disableLoader']),

    regenerateSeed () {
      this.seed = getSeed()
    },

    loadFile (event) {
      this.enableLoader()
      const fileReader = new FileReader()
      fileReader.addEventListener('load', (e) => {
        Jimp.read(e.target.result)
          .then(loadedImage => {
            const resizedImage = loadedImage.resize(Jimp.AUTO, 500)
            this.height = resizedImage.getHeight()
            this.width = resizedImage.getWidth()

            this.image = resizedImage
            this.disableLoader()
          })
      })
      fileReader.readAsDataURL(event.target.files[0])
    },

    updatedTrianglesPattern (payload) {
      this.backgroundPatterns.triangle = `${payload}#pattern`
    },

    updatedRoughPattern (payload) {
      this.backgroundPatterns.rough = `${payload}#pattern`
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "../style/loader";

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
