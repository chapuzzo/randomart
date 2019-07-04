<template>
  <div id="app">
    <div id="nav" hidden>
      <router-link to="/">Home</router-link>
      |
      <router-link to="/about">About</router-link>
    </div>
    <router-view/>
  </div>
</template>

<style lang="scss">
  body {
    background-color: ghostwhite;
  }

  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    max-width: 1000px;
    margin: 0 auto;
    padding: 15px;
    border: 1px gray dashed;
  }

  #nav {
    padding: 30px;

    a {
      font-weight: bold;
      color: #2c3e50;

      &.router-link-exact-active {
        color: #42b983;
      }
    }
  }

  .controls {
    margin-left: auto;
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-end;
    >input, fieldset {
      width: 25%;
      label {
        display: flex;
        justify-content: flex-end;
        > input[type="color"] {
          margin-left:  6px;
        }
      }
    }
  }
</style>
