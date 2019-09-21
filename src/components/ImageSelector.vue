<template>
  <div>
    <fieldset>
      <legend>image</legend>
      <label>
        <span class="input">select</span>
        <input @change="loadFile" hidden type="file">
      </label>

      <label style="display: block; margin-top: 15px">url
        <input  type="text" @change="loadURL($event.target.value)">
      </label>

    </fieldset>
  </div>
</template>

<script>
import Jimp from 'jimp'

export default {
  name: 'ImageSelector',
  props: {
    withLoader: Function
  },
  methods: {
    async loadFile (event) {
      const loaded = await this.withLoader(async () => {
        return new Promise((resolve, reject) => {
          const fileReader = new FileReader()
          fileReader.addEventListener('load', (e) => {
            Jimp.read(e.target.result)
              .then(loadedImage => {
                resolve(loadedImage)
              })
              .catch(error => reject(error))
          })

          fileReader.readAsDataURL(event.target.files[0])
        })
      }, 'reading image')

      this.$emit('selected', loaded)
    },

    async loadURL (source) {
      if (!source.length) {
        return
      }

      const loaded = await this.withLoader(async () => {
        return new Promise((resolve, reject) => {
          Jimp.read(source)
            .then(loadedImage => {
              resolve(loadedImage)
            })
            .catch(error => reject(error))
        })
      }, 'reading image')

      this.$emit('selected', loaded)
    }
  }
}
</script>

<style lang="scss" scoped>
  .input, input[type="button"] {
    display: inline-block;
    min-width: 110px;
    margin: {
      left: auto;
      right: auto;
    };
    border: 1px black solid;
    border-radius: 3px;
    padding: 5px;
    cursor: pointer;
    background-color: beige;
  }
</style>
