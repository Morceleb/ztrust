<template>
  <div class="resource-page">
    <div class="summary-row">
      <div class="summary-card">
        <span class="summary-value">{{ totalCount }}</span>
        <span class="summary-label">资源总数</span>
      </div>
      <div class="summary-card">
        <span class="summary-value summary-active">{{ activeCount }}</span>
        <span class="summary-label">启用资源</span>
      </div>
      <div class="summary-card">
        <span class="summary-value summary-inactive">{{ inactiveCount }}</span>
        <span class="summary-label">禁用资源</span>
      </div>
    </div>

    <div class="panel-card toolbar-card">
      <div class="toolbar-row">
        <input
          v-model="keyword"
          type="text"
          class="search-input"
          placeholder="搜索资源名称、资源ID、资源类型"
        />
      </div>
      <p class="toolbar-tip">网关侧仅提供资源查看权限，不支持新增、编辑和删除操作。</p>
    </div>

    <div class="panel-card table-card">
      <div v-if="error" class="alert-error">{{ error }}</div>

      <table class="data-table">
        <thead>
          <tr>
            <th class="col-index">序号</th>
            <th class="col-icon">图标</th>
            <th>资源名称</th>
            <th>资源类型</th>
            <th>资源ID</th>
            <th>允许方法</th>
            <th>资源状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(resource, index) in pagedResources" :key="resource.id ?? resource.resourceId ?? index">
            <td class="col-index">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="col-icon">
              <div class="resource-icon" :class="{ 'has-custom': resource.icon }">
                <img
                  v-if="isResourceIconUrl(resource.icon)"
                  :src="resource.icon"
                  alt=""
                  class="resource-icon-img"
                />
                <span v-else-if="resource.icon" class="resource-icon-emoji">{{ resource.icon }}</span>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
            </td>
            <td>{{ resource.name || '-' }}</td>
            <td>{{ resource.type || '-' }}</td>
            <td class="mono-cell">{{ resource.resourceId || '-' }}</td>
            <td>{{ formatAllowMethod(resource.allowMethod) }}</td>
            <td>
              <span class="status-badge" :class="resource.isActive ? 'status-active' : 'status-inactive'">
                {{ resource.isActive ? '启用' : '禁用' }}
              </span>
            </td>
          </tr>
          <tr v-if="!loading && pagedResources.length === 0">
            <td colspan="7" class="empty-cell">{{ keyword ? '未找到匹配的资源' : '暂无资源数据' }}</td>
          </tr>
          <tr v-if="loading">
            <td colspan="7" class="empty-cell">正在加载资源数据...</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="totalCount > 0">
        <span class="page-info">共 {{ totalCount }} 条</span>
        <div class="page-controls">
          <button type="button" class="page-btn" :disabled="currentPage === 1 || loading" @click="goToPage(1)">首页</button>
          <button type="button" class="page-btn" :disabled="currentPage === 1 || loading" @click="goToPage(currentPage - 1)">上一页</button>
          <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
          <button type="button" class="page-btn" :disabled="currentPage === totalPages || loading" @click="goToPage(currentPage + 1)">下一页</button>
          <button type="button" class="page-btn" :disabled="currentPage === totalPages || loading" @click="goToPage(totalPages)">尾页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { listResources } from '@/api/resource.js'

const allResources = ref([])
const keyword = ref('')
const currentPage = ref(1)
const pageSize = 10
const loading = ref(false)
const error = ref('')

// 统计数据基于所有资源计算
const totalCount = computed(() => filteredResources.value.length)
const activeCount = computed(() => allResources.value.filter((item) => item.isActive).length)
const inactiveCount = computed(() => allResources.value.filter((item) => !item.isActive).length)

// 前端过滤：按关键词搜索资源名称、资源ID、资源类型
const filteredResources = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return allResources.value
  return allResources.value.filter((item) => {
    const name = (item.name || '').toLowerCase()
    const resourceId = (item.resourceId || '').toLowerCase()
    const type = (item.type || '').toLowerCase()
    return name.includes(kw) || resourceId.includes(kw) || type.includes(kw)
  })
})

// 前端分页
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

const pagedResources = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredResources.value.slice(start, start + pageSize)
})

function normalizeResource(item) {
  return {
    id: item.id,
    icon: item.icon || '',
    name: item.name || '',
    type: item.type || '',
    resourceId: item.resourceId || item.resource_id || '',
    allowMethod: item.allowMethod || item.allow_method || '',
    isActive: Boolean(item.isActive ?? item.is_active),
    createdAt: item.createdAt || item.created_at || item.createTime || item.create_time || '',
    updatedAt: item.updatedAt || item.updated_at || item.updateTime || item.update_time || ''
  }
}

function getResourceTimestamp(resource) {
  const rawValue = resource.createdAt || resource.updatedAt
  if (!rawValue) return 0

  const normalizedValue = typeof rawValue === 'string' ? rawValue.replace(/-/g, '/') : rawValue
  const timestamp = new Date(normalizedValue).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getResourceSortWeight(resource) {
  const timestamp = getResourceTimestamp(resource)
  if (timestamp > 0) return timestamp

  const numericId = Number(resource.id)
  if (Number.isFinite(numericId)) return numericId

  return 0
}

function sortResourcesByNewest(list) {
  return [...list].sort((left, right) => getResourceSortWeight(right) - getResourceSortWeight(left))
}

function isResourceIconUrl(icon) {
  return typeof icon === 'string' && /^(https?:)?\/\//.test(icon)
}

function formatAllowMethod(value) {
  if (!value) return '-'
  if (Array.isArray(value)) return value.join('、')
  return String(value)
}

async function fetchResources() {
  loading.value = true
  error.value = ''

  const res = await listResources({})

  if (res.code === 200) {
    const raw = res.data
    const rawList = Array.isArray(raw)
      ? raw
      : (Array.isArray(raw?.list) ? raw.list : Array.isArray(raw?.records) ? raw.records : [])

    allResources.value = sortResourcesByNewest(rawList.map(normalizeResource))
    currentPage.value = 1
  } else {
    allResources.value = []
    error.value = res.message || '获取资源列表失败'
  }

  loading.value = false
}

// 关键词变化时重置到第一页
watch(keyword, () => {
  currentPage.value = 1
})

function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
}

onMounted(() => {
  fetchResources()
})
</script>

<style scoped>
.resource-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.panel-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.summary-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #e5eef7;
  border-radius: 16px;
  padding: 22px 24px;
  display: grid;
  gap: 8px;
}

.summary-value {
  font-size: 34px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}

.summary-active {
  color: #059669;
}

.summary-inactive {
  color: #dc2626;
}

.summary-label {
  font-size: 14px;
  color: #64748b;
}

.toolbar-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 520px;
  border: 1px solid #d7e2f0;
  border-radius: 12px;
  padding: 11px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.12);
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 11px 18px;
  font-size: 14px;
  cursor: pointer;
}

.btn:disabled,
.page-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
}

.toolbar-tip {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 13px;
}

.alert-error {
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
  font-size: 14px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  text-align: left;
  font-size: 14px;
  color: #1e293b;
}

.data-table thead th {
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
}

.col-index {
  width: 80px;
}

.col-icon {
  width: 88px;
}

.resource-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.resource-icon.has-custom {
  background: #f8fafc;
}

.resource-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resource-icon-emoji {
  font-size: 18px;
}

.mono-cell {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  color: #475569;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #ecfdf5;
  color: #059669;
}

.status-inactive {
  background: #fff1f2;
  color: #dc2626;
}

.empty-cell {
  text-align: center;
  color: #94a3b8;
  padding: 42px 0;
}

.pagination {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #edf2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-info,
.page-num {
  font-size: 13px;
  color: #64748b;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-btn {
  border: 1px solid #d7e2f0;
  background: #fff;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}

@media (max-width: 960px) {
  .summary-row {
    grid-template-columns: 1fr;
  }

  .toolbar-row,
  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .page-controls {
    justify-content: space-between;
    flex-wrap: wrap;
  }
}
</style>
