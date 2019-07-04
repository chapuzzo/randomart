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
      :roughness="roughness"
      :stroke-color="strokeColor"
      :stroke-width="strokeWidth"
    />
  </div>
</template>

<script>
import TrianglesDisplay from '../components/TrianglesDisplay.vue'
import RoughDisplay from '../components/RoughDisplay.vue'
import { getSeed } from '../utils'

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
      fillStyle: 'hachure'
    }
  },
  components: {
    TrianglesDisplay,
    RoughDisplay
  },
  methods: {
    regenerateSeed () {
      this.seed = getSeed()
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

      .input, input[type="button"] {
        display: block;
        border: 1px black solid;
        border-radius: 3px;
        padding: 5px;
        cursor: pointer;
        background-color: beige;
      }
    }
  }
</style>
