<template>
  <div class="home">
    <div class="controls">
      <input v-model="cellSize" type="range" min="20" max="200" step="1">
      <input v-model="seed" type="text"/>
      <input type="button" @click="regenerateSeed" value="regen">
    </div>
    <TrianglesDisplay :cell-size="Number(cellSize)" :seed="seed"/>

    <div class="controls">
      <input v-model="roughness" type="range" min="0" max="12" step="0.5">
      <input v-model="color" type="color">
    </div>
    <RoughDisplay :color="color" :roughness="Number(roughness)"/>
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
      cellSize: 20,
      color: '#ff0000',
      roughness: 1
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
    justify-content: flex-end;
  }
</style>
