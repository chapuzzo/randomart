import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    loading: 0
  },
  mutations: {
    changeLoading (state, value) {
      state.loading += value
    }
  },
  actions: {
    enableLoader (context) {
      context.commit('changeLoading', 1)
    },
    disableLoader (context) {
      context.commit('changeLoading', -1)
    }
  }
})
