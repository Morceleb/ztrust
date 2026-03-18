<template>
    <teleport to="body">
        <Transition name="modal-fade">
            <div
                v-if="visible"
                class="modal-overlay"
                @click.self="handleClose"
            >
                <div class="modal-box" role="dialog" aria-labelledby="permission-modal-title">
                    <div class="modal-header">
                        <h2 id="permission-modal-title" class="modal-title">权限申请</h2>
                        <button type="button" class="modal-close" aria-label="关闭" @click="handleClose">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6 6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div class="modal-body">
                        <!-- 温馨提示 -->
                        <div class="tip-block">
                            <span class="tip-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 8a6 6 0 0 1 12 0c0 7-3 9-3 9H9s-3-2-3-9"/>
                                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                                </svg>
                            </span>
                            <div class="tip-content">
                                <div class="tip-title">温馨提示</div>
                                <div class="tip-text">
                                    当前访问的应用 ({{ resource?.name || '未知应用' }}) 遇到一些问题: 您没有权限访问该应用, 如需访问须提交访问申请。
                                </div>
                            </div>
                        </div>

                        <!-- 表单 -->
                        <form class="apply-form" @submit.prevent="handleSubmit">
                            <div class="form-row">
                                <label class="form-label">申请访问:</label>
                                <div class="form-value form-value-readonly">
                                    <span class="app-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                                        </svg>
                                    </span>
                                    <span class="app-name">{{ resource?.name || '—' }}</span>
                                </div>
                            </div>

                            <div class="form-row">
                                <label class="form-label"><span class="required">*</span>申请时长:</label>
                                <div class="form-value form-value-select">
                                    <select v-model="form.duration" class="form-select" required>
                                        <option value="">请选择</option>
                                        <option value="1">1天</option>
                                        <option value="3">3天</option>
                                        <option value="7">7天</option>
                                        <option value="15">15天</option>
                                        <option value="30">30天</option>
                                    </select>
                                    <span class="select-arrow">▼</span>
                                </div>
                            </div>

                            <div class="form-row">
                                <label class="form-label"><span class="required">*</span>有效期至:</label>
                                <div class="form-value form-value-datetime">
                                    <input
                                        v-model="form.startTime"
                                        type="datetime-local"
                                        class="form-datetime"
                                        required
                                    />
                                    <span class="datetime-sep">至</span>
                                    <input
                                        v-model="form.endTime"
                                        type="datetime-local"
                                        class="form-datetime"
                                        required
                                    />
                                </div>
                            </div>

                            <div class="form-row">
                                <label class="form-label"><span class="required">*</span>申请原因:</label>
                                <div class="form-value form-value-reason">
                                    <label class="radio-item">
                                        <input v-model="form.reasonType" type="radio" value="org" />
                                        <span>我所属组织架构均需要通过此应用开展业务工作</span>
                                    </label>
                                    <label class="radio-item">
                                        <input v-model="form.reasonType" type="radio" value="role" />
                                        <span>我因为岗位职责原因需要访问该应用</span>
                                    </label>
                                    <label class="radio-item">
                                        <input v-model="form.reasonType" type="radio" value="personal" />
                                        <span>我因为个人特殊原因需要访问该应用</span>
                                    </label>
                                    <textarea
                                        v-model="form.reasonDetail"
                                        class="form-textarea"
                                        placeholder="请填写详细访问理由 (需超过5个字)"
                                        rows="4"
                                        minlength="6"
                                    />
                                    <p v-if="errors.reasonDetail" class="form-error">{{ errors.reasonDetail }}</p>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn-submit">提交</button>
                                <button type="button" class="btn-cancel" @click="handleClose">取消</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Transition>
    </teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    resource: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'submit'])

const form = ref({
    duration: '7',
    startTime: '',
    endTime: '',
    reasonType: '',
    reasonDetail: ''
})

const errors = ref({})

watch(() => props.visible, (val) => {
    if (val) {
        errors.value = {}
        const now = new Date()
        const start = new Date(now)
        start.setSeconds(0, 0)
        const end = new Date(start)
        end.setDate(end.getDate() + 7)
        end.setHours(23, 59, 59, 0)
        form.value = {
            duration: '7',
            startTime: formatDateTimeLocal(start),
            endTime: formatDateTimeLocal(end),
            reasonType: '',
            reasonDetail: ''
        }
    }
})

watch(() => form.value.duration, (days) => {
    if (!props.visible || !form.value.startTime) return
    const start = new Date(form.value.startTime)
    const end = new Date(start)
    end.setDate(end.getDate() + (parseInt(days, 10) || 7))
    end.setHours(23, 59, 59, 0)
    form.value.endTime = formatDateTimeLocal(end)
})

function formatDateTimeLocal(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day}T${h}:${min}`
}

function handleClose() {
    emit('update:visible', false)
}

function validate() {
    const e = {}
    if (!form.value.reasonType) {
        e.reasonType = '请选择申请原因'
    }
    const detail = (form.value.reasonDetail || '').trim()
    if (detail.length > 0 && detail.length < 6) {
        e.reasonDetail = '详细理由需超过5个字'
    }
    if (form.value.reasonType && detail.length < 6) {
        e.reasonDetail = '请填写详细访问理由 (需超过5个字)'
    }
    errors.value = e
    return Object.keys(e).length === 0
}

function handleSubmit() {
    if (!validate()) return
    emit('submit', { ...form.value, resource: props.resource })
    handleClose()
}
</script>

<style scoped>
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
    border-radius: 8px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
}
.modal-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}
.modal-close {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s, background 0.2s;
}
.modal-close:hover {
    color: #1e293b;
    background: #f1f5f9;
}

.modal-body {
    padding: 20px 24px 24px;
    overflow-y: auto;
}

.tip-block {
    display: flex;
    gap: 12px;
    padding: 12px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    margin-bottom: 20px;
}
.tip-icon {
    color: #f59e0b;
    flex-shrink: 0;
}
.tip-content {
    flex: 1;
    min-width: 0;
}
.tip-title {
    font-size: 14px;
    font-weight: 600;
    color: #92400e;
    margin-bottom: 4px;
}
.tip-text {
    font-size: 13px;
    color: #b45309;
    line-height: 1.5;
}

.apply-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.form-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}
.form-label {
    width: 90px;
    flex-shrink: 0;
    font-size: 14px;
    color: #475569;
    padding-top: 8px;
}
.form-label .required {
    color: #ef4444;
    margin-right: 2px;
}
.form-value {
    flex: 1;
    min-width: 0;
}
.form-value-readonly {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    color: #1e293b;
}
.app-icon {
    width: 32px;
    height: 32px;
    background: #3b82f6;
    color: #fff;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.app-name {
    font-weight: 500;
}

.form-value-select {
    position: relative;
    max-width: 160px;
}
.form-value-select .form-select {
    width: 100%;
    height: 36px;
    padding: 8px 32px 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    color: #334155;
    background: #fff;
    appearance: none;
    cursor: pointer;
}
.form-value-select .select-arrow {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    color: #64748b;
    pointer-events: none;
}
.form-value-datetime {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.form-datetime {
    height: 36px;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    color: #334155;
    min-width: 180px;
}
.datetime-sep {
    font-size: 14px;
    color: #64748b;
}
.form-value-reason {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.radio-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #334155;
    cursor: pointer;
}
.radio-item input {
    width: 16px;
    height: 16px;
    accent-color: #3b82f6;
}
.form-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    color: #334155;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
}
.form-textarea::placeholder {
    color: #94a3b8;
}
.form-error {
    font-size: 12px;
    color: #ef4444;
    margin: 0;
}

.form-actions {
    display: flex;
    gap: 12px;
    padding-top: 8px;
}
.btn-submit {
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    background: #3b82f6;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}
.btn-submit:hover {
    background: #2563eb;
}
.btn-cancel {
    padding: 10px 24px;
    font-size: 14px;
    color: #475569;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
}
.btn-cancel:hover {
    background: #f8fafc;
    border-color: #94a3b8;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
    transform: scale(0.96);
}
.modal-box {
    transition: transform 0.2s ease;
}
</style>
