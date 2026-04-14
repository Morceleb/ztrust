<template>
    <div>
        <p v-if="flag" style="color: green; margin-top: 20px;">
            登录成功！当前用户：{{ info.user || info.message || '未知用户' }}
        </p>
        <button v-if="flag" @click="testAuth" style="margin-top: 20px;">测试认证接口</button>
        <button v-if="flag" @click="handleAccess(1)" style="margin-top: 20px;">访问资源1</button>
        <button v-if="flag" @click="handleAccess(2)" style="margin-top: 20px;">访问资源2</button>
        <button v-if="flag" @click="handleAccess(3)" style="margin-top: 20px;">访问资源3</button>
        <p v-if="errorMsg" style="color: red; margin-top: 20px;">
            登录失败：{{ errorMsg }}
        </p>
        <resourceList :resources="data.resources"></resourceList>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

import resourceList from '../components/resourceList.vue'

import data from '@/assets/resource-list.json'

const username = ref('')
const password = ref('')
const info = ref({})
const flag = ref(false)
const loading = ref(false)
const errorMsg = ref('')



const handleLogin = async () => {
    // 清空之前的状态
    flag.value = false
    errorMsg.value = ''
    info.value = {}
    loading.value = true

    try {
        const response = await axios.post('/api/auth/login', {
            username: username.value,
            password: password.value
        })  // Axios 自动处理 JSON、headers、withCredentials

        const res = response.data  // Axios 直接返回 data

        console.log('登录响应:', res)

        if (res.success && res.code === '0') {
            flag.value = true
            info.value = res.data || { message: '登录成功' }

            // 清空表单
            username.value = ''
            password.value = ''
        } else {
            errorMsg.value = res.message || '登录失败，请检查用户名或密码'
        }
    } catch (error) {
        console.error('登录请求失败:', error)
        errorMsg.value = error.response?.data?.message || '网络错误，无法连接到服务器'
    } finally {
        loading.value = false
    }
}

const testAuth = async () => {
    try {
        const response = await axios.get('/api/test')
        const data = response.data

        console.log('认证测试结果:', data)
        if (!data.success) throw new Error('认证失败')

        alert('认证通过！用户信息：' + JSON.stringify(data.user))
    } catch (err) {
        alert('认证失败，可能未登录或 token 过期')
    }
}


</script>

<style scoped>
input {
    padding: 8px;
    width: 200px;
    font-size: 16px;
}

button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>