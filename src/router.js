import Vue from 'vue'
import Router from 'vue-router'
import Classic from './views/Classic.vue'
import New from './views/New.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/classic',
      name: 'classic',
      component: Classic
    },
    {
      path: '/new',
      name: 'new',
      component: New
    },
    {
      path: '*',
      redirect: 'classic'
    }
  ]
})
