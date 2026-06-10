<template>
  <div class="res-page">
    <div class="stat-row">
      <div class="stat-card">
        <span class="stat-val stat-blue">{{ stats.total }}</span>
        <span class="stat-label">资源总数</span>
      </div>
      <div class="stat-card">
        <span class="stat-val stat-green">{{ stats.available }}</span>
        <span class="stat-label">可用资源数</span>
      </div>
      <div class="stat-card">
        <span class="stat-val stat-red">{{ stats.unavailable }}</span>
        <span class="stat-label">不可用资源数</span>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="search-row">
        <input
          v-model.trim="keyword"
          type="text"
          class="search-input"
          placeholder="请输入关键词"
          @keyup.enter="applySearch"
        />
        <button type="button" class="btn btn-primary" @click="applySearch">搜索</button>
      </div>
      <div class="action-row">
        <input ref="fileInputRef" type="file" accept=".csv,.xls,.xlsx" class="file-hidden" @change="onImportFile" />
        <button type="button" class="btn btn-outline" @click="triggerImport">批量导入资源列表 (.xls)</button>
        <button type="button" class="btn btn-outline" :disabled="!selectedIds.length" @click="bulkSetAvailable(true)">
          启用所选资源
        </button>
        <button type="button" class="btn btn-outline" :disabled="!selectedIds.length" @click="bulkSetAvailable(false)">
          禁用所选资源
        </button>
        <button type="button" class="btn btn-primary btn-add" @click="openCreate">新增资源</button>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check">
              <label class="check-wrap">
                <input type="checkbox" :checked="allVisibleSelected" @change="toggleSelectAll" />
                <span>全选</span>
              </label>
            </th>
            <th>资源 id</th>
            <th>资源名</th>
            <th>资源 URL</th>
            <th>资源是否可用</th>
            <th class="col-op">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pagedRows" :key="row.id">
            <td>
              <input type="checkbox" :checked="selectedIds.includes(row.id)" @change="toggleRow(row.id)" />
            </td>
            <td>{{ row.id }}</td>
            <td>{{ row.name }}</td>
            <td class="cell-url">{{ row.url }}</td>
            <td>
              <span class="tag" :class="row.available ? 'tag-yes' : 'tag-no'">
                {{ row.available ? '可用' : '不可用' }}
              </span>
            </td>
            <td>
              <button type="button" class="link-btn" @click="openEdit(row)">编辑</button>
              <button type="button" class="link-btn danger" @click="confirmDelete(row)">删除</button>
            </td>
          </tr>
          <tr v-if="!pagedRows.length">
            <td colspan="6" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="filteredRows.length">
        <span class="page-info">共 {{ filteredRows.length }} 条</span>
        <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
        <span class="page-num">{{ page }} / {{ totalPages }}</span>
        <button type="button" class="page-btn" :disabled="page >= totalPages" @click="page++">下一页</button>
      </div>
    </div>

    <!-- 编辑 / 新增弹窗 -->
    <div v-if="editOpen" class="modal-overlay" @click.self="editOpen = false">
      <div class="modal">
        <div class="modal-hd">
          <h3>{{ editingId ? '编辑资源' : '新增资源' }}</h3>
          <button type="button" class="icon-close" @click="editOpen = false">×</button>
        </div>
        <div class="modal-bd">
          <label class="field">
            <span>资源名</span>
            <input v-model="form.name" type="text" class="inp" placeholder="名称" />
          </label>
          <label class="field">
            <span>资源 URL</span>
            <input v-model="form.url" type="text" class="inp" placeholder="https:// 或 ip:port" />
          </label>
          <label class="field row-inline">
            <span>是否可用</span>
            <select v-model="form.available" class="inp">
              <option :value="true">可用</option>
              <option :value="false">不可用</option>
            </select>
          </label>
        </div>
        <div class="modal-ft">
          <button type="button" class="btn btn-ghost" @click="editOpen = false">取消</button>
          <button type="button" class="btn btn-primary" @click="saveForm">保存</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal modal-sm">
        <div class="modal-hd">
          <h3>删除资源</h3>
          <button type="button" class="icon-close" @click="deleteTarget = null">×</button>
        </div>
        <div class="modal-bd">
          <p class="confirm-text">确定删除「{{ deleteTarget.name }}」吗？此操作仅作用于本地演示数据。</p>
        </div>
        <div class="modal-ft">
          <button type="button" class="btn btn-ghost" @click="deleteTarget = null">取消</button>
          <button type="button" class="btn btn-danger" @click="doDelete">删除</button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

let _nid = 100
const rows = ref([
  { id: 1, name: '工资单', url: '192.168.5.2:8000', available: true },
  { id: 2, name: '人力资源数据库', url: '192.168.5.3:3306', available: true },
  { id: 3, name: '借款申请系统', url: '192.168.5.2:8001', available: false },
  { id: 4, name: '补卡申请', url: '192.168.5.4:8080', available: true }
])

const keyword = ref('')
const activeKeyword = ref('')
const page = ref(1)
const pageSize = 8
const selectedIds = ref([])
const fileInputRef = ref(null)

const editOpen = ref(false)
const editingId = ref(null)
const form = ref({ name: '', url: '', available: true })
const deleteTarget = ref(null)
const toast = ref('')
let toastTimer

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2600)
}

const stats = computed(() => {
  const list = rows.value
  return {
    total: list.length,
    available: list.filter((r) => r.available).length,
    unavailable: list.length - list.filter((r) => r.available).length
  }
})

const filteredRows = computed(() => {
  const k = activeKeyword.value.toLowerCase()
  if (!k) return rows.value
  return rows.value.filter(
    (r) => String(r.id).includes(k) || r.name.toLowerCase().includes(k) || r.url.toLowerCase().includes(k)
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredRows.value.slice(start, start + pageSize)
})

const visibleIds = computed(() => pagedRows.value.map((r) => r.id))

const allVisibleSelected = computed(() => {
  if (!visibleIds.value.length) return false
  return visibleIds.value.every((id) => selectedIds.value.includes(id))
})

watch(filteredRows, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

function applySearch() {
  activeKeyword.value = keyword.value
  page.value = 1
}

function toggleSelectAll(e) {
  if (e.target.checked) {
    const set = new Set([...selectedIds.value, ...visibleIds.value])
    selectedIds.value = [...set]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !visibleIds.value.includes(id))
  }
}

function toggleRow(id) {
  const i = selectedIds.value.indexOf(id)
  if (i === -1) selectedIds.value = [...selectedIds.value, id]
  else selectedIds.value = selectedIds.value.filter((x) => x !== id)
}

function triggerImport() {
  fileInputRef.value?.click()
}

function onImportFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || '')
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (!lines.length) { showToast('文件为空'); return }
    let added = 0
    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map((s) => s.trim())
      if (parts.length >= 2 && parts[0] && parts[1]) {
        _nid += 1
        rows.value.push({ id: _nid, name: parts[0], url: parts[1], available: true })
        added += 1
      }
    }
    showToast(added ? `已导入 ${added} 条` : '未解析到有效行，请使用「名称,URL」或制表符分隔')
  }
  reader.readAsText(file)
}

function bulkSetAvailable(v) {
  selectedIds.value.forEach((id) => {
    const r = rows.value.find((x) => x.id === id)
    if (r) r.available = v
  })
  showToast(v ? '已启用所选资源' : '已禁用所选资源')
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', url: '', available: true }
  editOpen.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.value = { name: row.name, url: row.url, available: row.available }
  editOpen.value = true
}

function saveForm() {
  const { name, url, available } = form.value
  if (!name.trim() || !url.trim()) { showToast('请填写资源名与 URL'); return }
  if (editingId.value == null) {
    _nid += 1
    rows.value.push({ id: _nid, name: name.trim(), url: url.trim(), available })
    showToast('已新增')
  } else {
    const r = rows.value.find((x) => x.id === editingId.value)
    if (r) { r.name = name.trim(); r.url = url.trim(); r.available = available }
    showToast('已保存')
  }
  editOpen.value = false
}

function confirmDelete(row) {
  deleteTarget.value = row
}

function doDelete() {
  const t = deleteTarget.value
  if (!t) return
  rows.value = rows.value.filter((r) => r.id !== t.id)
  selectedIds.value = selectedIds.value.filter((id) => id !== t.id)
  deleteTarget.value = null
  showToast('已删除')
}
</script>

<style scoped>
.res-page { display: flex; flex-direction: column; gap: 16px; }

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 900px) { .stat-row { grid-template-columns: 1fr; } }

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.stat-val { display: block; font-size: 36px; font-weight: 700; line-height: 1.2; }
.stat-blue { color: #1890ff; }
.stat-green { color: #52c41a; }
.stat-red { color: #f5222d; }

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-top: 6px;
  display: block;
}

.toolbar-card,
.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.search-row { display: flex; gap: 10px; margin-bottom: 14px; }

.search-input {
  flex: 1;
  max-width: 480px;
  padding: 10px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: #1890ff; }

.action-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.file-hidden { display: none; }

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s, opacity 0.2s;
}
.btn:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-primary { background: #1890ff; border-color: #1890ff; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #40a9ff; border-color: #40a9ff; }

.btn-outline { background: #fff; border-color: #d9d9d9; color: #595959; }
.btn-outline:hover:not(:disabled) { border-color: #1890ff; color: #1890ff; }

.btn-add { margin-left: auto; }
.btn-ghost { background: #fff; border-color: #d9d9d9; color: #595959; }

.btn-danger { background: #ff4d4f; border-color: #ff4d4f; color: #fff; }
.btn-danger:hover { background: #ff7875; border-color: #ff7875; }

.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th, .data-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.data-table thead th { background: #fafafa; color: #262626; font-weight: 600; }
.data-table tbody tr:nth-child(even) { background: #fafafa; }

.col-check { width: 100px; }

.check-wrap { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; }

.cell-url {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  color: #595959;
  max-width: 280px;
  word-break: break-all;
}

.tag { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px; }
.tag-yes { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.tag-no { background: #fff2f0; color: #f5222d; border: 1px solid #ffccc7; }

.col-op { width: 140px; }

.link-btn {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
  padding: 0;
}
.link-btn.danger { color: #ff4d4f; }

.empty { text-align: center; color: #8c8c8c; padding: 40px !important; }

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.page-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid #d9d9d9; background: #fff; cursor: pointer; }
.page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.page-info, .page-num { font-size: 13px; color: #8c8c8c; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal { width: 100%; max-width: 440px; background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); }
.modal-sm { max-width: 400px; }

.modal-hd { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; }
.modal-hd h3 { margin: 0; font-size: 16px; }

.icon-close { border: none; background: none; font-size: 22px; line-height: 1; color: #8c8c8c; cursor: pointer; }

.modal-bd { padding: 20px; }
.modal-ft { padding: 12px 20px 18px; display: flex; justify-content: flex-end; gap: 10px; }

.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.field span { font-size: 13px; color: #595959; }

.field.row-inline { flex-direction: row; align-items: center; gap: 12px; }
.field.row-inline span { min-width: 72px; }

.inp { padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 8px; font-size: 14px; }

.confirm-text { margin: 0; color: #595959; line-height: 1.6; }

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
