import { createRouter, createWebHistory } from 'vue-router'
import VotingApp from '../views/VotingApp.vue'
import App from '../App.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: App,
  },
  {
    path: '/voting',
    name: 'Voting',
    component: VotingApp,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
