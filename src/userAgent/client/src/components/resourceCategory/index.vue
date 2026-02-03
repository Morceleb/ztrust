<!-- src/components/ResourceCategory.vue -->
<template>
    <section class="category">
        <h3 class="category-title">
            <i :class="['icon', `icon-${type}`]"></i>
            {{ title }} ({{ items.length }})
        </h3>

        <div class="resource-grid" :class="viewMode">
            <div v-for="item in items" :key="item.id" class="resource-card clickable" :class="viewMode" @click="handleCardClick(item)">
                <img :src="item.icon || defaultIcon" alt="icon" class="card-icon" @error="handleImageError($event)" />
                <div class="card-content">
                    <div class="card-name">{{ item.name }}</div>
                    <div class="card-method" :class="methodClass(item.allow_method)">
                        {{ item.allow_method }}
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
import { ref, computed } from 'vue'
import defaultIcon from '@/assets/vue.svg'

const props = defineProps({
    type: { type: String, required: true },
    title: { type: String, required: true },
    items: { type: Array, required: true },
    viewMode: { type: String, default: 'square' } // 'square' | 'horizontal'
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
const methodClass = (method) => method.toLowerCase()

// 判断是否 POST
const isPostMethod = (item) => item.allow_method === 'POST'

// 统一点击处理
const handleCardClick = (item) => {
    if (isPostMethod(item)) {
        // POST：打开模态框输入 body
        currentResource.value = item
        postBody.value = '{\n  \n}'
        showModal.value = true
    } else {
        // GET 或其他：直接访问
        directAccess(item.id)
    }
}

// 直接访问（GET）
const directAccess = (resourceId) => {
    window.open(`/api/auth/access/${resourceId}`, '_blank')
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

// 提交 POST 请求（通过代理 + fetch 携带 body）
const submitPost = async () => {
    if (jsonError.value) return

    const resourceId = currentResource.value.id
    const body = JSON.parse(postBody.value)

    try {
        const response = await fetch(`/api/auth/access/${resourceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        if (response.ok || response.redirected) {
            // 如果后端返回重定向或页面，浏览器会自动跳转
            window.open(`/api/auth/access/${resourceId}`, '_blank')
        } else {
            const text = await response.text()
            alert(`请求失败（${response.status}）：${text || '未知错误'}`)
        }
    } catch (err) {
        alert('网络错误：' + err.message)
    } finally {
        closeModal()
    }
}
</script>

<style scoped>
@import url(./style.css);
/* 保留你原来的样式文件 */
</style>