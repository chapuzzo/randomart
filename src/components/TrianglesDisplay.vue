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
    generateTemplate (base) {
      const template = `
        <svg xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <pattern id="pattern" patternUnits="userSpaceOnUse" x="0" y="0" height="${this.height}" width="${this.width}">
            ${base}
          </pattern>
        </defs>
      </svg>`

      return this.createUrl(template)
    },

    createUrl (object, mime = 'image/svg+xml') {
      return window.URL.createObjectURL(new Blob([object], { type: mime }))
    }

  },
  computed: {
    triangles () {
      console.log('recalculated triangles')
      const triangles = Trianglify({
        width: this.width,
        height: this.height,
        cell_size: this.cellSize,
        seed: this.seed
        // x_colors: 'random'
      })

      let svg = triangles.svg()
      let innerHTML = svg.innerHTML

      this.$emit('updatedPattern', this.generateTemplate(innerHTML))
      return innerHTML
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
    margin: 20px auto;
    display: block;
  }
</style>
