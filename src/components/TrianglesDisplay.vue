<template>
  <div class="content">
    <svg v-html="triangles"></svg>
  </div>
</template>

<script>
import Trianglify from 'trianglify'

export default {
  name: 'SVGDisplay',
  data () {
    return {}
  },

  computed: {
    triangles () {
      const triangles = Trianglify({
        cell_size: this.cellSize,
        seed: this.seed
        // x_colors: 'random'
      })

      return triangles.svg().innerHTML
    }
  },
  props: {
    cellSize: Number,
    seed: String
  }
}
</script>

<style lang="scss" scoped>
  svg {
    display: block;
    width: 200px;
    height: 200px;
  }
</style>
