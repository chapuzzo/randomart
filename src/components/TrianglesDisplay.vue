<template>
  <div class="content">
    <svg>
      <defs>
        <pattern id="pattern" patternUnits="userSpaceOnUse" x="0" y="0" :height="height" :width="width">
          <g v-html="triangles"></g>
        </pattern>
        <symbol id="symbol">
          <rect x="0" y="0" width="100" height="100" fill="url(#pattern)"></rect>
        </symbol>
      </defs>
      <use href="#symbol"></use>
    </svg>

  </div>
</template>

<script>
import Trianglify from 'trianglify'

export default {
  name: 'TrianglesDisplay',
  data () {
    return {
      width: 200,
      height: 200
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
    seed: String
  }
}
</script>

<style lang="scss" scoped>
  svg {
    margin: 20px auto;
    display: block;
    width: 200px;
    height: 200px;
  }
</style>
