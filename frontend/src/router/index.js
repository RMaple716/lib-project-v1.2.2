import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GlobalMessage from '../views/GlobalMessage.vue'

// 创建消息组件实例
const MessageComponent = Vue.extend(GlobalMessage)
const messageInstance = new MessageComponent().$mount()

// 添加到 body
document.body.appendChild(messageInstance.$el)

// 全局方法
Vue.prototype.$message = {
  success: (content, duration) => messageInstance.addMessage(content, 'success', duration),
  error: (content, duration) => messageInstance.addMessage(content, 'error', duration),
  warning: (content, duration) => messageInstance.addMessage(content, 'warning', duration),
  info: (content, duration) => messageInstance.addMessage(content, 'info', duration)
}

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
   // 添加的 manager 路由
  {
    path: '/manager',
    name: 'Manager',
    component: () => import('../views/manager.vue')
  },
  {
    path: 'readers',
    name: 'Readers',
    component: () => import('../views/readers.vue')
  },
  {
    path: '/manager2',
    name: 'Manager2',
    component: () => import('../views/manager2.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
