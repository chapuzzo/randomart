<template>
    <div>
      <fieldset>
        <legend>image</legend>
        <label>
          <span class="input">select</span>
          <input @change="loadFile" hidden type="file">
        </label>
      </fieldset>
    </div>
</template>

<script>
import Jimp from 'jimp'

export default {
  name: 'ImageSelector',
  props: {
    startLoading: Function
  },
  methods: {
    loadFile (event) {
      if (this.startLoading) {
        this.startLoading()
      }

      const fileReader = new FileReader()
      fileReader.addEventListener('load', (e) => {
        Jimp.read(e.target.result)
          .then(loadedImage => {
            this.$emit('selected', loadedImage)
          })
      })
      fileReader.readAsDataURL(event.target.files[0])
    }
  }
}
</script>

<style scoped>

</style>
