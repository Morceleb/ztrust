<template>
  <div class="approval-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <h1 class="page-title">权限审批</h1>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索申请人或资源"
          />
        </div>
      </div>
    </header>

    <!-- 标签页：全部 / 待审批 / 已通过 / 已拒绝 -->
    <div class="tabs-wrap">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 申请列表 -->
    <div class="approval-list">
      <div v-if="filteredApplications.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <p class="empty-text">暂无权限申请</p>
      </div>

      <div
        v-for="app in filteredApplications"
        :key="app.id"
        class="application-card"
      >
        <div class="card-header">
          <div class="applicant-info">
            <div class="applicant-avatar">
              {{ app.applicantName.charAt(0).toUpperCase() }}
            </div>
            <div class="applicant-detail">
              <span class="applicant-name">{{ app.applicantName }}</span>
              <span class="apply-time">申请时间：{{ app.applyTime }}</span>
            </div>
          </div>
          <div class="status-badge" :class="'status-' + app.status">
            {{ statusText(app.status) }}
          </div>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="info-label">申请资源：</span>
            <span class="info-value resource-name">{{ app.resourceName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">申请时长：</span>
            <span class="info-value">{{ app.duration }}天</span>
          </div>
          <div class="info-row">
            <span class="info-label">有效期：</span>
            <span class="info-value">{{ app.startTime }} 至 {{ app.endTime }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">申请原因：</span>
            <span class="info-value">{{ reasonText(app.reasonType) }}</span>
          </div>
          <div v-if="app.reasonDetail" class="info-row reason-detail">
            <span class="info-label">详细理由：</span>
            <span class="info-value">{{ app.reasonDetail }}</span>
          </div>
        </div>

        <div v-if="app.status === 'pending'" class="card-footer">
          <button type="button" class="btn-reject" @click="handleReject(app)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            拒绝
          </button>
          <button type="button" class="btn-approve" @click="handleApprove(app)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            批准
          </button>
        </div>
      </div>
    </div>

    <!-- 拒绝弹窗 -->
    <teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
          <div class="modal-box">
            <div class="modal-header">
              <h3 class="modal-title">拒绝申请</h3>
              <button type="button" class="modal-close" @click="closeRejectModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="reject-info">
                <span>申请人：{{ currentApp?.applicantName }}</span>
                <span>申请资源：{{ currentApp?.resourceName }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">拒绝原因 <span class="required">*</span></label>
                <textarea
                  v-model="rejectReason"
                  class="form-textarea"
                  placeholder="请输入拒绝原因（必填）"
                  rows="4"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-cancel" @click="closeRejectModal">取消</button>
              <button type="button" class="btn-confirm-reject" @click="confirmReject" :disabled="!rejectReason.trim()">
                确定拒绝
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </teleport>

    <!-- 操作成功提示 -->
    <Transition name="toast-fade">
      <div v-if="toastVisible" class="toast" :class="toastType">
        <svg v-if="toastType === 'success'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchKeyword = ref('')
const activeTab = ref('pending')
const showRejectModal = ref(false)
const currentApp = ref(null)
const rejectReason = ref('')
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// 模拟申请数据
const applications = ref([
  {
    id: 'app-001',
    applicantName: '张三',
    applyTime: '2026-03-17 10:30:00',
    resourceName: '公司堡垒机',
    duration: 7,
    startTime: '2026-03-17 00:00:00',
    endTime: '2026-03-24 23:59:59',
    reasonType: 'org',
    reasonDetail: '部门业务需要定期访问堡垒机进行运维操作',
    status: 'pending'
  },
  {
    id: 'app-002',
    applicantName: '李四',
    applyTime: '2026-03-16 14:20:00',
    resourceName: 'VPN控制台',
    duration: 3,
    startTime: '2026-03-16 00:00:00',
    endTime: '2026-03-19 23:59:59',
    reasonType: 'role',
    reasonDetail: '需要远程访问VPN进行网络调试',
    status: 'pending'
  },
  {
    id: 'app-003',
    applicantName: '王五',
    applyTime: '2026-03-15 09:00:00',
    resourceName: '跳板机',
    duration: 30,
    startTime: '2026-03-15 00:00:00',
    endTime: '2026-04-14 23:59:59',
    reasonType: 'personal',
    reasonDetail: '临时项目需要访问跳板机进行数据迁移',
    status: 'approved'
  },
  {
    id: 'app-004',
    applicantName: '赵六',
    applyTime: '2026-03-14 16:45:00',
    resourceName: 'sangfor_l3vpn',
    duration: 1,
    startTime: '2026-03-14 00:00:00',
    endTime: '2026-03-15 23:59:59',
    reasonType: 'role',
    reasonDetail: '紧急故障处理',
    status: 'rejected'
  }
])

const tabs = computed(() => [
  { value: 'all', label: '全部', count: applications.value.length },
  { value: 'pending', label: '待审批', count: applications.value.filter(a => a.status === 'pending').length },
  { value: 'approved', label: '已通过', count: applications.value.filter(a => a.status === 'approved').length },
  { value: 'rejected', label: '已拒绝', count: applications.value.filter(a => a.status === 'rejected').length }
])

const filteredApplications = computed(() => {
  let list = applications.value
  if (activeTab.value !== 'all') {
    list = list.filter(a => a.status === activeTab.value)
  }
  const kw = searchKeyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(a =>
      a.applicantName.toLowerCase().includes(kw) ||
      a.resourceName.toLowerCase().includes(kw)
    )
  }
  return list
})

const statusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已拒绝' }
  return map[status] || status
}

const reasonText = (type) => {
  const map = {
    org: '我所属组织架构均需要通过此应用开展业务工作',
    role: '我因为岗位职责原因需要访问该应用',
    personal: '我因为个人特殊原因需要访问该应用'
  }
  return map[type] || type
}

const handleApprove = (app) => {
  app.status = 'approved'
  showToast('已批准申请', 'success')
}

const handleReject = (app) => {
  currentApp.value = app
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  rejectReason.value = ''
  currentApp.value = null
}

const confirmReject = () => {
  if (!rejectReason.value.trim()) return
  if (currentApp.value) {
    currentApp.value.status = 'rejected'
    currentApp.value.rejectReason = rejectReason.value
  }
  showToast('已拒绝申请', 'error')
  closeRejectModal()
}

const showToast = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2500)
}
</script>

<style scoped>
.approval-page {
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.search-box {
  position: relative;
  width: 260px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 38px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #667eea;
}

.tabs-wrap {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: none;
  border: none;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-btn:hover {
  color: #1e293b;
}

.tab-btn.active {
  color: #667eea;
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #667eea;
  border-radius: 2px 2px 0 0;
}

.tab-count {
  font-size: 12px;
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 10px;
}

.tab-btn.active .tab-count {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #94a3b8;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.application-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.application-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.applicant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.applicant-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.applicant-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.applicant-name {
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
}

.apply-time {
  font-size: 12px;
  color: #94a3b8;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-approved {
  background: #dcfce7;
  color: #16a34a;
}

.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

.card-body {
  padding: 16px 20px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #64748b;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #1e293b;
}

.resource-name {
  font-weight: 500;
}

.reason-detail {
  flex-direction: column;
  gap: 4px;
}

.reason-detail .info-label {
  width: auto;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.btn-reject,
.btn-approve {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reject {
  background: #fff;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-reject:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.btn-approve {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.btn-approve:hover {
  opacity: 0.9;
}

/* 拒绝弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
}

.modal-box {
  background: #fff;
  border-radius: 10px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.modal-close:hover {
  color: #475569;
}

.modal-body {
  padding: 20px;
}

.reject-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.form-group {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
}

.form-label .required {
  color: #ef4444;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  outline: none;
}

.form-textarea:focus {
  border-color: #667eea;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  background: #f8fafc;
}

.btn-cancel {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-confirm-reject {
  padding: 8px 16px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-confirm-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-confirm-reject:hover:not(:disabled) {
  background: #b91c1c;
}

/* Toast 提示 */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 3000;
}

.toast.success {
  background: #16a34a;
  color: #fff;
}

.toast.error {
  background: #dc2626;
  color: #fff;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
