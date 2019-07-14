<template>
  <div class="content">
    <svg>
      <defs>
        <pattern id="roughPattern" patternUnits="userSpaceOnUse" x="0" y="0" :height="height" :width="width">
          <g v-html="svg"></g>
        </pattern>
        <symbol id="roughSymbol">
          <rect x="0" y="0" :height="height" :width="width" fill="url(#roughPattern)"></rect>
        </symbol>
      </defs>
      <use href="#roughSymbol"></use>
    </svg>
  </div>
</template>

<script>
import rough from 'roughjs/bin/wrappers/rough'

export default {
  name: 'RoughDisplay',
  data () {
    return {}
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
    svg () {
      let namespaceURI = 'http://www.w3.org/2000/svg'
      const svgElement = document.createElementNS(namespaceURI, 'svg')
      const rc = rough.svg(svgElement, {
        options: {
          roughness: this.roughness,
          bowing: this.bowing
        }
      })
      const rectangle = rc.rectangle(5, 5, this.width - 10, this.height - 10, {
        fill: `url(${this.pattern})`,
        fillStyle: this.fillStyle,
        stroke: this.strokeColor,
        strokeWidth: this.strokeWidth,
        fillWeight: this.fillWeight,
        hachureAngle: this.hachureAngle,
        hachureGap: this.hachureGap
      })
      svgElement.appendChild(rectangle)

      let innerHTML = svgElement.innerHTML

      this.$emit('updated-pattern', this.generateTemplate(innerHTML))
      return innerHTML
    }
  },

  props: {
    pattern: String,

    roughness: Number,
    bowing: Number,

    strokeColor: String,
    strokeWidth: Number,

    fillWeight: Number,
    hachureAngle: Number,
    hachureGap: Number,
    fillStyle: String,
    width: { type: Number, default: 200 },
    height: { type: Number, default: 200 }
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
