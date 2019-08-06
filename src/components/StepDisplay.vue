<template>
  <div class="step" v-if="src">
    <div
      :style="imageStyle"
      v-if="uri"
    >
      <img :src="src" alt="">
    </div>

    <div
      :style="imageStyle"
      v-else
      v-html="src"
    ></div>
    <span class="input" @click="download(src, uri)">↓ download</span>
  </div>
</template>

<script>
export default {
  name: 'StepDisplay',

  props: {
    src: String,
    download: Function,
    imageStyle: Object,
    uri: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss" scoped>
  .step {
    display: inline-block;
    margin: 15px;
  }

  .input, input[type="button"] {
    margin-top: 10px;
    display: block;
    border: 1px black solid;
    border-radius: 3px;
    padding: 5px;
    cursor: pointer;
    background-color: beige;
  }
</style>
