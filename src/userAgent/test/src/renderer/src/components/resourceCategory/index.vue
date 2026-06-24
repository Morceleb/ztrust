<!-- src/components/ResourceCategory.vue -->
<template>
    <section class="category">
        <h3 class="category-title">
            <i :class="['icon', `icon-${type}`]"></i>
            {{ title }} ({{ items.length }})
        </h3>

        <div class="resource-grid" :class="viewMode">
            <div v-for="item in items" :key="item.id" class="resource-card clickable" :class="viewMode"
                @click="handleCardClick(item)">
                <img :src="item.icon || defaultIcon" alt="icon" class="card-icon" @error="handleImageError($event)" />
                <div class="card-content">
                    <div class="card-name">{{ item.name }}</div>
                    <div class="card-method" :class="methodClass(item.allowMethod || item.allow_method)">
                        {{ item.allowMethod || item.allow_method }}
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- POST 请求体输入模态框 -->
    <teleport to="body">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>发送 POST 请求</h3>
                    <button class="close-btn" @click="closeModal">×</button>
                </div>
                <div class="modal-body">
                    <p class="resource-name">{{ currentResource?.name }}</p>
                    <textarea v-model="postBody" placeholder='请输入 JSON 格式的请求体，例如：\n{\n  "key": "value"\n}'
                        class="json-textarea" spellcheck="false"></textarea>
                    <div v-if="jsonError" class="error-tip">{{ jsonError }}</div>
                </div>
                <div class="modal-footer">
                    <button @click="closeModal" class="btn btn-cancel">取消</button>
                    <button @click="submitPost" class="btn btn-primary" :disabled="!!jsonError">
                        确认发送
                    </button>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

import './index.css'

import defaultIcon from '@/assets/vue.svg'

import request from '../../utils/request'

const props = defineProps({
    type: { type: String, required: true },
    title: { type: String, required: true },
    items: { type: Array, required: true },
    viewMode: { type: String, default: 'square' } // 'square' | 'horizontal'
})

onMounted(() => {
    console.log('[ResourceCategory] onMounted, items:', props.items)
})

// 模态框状态
const showModal = ref(false)
const currentResource = ref(null)
const postBody = ref('{\n  \n}')

// 图片错误 fallback
const handleImageError = (e) => {
    e.target.src = defaultIcon
}

// 方法标签类名
const methodClass = (method) => {
    const m = (method || '').toString().toLowerCase()
    return m
}

// 判断是否 POST
const isPostMethod = (item) => {
    const m = item.allowMethod || item.allow_method
    return m != null && m.toString().toUpperCase() === 'POST'
}

// 统一点击处理
const handleCardClick = (item) => {
    if (isPostMethod(item)) {
        // POST：打开模态框输入 body
        currentResource.value = item
        postBody.value = '{\n  \n}'
        showModal.value = true
    } else {
        // GET 或其他：直接在新窗口中访问
        directAccess(item.resourceId, item.name)
    }
}

// 获取认证 token
const getAuthToken = () => {
    return sessionStorage.getItem('auth_token') || ''
}

// 直接访问（GET）- 在 Tauri 新窗口中打开
const openResourceWindow = async (resourceId, resourceName) => {
    let baseUrl = localStorage.getItem('companyAddress') || ''
    if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'http://' + baseUrl
    }
    const targetUrl = `${baseUrl}/auth/access/${resourceId}`

    const invokeParams = { resourceId: resourceId, title: resourceName || '资源访问', baseUrl }

    try {
        await window.__TAURI__.core.invoke('open_resource_window', invokeParams)
    } catch (err) {
        console.error('打开窗口失败:', err)
        window.open(targetUrl, '_blank')
    }
}

const directAccess = (resourceId, resourceName) => {
    openResourceWindow(resourceId, resourceName)
}

// 关闭模态框
const closeModal = () => {
    showModal.value = false
    currentResource.value = null
    postBody.value = '{\n  \n}'
}

// 实时 JSON 校验
const jsonError = computed(() => {
    const text = postBody.value.trim()
    if (!text) return '请求体不能为空'
    try {
        JSON.parse(text)
        return null
    } catch (err) {
        return 'JSON 格式错误：' + err.message
    }
})

// 提交 POST 请求
const submitPost = async () => {
    if (jsonError.value) return

    const resourceId = currentResource.value.resourceId
    const body = JSON.parse(postBody.value)

    try {
        // 使用封装后的 request（axios）
        const response = await request.post(`/auth/access/${resourceId}`, body)
        console.log('请求成功：', response.data)
        openResourceWindow(resourceId, currentResource.value.name || '资源访问')
    } catch (error) {
        const status = error.response?.status || '未知'
        const message = error.response?.data?.message
            || error.response?.data
            || error.message

        alert(`请求失败（${status}）：${message}`)
    } finally {
        closeModal()
    }
}
</script>