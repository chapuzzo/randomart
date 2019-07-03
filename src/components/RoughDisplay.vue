<template>
  <div class="content">
    <svg v-html="svg"></svg>
  </div>
</template>

<script>
import rough from 'roughjs/bin/wrappers/rough'

export default {
  name: 'RoughDisplay',
  data () {
    return {}
  },

  mounted () { console.log(rough) },

  computed: {
    svg () {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const rc = rough.svg(svgElement, {
        options: {
          roughness: this.roughness
        }
      })
      const rectangle = rc.rectangle(10, 10, 180, 180, { fill: this.color })
      svgElement.appendChild(rectangle)

      return svgElement.innerHTML
    }
  },

  props: {
    roughness: Number,
    color: String
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
