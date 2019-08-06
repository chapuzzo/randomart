<template>
  <div
    @click="download(src, true)"
    class="step"
    v-if="uri"
  >
    <img :src="src" alt="">
  </div>

  <div
    @click="download(src)"
    class="step"
    v-else
    v-html="src"
  ></div>
</template>

<script>
export default {
  name: 'StepDisplay',

  props: {
    src: String,
    download: Function,
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
</style>
