import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    loading: false
  },
  mutations: {
    changeLoading (state, value) {
      state.loading = Boolean(value)
    }
  },
  actions: {
    enableLoader (context) {
      context.commit('changeLoading', true)
    },
    disableLoader (context) {
      context.commit('changeLoading', false)
    }
  }
})
