<template>
  <div class="home">
    <div class="controls">
      <input v-model="cellSize" type="range" min="20" max="200" step="1">
      <input v-model="seed" type="text"/>
      <input type="button" @click="regenerateSeed" value="regen">
    </div>
    <TrianglesDisplay :cell-size="Number(cellSize)" :seed="seed"/>

    <div class="controls">
      <fieldset><legend>roughness</legend>
        <label>roughness
          <input v-model.number="roughness" type="range" min="0" max="12" step="0.5">
        </label>
        <label>bowing
          <input v-model.number="bowing" type="range" min="0" max="12" step="0.5">
        </label>
      </fieldset>
      <fieldset>
        <legend>border</legend>
        <label>color
          <input v-model="strokeColor" type="color">
        </label>
        <label>width
          <input v-model.number="strokeWidth" type="range" min="0" max="12" step="0.5">
        </label>

      </fieldset>
      <fieldset>
        <legend>fill</legend>
        <label>weight
          <input v-model.number="fillWeight" type="range" min="0" max="20" step="0.5">
        </label>
        <label>gap
          <input v-model.number="hachureGap" type="range" min="0" max="20" step="0.5">
        </label>
        <label>angle
          <input v-model.number="hachureAngle" type="range" min="0" max="360" step="0.5">
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
      :roughness="roughness"
      :bowing="bowing"
      :stroke-color="strokeColor"
      :stroke-width="strokeWidth"
      :fill-weight="fillWeight"
      :hachure-angle="hachureAngle"
      :hachure-gap="hachureGap"
      :fill-style="fillStyle"
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

</style>
