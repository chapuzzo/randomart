<template>
  <div class="content">
    <svg>
      <defs>
        <pattern id="trianglesPattern" patternUnits="userSpaceOnUse" x="0" y="0" :height="height" :width="width">
          <g v-html="triangles"></g>
        </pattern>
        <symbol id="trianglesSymbol">
          <rect x="0" y="0" :height="height" :width="width" fill="url(#trianglesPattern)"></rect>
        </symbol>
      </defs>
      <use href="#trianglesSymbol"></use>
    </svg>
  </div>
</template>

<script>
import Trianglify from 'trianglify'

export default {
  name: 'TrianglesDisplay',
  data () {
    return {
    }
  },
  methods: {
    generateUrl: function (svg) {
      const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
          <defs>
            <pattern id="xxx" patternUnits="userSpaceOnUse" x="0" y="0" width="500" height="500">
                ${svg.innerHTML}
            </pattern>
          </defs>
        </svg>`], { type: 'image/svg+xml' })

      return URL.createObjectURL(blob)
    }
  },
  computed: {
    triangles () {
      const triangles = Trianglify({
        width: this.width,
        height: this.height,
        cell_size: this.cellSize,
        seed: this.seed
        // x_colors: 'random'
      })

      let svg = triangles.svg()

      return svg.innerHTML
    }
  },
  props: {
    cellSize: Number,
    seed: String,
    width: Number,
    height: Number
  }
}
</script>

<style lang="scss" scoped>
  svg {
    width: 200px;
    height: 200px;
  }
</style>
