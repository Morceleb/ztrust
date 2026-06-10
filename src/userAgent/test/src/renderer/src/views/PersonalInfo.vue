<template>
    <div class="profile-page">
        <header class="page-header">
            <button type="button" class="back-btn" @click="handleBack" aria-label="返回">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 class="page-title">个人信息</h1>
        </header>

        <div class="content">
            <div class="top-row">
                <div class="avatar-wrap" @click="triggerAvatarUpload">
                    <div class="avatar">
                        <img v-if="user.avatar" :src="user.avatar" alt="avatar" class="avatar-img" />
                        <span v-else class="avatar-initial">{{ userInitial }}</span>
                    </div>
                    <div class="avatar-hover">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <path
                                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span>更换头像</span>
                    </div>
                </div>
                <input type="file" ref="avatarInput" @change="handleAvatarChange" accept="image/*"
                    style="display: none;" />
                <div class="name-wrap">
                    <div class="name">{{ nickname || username }}</div>

                    <span class="status-badge" :class="'status-' + user.status">{{ statusText(user.status) }}</span>
                </div>
            </div>

            <div class="info-section">
                <h3 class="section-title">基本信息</h3>
                <div class="info-grid">
                    <div class="col">
                        <div class="kv">
                            <div class="k">昵称</div>
                            <div class="v">
                                {{ nickname || '-' }}
                                <button class="edit-icon" @click="openEditField('nickname')" title="编辑">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="kv">
                            <div class="k">用户名</div>
                            <div class="v">{{ username || '-' }}</div>
                        </div>
                    </div>

                    <div class="col right">
                        <div class="kv">
                            <div class="k">电子邮箱</div>
                            <div class="v">
                                {{ user.email || '-' }}
                                <button class="edit-icon" @click="openEditField('email')" title="编辑">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="kv">
                            <div class="k">手机号码</div>
                            <div class="v">
                                {{ user.phone || '-' }}
                                <button class="edit-icon" @click="openEditField('phone')" title="编辑">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h3 class="section-title">账号信息</h3>
                <div class="info-grid">
                    <div class="col">
                        <div class="kv">
                            <div class="k">创建时间</div>
                            <div class="v">{{ user.created_at || '-' }}</div>
                        </div>
                    </div>
                    <div class="col right">
                        <div class="kv">
                            <div class="k">更新时间</div>
                            <div class="v">{{ user.updated_at || '-' }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 单字段编辑弹窗 -->
        <div class="modal-overlay" v-if="showEditModal" @click.self="closeEditModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>编辑{{ fieldLabel }}</h3>
                    <button class="modal-close" @click="closeEditModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>{{ fieldLabel }} <span v-if="editingField === 'nickname'"
                                class="required">*</span></label>
                        <input v-if="editingField === 'nickname'" type="text" v-model="editForm.value"
                            placeholder="请输入昵称" />
                        <input v-else-if="editingField === 'email'" type="email" v-model="editForm.value"
                            placeholder="请输入电子邮箱" />
                        <input v-else-if="editingField === 'phone'" type="tel" v-model="editForm.value"
                            placeholder="请输入手机号码" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="closeEditModal">取消</button>
                    <button class="btn btn-primary" @click="saveField">保存</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import store from '@/store'

const router = useRouter()
const showEditModal = ref(false)
const editingField = ref('')
const avatarInput = ref(null)

// 从 store 读取用户信息
const user = computed(() => store.getters['auth/user'] || {})

// 昵称（displayName）
const nickname = computed(() => user.value?.displayName || user.value?.name || '')

// 用户名（name）
const username = computed(() => user.value?.name || '')

const editForm = ref({
    value: ''
})

const userInitial = computed(() => {
    const name = nickname.value || username.value
    return name ? name.charAt(0).toUpperCase() : '?'
})

const fieldLabel = computed(() => {
    const map = {
        nickname: '昵称',
        email: '电子邮箱',
        phone: '手机号码'
    }
    return map[editingField.value] || ''
})

const statusText = (status) => {
    const map = {
        active: '正常',
        frozen: '已冻结',
        deleted: '已删除'
    }
    return map[status] || status
}

const handleBack = () => {
    router.push('/')
}

// 头像上传
const triggerAvatarUpload = () => {
    avatarInput.value?.click()
}

const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
    }

    // 验证文件大小 (最大 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过 2MB')
        return
    }

    // 使用 FileReader 读取本地图片并转换为 Base64
    const reader = new FileReader()
    reader.onload = (e) => {
        const base64Image = e.target.result
        // 更新 store 中的头像
        store.commit('auth/SET_USER', {
            ...user.value,
            avatar: base64Image
        })
        // TODO: 调用后端接口上传头像
        console.log('上传头像:', base64Image.substring(0, 50) + '...')
    }
    reader.onerror = () => {
        alert('读取图片失败，请重试')
    }
    reader.readAsDataURL(file)

    // 清空 input，允许重复选择同一文件
    event.target.value = ''
}

// 单字段编辑
const openEditField = (field) => {
    editingField.value = field
    editForm.value = {
        value: field === 'nickname' ? (user.value?.displayName || '') :
            field === 'email' ? (user.value?.email || '') :
                (user.value?.phone || '')
    }
    showEditModal.value = true
}

const closeEditModal = () => {
    showEditModal.value = false
    editingField.value = ''
}

const saveField = () => {
    const value = editForm.value.value.trim()

    if (editingField.value === 'nickname') {
        if (!value) {
            alert('昵称不能为空')
            return
        }
        // 更新 store 中的 displayName
        store.commit('auth/SET_USER', {
            ...user.value,
            displayName: value
        })
    } else if (editingField.value === 'email') {
        store.commit('auth/SET_USER', {
            ...user.value,
            email: value
        })
    } else if (editingField.value === 'phone') {
        // 简单验证手机号格式
        if (value && !/^1[3-9]\d{9}$/.test(value)) {
            alert('请输入正确的手机号码')
            return
        }
        store.commit('auth/SET_USER', {
            ...user.value,
            phone: value
        })
    }

    // TODO: 调用后端接口更新用户信息
    console.log('保存字段:', editingField.value, '=', value)
    closeEditModal()
}
</script>

<style scoped>
.profile-page {
    min-height: 100vh;
    width: 100vw;
    background: #feffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #0f172a;
}

.page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;
}

.back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: #475569;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s, color 0.2s;
}

.back-btn:hover {
    background: #f1f5f9;
    color: #1e293b;
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.content {
    padding: 8px 24px 24px;
}

.top-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 0 24px;
}

.avatar-wrap {
    position: relative;
    cursor: pointer;
}

.avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: grid;
    place-items: center;
    color: #ffffff;
    font-weight: 700;
    font-size: 20px;
    overflow: hidden;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-initial {
    line-height: 1;
}

.avatar-hover {
    position: absolute;
    top: 0;
    left: 0;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: #ffffff;
    font-size: 10px;
    transition: display 0.2s;
}

.avatar-wrap:hover .avatar-hover {
    display: flex;
}

.name-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.name {
    font-size: 20px;
    font-weight: 700;
}

.status-badge {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    line-height: 1;
    font-weight: 600;
    width: fit-content;
}

.status-active {
    color: #16a34a;
    background: rgba(22, 163, 74, 0.10);
    border: 1px solid rgba(22, 163, 74, 0.18);
}

.status-frozen {
    color: #d97706;
    background: rgba(217, 119, 6, 0.10);
    border: 1px solid rgba(217, 119, 6, 0.18);
}

.status-deleted {
    color: #6b7280;
    background: rgba(107, 114, 128, 0.10);
    border: 1px solid rgba(107, 114, 128, 0.18);
}

.info-section {
    padding-top: 16px;
    border-top: 1px solid rgba(15, 23, 42, 0.06);
    margin-top: 16px;
}

.section-title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(15, 23, 42, 0.45);
    margin: 0 0 12px 0;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
}

.col {
    display: grid;
    gap: 18px;
}

.kv {
    display: grid;
    grid-template-columns: 100px 1fr;
    align-items: center;
    gap: 10px;
}

.k {
    font-size: 13px;
    color: rgba(15, 23, 42, 0.45);
}

.v {
    font-size: 14px;
    color: rgba(15, 23, 42, 0.82);
    display: flex;
    align-items: center;
    gap: 8px;
}

.v.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 13px;
}

.edit-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #94a3b8;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.edit-icon:hover {
    background: #eff6ff;
    color: #3b82f6;
}

/* 弹窗样式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal {
    background: #ffffff;
    border-radius: 12px;
    width: 380px;
    max-width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #94a3b8;
    cursor: pointer;
    line-height: 1;
}

.modal-close:hover {
    color: #475569;
}

.modal-body {
    padding: 24px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
}

.btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    color: #475569;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
}

.btn-primary {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #ffffff;
}

.btn-primary:hover {
    background: #2563eb;
    border-color: #2563eb;
}

.form-group {
    margin-bottom: 0;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #475569;
    font-size: 14px;
}

.form-group label .required {
    color: #ef4444;
    margin-left: 2px;
}

.form-group input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
}

.form-group input:focus {
    border-color: #3b82f6;
}

@media (max-width: 840px) {
    .info-grid {
        grid-template-columns: 1fr;
        gap: 18px;
    }

    .kv {
        grid-template-columns: 90px 1fr;
    }

    .content {
        padding: 8px 16px 24px;
    }
}
</style>
