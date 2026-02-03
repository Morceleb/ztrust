import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Layout from './views/Layout.vue'
import Settings from './views/Settings.vue'

const routes = [
    {
        path: '/', component: Layout,
        children: [
            { path: '/', component: Home },
            { path: '/settings', component: Settings }
        ]
    },
]

export default createRouter({
    history: createWebHistory(),
    routes
})
