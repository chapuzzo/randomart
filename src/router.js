import Vue from 'vue'
import Router from 'vue-router'
import Classic from './views/Classic.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/classic',
      name: 'classic',
      component: Classic
    }
  ]
})
