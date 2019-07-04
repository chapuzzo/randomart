<template>
  <div class="content">
    <svg class="rough" v-html="svg"></svg>
  </div>
</template>

<script>
import rough from 'roughjs/bin/wrappers/rough'

export default {
  name: 'RoughDisplay',
  data () {
    return {}
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
      const rectangle = rc.rectangle(10, 10, 180, 180, {
        fill: `url(#pattern)`,
        fillStyle: this.fillStyle,
        stroke: this.strokeColor,
        strokeWidth: this.strokeWidth,
        fillWeight: this.fillWeight,
        hachureAngle: this.hachureAngle,
        hachureGap: this.hachureGap
      })
      svgElement.appendChild(rectangle)

      return svgElement.innerHTML
    }
  },

  props: {
    roughness: Number,
    bowing: Number,

    strokeColor: String,
    strokeWidth: Number,

    fillWeight: Number,
    hachureAngle: Number,
    hachureGap: Number,
    fillStyle: String
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
