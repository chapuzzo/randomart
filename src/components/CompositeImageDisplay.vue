<template>
  <div>
    <template v-if="blobUrl">
      <img :src="blobUrl" alt="" ref='image' :style="{backgroundColor}"/>
      <div class="controls">
        <input @click="downloadImage" type="button" value="download">
      </div>
    </template>

    <div class="error" v-if="error">An error ocurred:<br>{{error}}</div>

  </div>
</template>

<script>
import potrace from 'potrace'
import { createUrl } from '../utils'
import pify from 'pify'
import _ from 'lodash'
import { saveAs } from 'file-saver'
import { mapActions } from 'vuex'

export default {
  name: 'CompositeImageDisplay',

  data () {
    return {
      blobUrl: null,
      error: null
    }
  },

  methods: {
    ...mapActions(['enableLoader', 'disableLoader']),

    trace: _.throttle(function (reason) {
      console.log(`tracing on request by ${reason}`)

      if (!this.image) {
        return null
      }
      this.enableLoader()

      pify(potrace.posterize)(this.image, {
        background: `url(${this.background})`,
        color: 'black',
        threshold: this.threshold
      })
        .then(svg => {
          this.blobUrl = createUrl(svg)
          this.disableLoader()
        })
        .catch(error => {
          this.error = error
          this.disableLoader()
        })
    }, 500),

    downloadImage () {
      const canvas = document.createElement('canvas')
      canvas.setAttribute('height', this.height)
      canvas.setAttribute('width', this.width)

      const context = canvas.getContext('2d')

      context.fillStyle = this.backgroundColor
      context.fillRect(0, 0, this.width, this.height)

      context.drawImage(this.$refs.image, 0, 0)

      canvas.toBlob(blob => saveAs(blob, 'xxx'))
    }
  },

  watch: {
    image () {
      this.trace('image')
    },

    background () {
      this.trace('background')
    },

    threshold () {
      this.trace('threshold')
    }
  },

  props: {
    image: Object,
    background: String,
    backgroundColor: String,
    threshold: Number,
    width: Number,
    height: Number
  }
}
</script>
