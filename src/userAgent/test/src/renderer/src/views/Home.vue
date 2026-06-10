<template>
    <main class="home-container">
        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-banner">
            <span>{{ errorMessage }}</span>
            <button @click="retry">重试</button>
        </div>

        <resourceList :resources="resources"></resourceList>

    </main>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';

import request from '@/utils/request'

import resourceList from '../components/resourceList.vue'

const resources = ref([])
const errorMessage = ref('')

// 检测环境
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

const fetchResources = async () => {
    errorMessage.value = '';

    // 检查是否有 API 服务器配置
    const baseURL = localStorage.getItem('companyAddress') || import.meta.env.VITE_API_BASE_URL;

    if (!baseURL) {
        console.log('[Home] 未配置 API 服务器，跳过资源加载');
        resources.value = [];
        return;
    }

    try {
        const response = await request.get('/auth/access/resources')
        console.log('[Home] 原始响应:', response)
        console.log('[Home] response.data:', response.data)
        console.log('[Home] response.data.data:', response.data?.data)
        resources.value = response.data?.data || []
        console.log('[Home] 最终 resources:', resources.value)
    } catch (error) {
        console.error('[Home] 请求失败:', {
            message: error.message,
            status: error.response?.status,
            isTauri: isTauri
        });

        // 根据错误类型显示友好的错误信息
        if (!error.response) {
            errorMessage.value = `无法连接到服务器。请检查公司地址配置是否正确。${isTauri ? '(Tauri环境)' : ''}`;
        } else {
            errorMessage.value = `加载资源失败: ${error.response?.data?.message || error.message}`;
        }
        resources.value = [];
    }
};

const retry = () => {
    fetchResources();
};

onBeforeMount(async () => {
    console.log('[Home] 组件挂载前，环境:', isTauri ? 'Tauri' : 'Browser');
    console.log('[Home] baseURL:', localStorage.getItem('companyAddress') || import.meta.env.VITE_API_BASE_URL);
    await fetchResources();
})


</script>

<style scoped>
.home-container {
    width: 100%;
    height: 100%;
    padding: 35px 0 0 40px;
}

.error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 16px;
    color: #dc2626;
    font-size: 14px;
}

.error-banner button {
    background: #dc2626;
    color: white;
    border: none;
    padding: 6px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
}

.error-banner button:hover {
    background: #b91c1c;
}
</style>