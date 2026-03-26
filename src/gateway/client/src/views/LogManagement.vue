<template>
  <div class="log-page">
    <div class="tabs">
      <button type="button" class="tab" :class="{ active: tab === 'access' }" @click="tab = 'access'">
        访问日志
      </button>
      <button type="button" class="tab" :class="{ active: tab === 'operation' }" @click="tab = 'operation'">
        操作日志
      </button>
    </div>

    <div class="panel">
      <div class="toolbar">
        <div class="toolbar-left">
          <button type="button" class="btn btn-outline" @click="refresh">刷新日志</button>
          <button type="button" class="btn btn-outline" @click="exportCsv">导出日志</button>
        </div>
        <div class="toolbar-right">
          <input
            v-model.trim="keyword"
            type="text"
            class="search-input"
            placeholder="请输入关键词"
            @keyup.enter="applyFilter"
          />
          <button type="button" class="btn btn-primary" @click="applyFilter">搜索</button>
        </div>
      </div>

      <!-- 访问日志表格 -->
      <div v-if="tab === 'access'" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>申请访问资源</th>
              <th>资源 url</th>
              <th>访问开始时间</th>
              <th>访问结束时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedAccess" :key="row.id">
              <td>{{ row.user }}</td>
              <td>{{ row.resource }}</td>
              <td class="mono">{{ row.url }}</td>
              <td>{{ row.start }}</td>
              <td>{{ row.end }}</td>
            </tr>
            <tr v-if="!pagedAccess.length">
              <td colspan="5" class="empty">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 操作日志表格 -->
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>操作类型</th>
              <th>详情</th>
              <th>操作时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedOp" :key="row.id">
              <td>{{ row.user }}</td>
              <td>{{ row.type }}</td>
              <td class="detail">{{ row.detail }}</td>
              <td>{{ row.time }}</td>
            </tr>
            <tr v-if="!pagedOp.length">
              <td colspan="4" class="empty">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="currentTotal">
        <span class="page-info">共 {{ currentTotal }} 条</span>
        <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">‹</button>
        <span class="page-num">{{ page }}</span>
        <button type="button" class="page-btn" :disabled="page >= totalPages" @click="page++">›</button>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const tab = ref('access')
const keyword = ref('')
const activeKeyword = ref('')
const page = ref(1)
const pageSize = 8
const toast = ref('')
let toastTimer

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2400)
}

const accessLogs = ref([
  { id: 1, user: '张三', resource: '工资单', url: '192.168.5.2:8000', start: '2026-03-10 14:25:26', end: '2026-03-10 15:25:26' },
  { id: 2, user: '李四', resource: '人力资源数据库', url: '192.168.5.3:3306', start: '2026-03-10 14:25:26', end: '2026-03-10 15:25:26' },
  { id: 3, user: '赵六', resource: '借款申请系统', url: '192.168.5.2:8001', start: '2026-03-10 14:25:26', end: '2026-03-10 15:25:26' },
  { id: 4, user: '刘大', resource: '补卡申请', url: '192.168.5.4:8080', start: '2026-03-10 14:25:26', end: '2026-03-10 15:25:26' }
])

const opLogs = ref([
  { id: 1, user: '王五', type: '文件管理', detail: '文件创建成功[/www/nginx/html/410.html]', time: '2026-03-10 14:25:26' },
  { id: 2, user: '关二', type: '用户登录', detail: '登陆成功，登录IP 111.151.113.2 (中国 江苏 南京)', time: '2026-03-10 14:25:26' },
  { id: 3, user: '王五', type: '资源管理', detail: '禁用资源 id=3', time: '2026-03-10 15:02:11' }
])

const filteredAccess = computed(() => {
  const k = activeKeyword.value.toLowerCase()
  if (!k) return accessLogs.value
  return accessLogs.value.filter(
    (r) => r.user.includes(k) || r.resource.toLowerCase().includes(k) || r.url.includes(k) || r.start.includes(k) || r.end.includes(k)
  )
})

const filteredOp = computed(() => {
  const k = activeKeyword.value.toLowerCase()
  if (!k) return opLogs.value
  return opLogs.value.filter(
    (r) => r.user.includes(k) || r.type.toLowerCase().includes(k) || r.detail.toLowerCase().includes(k) || r.time.includes(k)
  )
})

const currentTotal = computed(() => (tab.value === 'access' ? filteredAccess.value.length : filteredOp.value.length))
const totalPages = computed(() => Math.max(1, Math.ceil(currentTotal.value / pageSize)))

const pagedAccess = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredAccess.value.slice(start, start + pageSize)
})

const pagedOp = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredOp.value.slice(start, start + pageSize)
})

watch([tab, activeKeyword], () => { page.value = 1 })
watch(currentTotal, () => { if (page.value > totalPages.value) page.value = totalPages.value })

function applyFilter() {
  activeKeyword.value = keyword.value
}

function refresh() {
  showToast('已刷新（演示数据）')
}

function exportCsv() {
  const isAccess = tab.value === 'access'
  const rows = isAccess ? filteredAccess.value : filteredOp.value
  let header, lines
  if (isAccess) {
    header = ['用户', '申请访问资源', '资源url', '访问开始时间', '访问结束时间']
    lines = rows.map((r) => [r.user, r.resource, r.url, r.start, r.end].map(csvCell).join(','))
  } else {
    header = ['用户', '操作类型', '详情', '操作时间']
    lines = rows.map((r) => [r.user, r.type, r.detail, r.time].map(csvCell).join(','))
  }
  const blob = new Blob(['\ufeff' + header.join(',') + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = isAccess ? '访问日志.csv' : '操作日志.csv'
  a.click()
  URL.revokeObjectURL(a.href)
  showToast('已开始下载 CSV')
}

function csvCell(s) {
  const x = String(s ?? '')
  if (/[",\n]/.test(x)) return `"${x.replace(/"/g, '""')}"`
  return x
}
</script>

<style scoped>
.log-page { display: flex; flex-direction: column; gap: 0; }

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 0;
}

.tab {
  position: relative;
  padding: 12px 20px;
  border: none;
  background: none;
  font-size: 15px;
  color: #8c8c8c;
  cursor: pointer;
  margin-bottom: -1px;
}
.tab:hover { color: #1890ff; }
.tab.active { color: #1890ff; font-weight: 600; }
.tab.active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 2px;
  background: #1890ff;
  border-radius: 1px 1px 0 0;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-left, .toolbar-right { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.btn-primary { background: #1890ff; border-color: #1890ff; color: #fff; }
.btn-primary:hover { background: #40a9ff; }

.btn-outline { background: #fff; border-color: #d9d9d9; color: #595959; }
.btn-outline:hover { border-color: #1890ff; color: #1890ff; }

.search-input {
  width: 220px;
  max-width: 50vw;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.search-input:focus { border-color: #1890ff; }

.table-wrap { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 640px; }
.data-table th, .data-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.data-table thead th { background: #fafafa; color: #262626; font-weight: 600; }
.data-table tbody tr:nth-child(even) { background: #fafafa; }

.mono { font-family: ui-monospace, monospace; font-size: 13px; color: #595959; }

.detail { max-width: 420px; line-height: 1.5; color: #595959; }

.empty { text-align: center; color: #8c8c8c; padding: 36px !important; }

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.page-btn {
  min-width: 36px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info, .page-num { font-size: 13px; color: #8c8c8c; }

.toast {
  position: fixed;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  z-index: 1100;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
}
</style>
