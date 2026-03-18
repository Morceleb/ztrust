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
                    <div class="card-method" :class="methodClass(item.allow_method)">
                        {{ item.allow_method }}
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- POST 请求模态框-->
    <teleport to="body">
        <div v-if="showPostModal" class="modal-overlay" @click.self="closePostModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>发送 POST 请求</h3>
                    <button class="close-btn" @click="closePostModal">×</button>
                </div>
                <div class="modal-body">
                    <p class="resource-name">{{ currentResource?.name }}</p>
                    <textarea v-model="postBody" placeholder='请输入 JSON 格式的请求体，例如：\n{\n  "key": "value"\n}'
                        class="json-textarea" spellcheck="false"></textarea>
                    <div v-if="jsonError" class="error-tip">{{ jsonError }}</div>
                </div>
                <div class="modal-footer">
                    <button @click="closePostModal" class="btn btn-cancel">取消</button>
                    <button @click="submitPost" class="btn btn-primary" :disabled="!!jsonError">
                        确认发送
                    </button>
                </div>
            </div>
        </div>
    </teleport>
    <!-- 数据库查询模态框 -->
    <teleport to="body">
        <div v-if="showDbModal" class="modal-overlay" @click.self="closeDbModal">
            <div class="modal db-modal">
                <div class="modal-header">
                    <h3>数据库查询 - {{ currentResource?.name || '数据库资源' }}</h3>
                    <button class="close-btn" @click="closeDbModal">×</button>
                </div>

                <div class="modal-body">
                    <!-- 查询条件区域 -->
                    <div class="query-section">
                        <h4>查询设置</h4>

                        <!-- 绑定表名（必须先填这个） -->
                        <div class="query-row">
                            <label>表名：</label>
                            <input v-model.trim="tableName" placeholder="请输入要查询的表名（如 users, products）"
                                class="input-field" :disabled="isQuerying" />
                        </div>

                        <!-- 按字段值查询 -->
                        <div class="query-row">
                            <label>按值查询：</label>
                            <input v-model="queryField" placeholder="字段名 (如 id, name)" class="input-field"
                                :disabled="!tableName || isQuerying" />
                            <span class="separator">|</span>
                            <input v-model="queryValue" placeholder="字段值" class="input-field"
                                :disabled="!tableName || isQuerying" />
                        </div>

                        <!-- 按行数查询（取前 N 条） -->
                        <div class="query-row">
                            <label>按行数查询：</label>
                            <input v-model.number="limitRows" type="number" min="1" max="1000" placeholder="行数 (默认 50)"
                                class="input-field small" :disabled="!tableName || isQuerying" />
                            <span class="tip">条记录</span>
                        </div>

                        <!-- 查询按钮 -->
                        <button class="btn btn-primary query-btn" @click="executeQuery"
                            :disabled="!tableName || isQuerying">
                            {{ isQuerying ? '查询中...' : '执行查询' }}
                        </button>
                    </div>

                    <!-- 分隔线 -->
                    <hr />

                    <!-- 结果展示区域 -->
                    <div class="result-section">
                        <h4>查询结果</h4>
                        <div v-if="queryResult.length === 0 && !isQuerying" class="no-data">
                            {{ tableName ? '暂无数据，请执行查询' : '请先输入表名并查询' }}
                        </div>
                        <div v-else-if="isQuerying" class="loading">加载中...</div>
                        <div v-else class="table-container">
                            <table v-if="queryResult.length > 0">
                                <thead>
                                    <tr>
                                        <th v-for="col in columns" :key="col">{{ col }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(row, index) in queryResult" :key="index">
                                        <td v-for="col in columns" :key="col">
                                            {{ row[col] ?? '-' }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button @click="closeDbModal" class="btn btn-cancel">关闭</button>
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
    viewMode: { type: String, default: 'square' }
})

const showPostModal = ref(false)
const currentResource = ref(null)
const postBody = ref('{\n  \n}')
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

const submitPost = async () => {
    if (jsonError.value) return

    const resourceId = currentResource.value.id
    let body
    try {
        body = JSON.parse(postBody.value)
    } catch {
        alert('JSON 格式错误，无法发送')
        return
    }

    try {
        const response = await fetch(`/api/auth/access/${resourceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            // 可选：如果需要带上 cookie/凭证
            // credentials: 'include',
        })

        // 获取响应内容类型
        const contentType = response.headers.get('content-type') || ''
        let responseContent = ''
        let displayMode = 'text' // text, json, html

        if (contentType.includes('application/json')) {
            const jsonData = await response.json()
            responseContent = JSON.stringify(jsonData, null, 2) // 美化 JSON
            displayMode = 'json'
        } else if (contentType.includes('text/html')) {
            responseContent = await response.text()
            displayMode = 'html'
        } else {
            // 其他类型（纯文本、二进制等）都当作文本处理
            responseContent = await response.text()
            displayMode = 'text'
        }

        // 如果响应不成功
        if (!response.ok) {
            throw new Error(`请求失败 ${response.status} ${response.statusText}\n${responseContent}`)
        }

        // 在新窗口展示响应内容
        const newWindow = window.open('', '_blank')
        if (!newWindow) {
            alert('无法打开新窗口，请检查浏览器弹出窗口设置')
            return
        }

        // 构造简单的展示页面
        newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <title>POST 请求响应 - ${currentResource.value.name || '资源'}</title>
        <style>
          body {
            font-family: 'Segoe UI', monospace;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
          }
          pre {
            background: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-x: auto;
          }
          .json { background: #282c34; color: #abb2bf; }
          .error { color: #e74c3c; font-weight: bold; }
        </style>
      </head>
      <body>
        <p><strong>资源：</strong> ${currentResource.value.name || resourceId}</p>
        <p><strong>URL：</strong> /api/auth/access/${resourceId}</p>
        <p><strong>状态码：</strong> ${response.status} ${response.statusText}</p>
        <p><strong>Content-Type：</strong> ${contentType || '未知'}</p>
        <hr />
        ${displayMode === 'json'
                ? `<h3>JSON 响应（已格式化）：</h3><pre class="json">${escapeHtml(responseContent)}</pre>`
                : displayMode === 'html'
                    ? `<h3>HTML 响应：</h3><div>${responseContent}</div>`
                    : `<h3>响应内容：</h3><pre>${escapeHtml(responseContent)}</pre>`
            }
      </body>
      </html>
    `)
        newWindow.document.close()

    } catch (err) {
        // 错误时也展示在新窗口
        const errorMsg = err.message || '未知错误'

        const newWindow = window.open('', '_blank')
        if (newWindow) {
            newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <title>请求失败</title>
          <style>body { font-family: sans-serif; padding: 20px; color: #c0392b; }</style>
        </head>
        <body>
          <h1>POST 请求失败</h1>
          <p>资源：${currentResource.value?.name || resourceId}</p>
          <p class="error">${escapeHtml(errorMsg)}</p>
        </body>
        </html>
      `)
            newWindow.document.close()
        } else {
            alert(`请求失败：${errorMsg}`)
        }
    } finally {
        closePostModal()
    }
}

// 简单转义 HTML，防止 XSS（在新窗口中写入时使用）
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

// 关闭 POST 模态
const closePostModal = () => {
    showPostModal.value = false
    currentResource.value = null
    postBody.value = '{\n  \n}'
}
// ------------------- 数据库查询相关状态 -------------------
const showDbModal = ref(false)
const tableName = ref('')         // 新增：用户输入的表名
const queryField = ref('')
const queryValue = ref('')
const limitRows = ref(50)
const queryResult = ref([])
const isQuerying = ref(false)

// 从结果中动态获取列名
const columns = computed(() => {
    if (queryResult.value.length === 0) return []
    return Object.keys(queryResult.value[0])
})

// 重置数据库查询状态
const resetDbQuery = () => {
    tableName.value = ''
    queryField.value = ''
    queryValue.value = ''
    limitRows.value = 50
    queryResult.value = []
    isQuerying.value = false
}

// 执行查询
const executeQuery = async () => {
    if (!tableName.value.trim()) {
        alert('请先输入表名')
        return
    }

    if (!currentResource.value?.id) return

    isQuerying.value = true
    queryResult.value = []

    try {
        let body = {
            queryType: 'select',
            table: tableName.value.trim()
        }

        // 按值查询优先（如果填写了字段和值）
        if (queryField.value.trim() && queryValue.value.trim()) {
            body.conditions = {
                [queryField.value.trim()]: queryValue.value.trim()
            }
        }
        // 否则使用 limit（取前 N 条）
        else {
            body.limit = limitRows.value
        }

        const response = await fetch(`/api/auth/access/${currentResource.value.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const errText = await response.text()
            throw new Error(`查询失败 ${response.status}：${errText}`)
        }

        const res = await response.json()
        queryResult.value = res.data || [] // 假设后端返回 { result: [数组] }

    } catch (err) {
        console.error(err)
        alert('查询出错：' + err.message)
    } finally {
        isQuerying.value = false
    }
}

// 关闭数据库模态
const closeDbModal = () => {
    showDbModal.value = false
    resetDbQuery()
}

// 方法标签类名
const methodClass = (method) => {
    const lower = (method || '').toLowerCase()
    if (lower === 'get') return 'get'
    if (lower === 'post') return 'post'
    return 'other'
}

// 图片错误处理
const handleImageError = (e) => {
    e.target.src = defaultIcon
}

// 统一点击处理
const handleCardClick = (item) => {
    currentResource.value = item

    if (item.type === 'database') {
        // 数据库资源：打开数据库查询模态
        showDbModal.value = true
        resetDbQuery()
    } else if (item.allow_method === 'POST') {
        // POST：打开原有输入框
        showPostModal.value = true
        postBody.value = '{\n  \n}'
    } else {
        // GET 或其他：直接打开
        directAccess(item.id)
    }
}



// 直接访问（GET）
const directAccess = (resourceId) => {
    window.open(`/api/auth/access/${resourceId}`, '_blank')
}
</script>

<style scoped>
@import url(./style.css);
</style>