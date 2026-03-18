import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Layout from './views/Layout.vue'
import Settings from './views/Settings.vue'
import DownloadClientNew from './views/DownloadClientNew.vue'
import PersonalInfo from './views/PersonalInfo.vue'
import TerminalManagerment from './views/TerminalManagerment.vue'
import ApplyPermission from './views/ApplyPermission.vue'
import Login from './views/Login.vue'

const routes = [
    {
        path: '/login',
        component: Login,
    },
    {
        path: '/', component: Layout,
        children: [
            { path: '/', component: Home },
            { path: '/settings', component: Settings },
            { path: '/personal_info', component: PersonalInfo },
            { path: '/terminal_management', component: TerminalManagerment },
            { path: '/apply_permission', component: ApplyPermission },
        ]
    },
    {
        path: '/down_client_new',
        component: DownloadClientNew,
    },
]

export default createRouter({
    history: createWebHistory(),
    routes
})
