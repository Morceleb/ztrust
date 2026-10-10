<template>
  <div class="decision-graph-management">
    <div class="toolbar">
      <div class="search-box">
        <input v-model="keyword" class="search-input" placeholder="搜索策略名称..." @keyup.enter="applyFilters" />
        <button class="search-btn" type="button" title="搜索" @click="applyFilters">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>
      <div class="toolbar-actions">
        <select v-model="statusFilter" class="status-filter" @change="applyFilters">
          <option value="">全部状态</option>
          <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <button class="btn btn-primary" type="button" @click="router.push('/decision-graphs/new')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建决策图
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-index">序号</th>
            <th>策略名称</th>
            <th class="col-version">版本</th>
            <th class="col-status">状态</th>
            <th class="col-effect">决策效果</th>
            <th class="col-time">生效时间</th>
            <th class="col-time">更新时间</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(policy, index) in policies" :key="policy.policyId">
            <td class="col-index">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>
              <div class="policy-name" :title="policy.name">{{ policy.name }}</div>
            </td>
            <td class="col-version">v{{ policy.version }}</td>
            <td><span class="status-badge" :class="statusClass(policy.status)">{{ statusLabel(policy.status) }}</span></td>
            <td><span class="effect-badge" :class="policy.effect === 'ALLOW' ? 'effect-allow' : 'effect-deny'">{{ policy.effect === 'ALLOW' ? '允许' : '拒绝' }}</span></td>
            <td class="time-text">{{ formatDate(policy.effectiveAt) }}</td>
            <td class="time-text">{{ formatDate(policy.updatedAt) }}</td>
            <td>
              <div class="action-buttons">
                <button v-if="policy.status === 'DRAFT'" class="action-btn action-edit" type="button" title="编辑" @click="openPolicy(policy, 'edit')">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="action-btn action-view" type="button" title="查看" @click="openPolicy(policy, 'view')">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && policies.length === 0">
            <td colspan="8" class="empty-cell">
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                  <circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 12h4a4 4 0 0 0 4-4V6h2M7 12h4a4 4 0 0 1 4 4v2h2"/>
                </svg>
                <p>暂无决策策略</p>
              </div>
            </td>
          </tr>
          <tr v-if="loading"><td colspan="8" class="loading-cell">正在加载...</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalCount > 0" class="pagination">
      <span class="pagination-info">共 {{ totalCount }} 条记录</span>
      <div class="pagination-controls">
        <button class="page-btn" :disabled="currentPage === 1" @click="goPage(1)">首页</button>
        <button class="page-btn" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">上一页</button>
        <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">下一页</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="goPage(totalPages)">尾页</button>
      </div>
    </div>

    <Transition name="toast-fade">
      <div v-if="toast.visible" class="toast" :class="toast.type">{{ toast.message }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listPolicies } from '@/api/policy.js'

const router = useRouter()
const keyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = 4
const totalCount = ref(0)
const policies = ref([])
const loading = ref(false)
const toast = reactive({ visible: false, message: '', type: 'error' })
let toastTimer

const statusOptions = [
  { value: 'DRAFT', label: '草稿' }, { value: 'SCHEDULED', label: '已计划' },
  { value: 'ACTIVE', label: '生效中' }, { value: 'RETIRED', label: '已退役' },
  { value: 'ARCHIVED', label: '已归档' }, { value: 'PURGED', label: '已清除' }
]
const statusMap = Object.fromEntries(statusOptions.map(item => [item.value, item.label]))
const statusStyleMap = { DRAFT: 'status-info', SCHEDULED: 'status-primary', ACTIVE: 'status-success', RETIRED: 'status-warning', ARCHIVED: 'status-info', PURGED: 'status-danger' }
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

function showToast(message, type = 'error') {
  toast.message = message
  toast.type = type
  toast.visible = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.visible = false }, 2800)
}

async function loadPolicies() {
  loading.value = true
  try {
    const res = await listPolicies({ page: currentPage.value, pageSize, keyword: keyword.value.trim(), status: statusFilter.value })
    if (res.code !== 200) throw new Error(res.message || '加载策略失败')
    policies.value = res.data?.list || []
    totalCount.value = Number(res.data?.total) || 0
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
      await loadPolicies()
    }
  } catch (error) {
    policies.value = []
    totalCount.value = 0
    showToast(error.message || 'Mock/API 操作失败')
  } finally {
    loading.value = false
  }
}

function applyFilters() { currentPage.value = 1; loadPolicies() }
function goPage(page) { currentPage.value = Math.min(Math.max(1, page), totalPages.value); loadPolicies() }
function openPolicy(policy, mode) { router.push({ path: `/decision-graphs/${policy.policyId}`, query: mode === 'view' ? { mode: 'view' } : {} }) }
function statusLabel(status) { return statusMap[status] || status || '-' }
function statusClass(status) { return statusStyleMap[status] || 'status-info' }
function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

onMounted(loadPolicies)
</script>

<style scoped>
.decision-graph-management { min-height: 100%; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
.search-box { display: flex; align-items: center; background: #f5f7fa; border: 1px solid transparent; border-radius: 8px; padding-left: 12px; transition: border-color .2s; }
.search-box:focus-within { border-color: #409eff; background: white; }
.search-input { width: 240px; padding: 9px 4px; border: none; outline: none; background: transparent; color: #303133; font-size: 14px; }
.search-btn { height: 36px; width: 38px; border: none; background: transparent; color: #909399; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.search-btn:hover { color: #409eff; }
.toolbar-actions { display: flex; align-items: center; gap: 12px; }
.status-filter { height: 38px; min-width: 132px; padding: 0 32px 0 12px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #606266; font-size: 14px; outline: none; }
.status-filter:focus { border-color: #409eff; }
.btn { height: 38px; display: inline-flex; align-items: center; gap: 6px; padding: 0 16px; border: 1px solid transparent; border-radius: 6px; font-size: 14px; cursor: pointer; transition: all .2s; }
.btn-primary { background: #409eff; border-color: #409eff; color: white; }
.btn-primary:hover { background: #66b1ff; border-color: #66b1ff; }
.table-container { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.05); overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.data-table th { padding: 13px 12px; background: #fafafa; color: #606266; font-size: 13px; font-weight: 600; text-align: left; border-bottom: 1px solid #ebeef5; }
.data-table td { padding: 15px 12px; color: #606266; font-size: 14px; border-bottom: 1px solid #ebeef5; vertical-align: middle; }
.data-table tbody tr:hover { background: #fafcff; }
.data-table tbody tr:last-child td { border-bottom: none; }
.col-index { width: 60px; text-align: center !important; color: #909399 !important; }
.col-version { width: 74px; text-align: center !important; }
.col-status { width: 92px; }.col-effect { width: 90px; }.col-time { width: 158px; }.col-actions { width: 100px; text-align: center !important; }
.policy-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #303133; font-weight: 500; }
.time-text { color: #909399 !important; font-size: 13px !important; }
.status-badge,.effect-badge { display: inline-flex; align-items: center; justify-content: center; padding: 4px 9px; border-radius: 12px; font-size: 12px; white-space: nowrap; }
.status-success,.effect-allow { background: #f0f9eb; color: #67c23a; }.status-warning { background: #fdf6ec; color: #e6a23c; }.status-danger,.effect-deny { background: #fef0f0; color: #f56c6c; }.status-info { background: #f4f4f5; color: #909399; }.status-primary { background: #ecf5ff; color: #409eff; }
.action-buttons { display: flex; justify-content: center; gap: 8px; }
.action-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 6px; cursor: pointer; transition: all .2s; }
.action-edit { background: #ecf5ff; color: #409eff; }.action-edit:hover { background: #409eff; color: white; }.action-view { background: #f4f4f5; color: #606266; }.action-view:hover { background: #909399; color: white; }
.empty-cell,.loading-cell { height: 260px; text-align: center !important; }.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #909399; }.empty-state p { margin: 0; }.loading-cell { color: #909399 !important; }
.pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding: 12px 4px; }.pagination-info { color: #909399; font-size: 13px; }.pagination-controls { display: flex; align-items: center; gap: 4px; }.page-btn { height: 32px; padding: 0 10px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #606266; font-size: 13px; cursor: pointer; }.page-btn:hover:not(:disabled) { border-color: #409eff; color: #409eff; }.page-btn:disabled { opacity: .45; cursor: not-allowed; }.page-num { padding: 0 9px; color: #606266; font-size: 14px; }
.toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 3000; padding: 11px 20px; border-radius: 8px; color: white; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,.16); }.toast.success { background: #67c23a; }.toast.error { background: #f56c6c; }.toast-fade-enter-active,.toast-fade-leave-active { transition: opacity .2s, transform .2s; }.toast-fade-enter-from,.toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
@media (max-width: 900px) { .toolbar { align-items: stretch; flex-direction: column; }.toolbar-actions { justify-content: flex-end; }.search-input { width: 100%; }.search-box { width: 100%; }.col-time { width: 140px; } }
</style>
