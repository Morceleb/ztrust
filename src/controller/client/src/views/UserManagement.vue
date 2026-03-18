<template>
    <div class="user-management">
        <!-- 搜索和操作栏 -->
        <div class="toolbar">
            <div class="search-box">
                <input type="text" v-model="searchKeyword" placeholder="搜索用户名或邮箱..." class="search-input" />
                <button class="search-btn" @click="handleSearch">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </button>
            </div>
            <div class="toolbar-actions">
                <button class="btn btn-primary" @click="handleAdd">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    添加用户
                </button>
            </div>
        </div>

        <!-- 数据表格 -->
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th width="60">序号</th>
                        <th>头像</th>
                        <th>用户名</th>
                        <th>邮箱</th>
                        <th>手机</th>
                        <th>状态</th>
                        <th>创建时间</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(user, index) in filteredUsers" :key="user.id">
                        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td>
                            <div class="user-avatar">
                                <img v-if="user.avatar" :src="user.avatar" alt="avatar" />
                                <span v-else class="avatar-placeholder">{{ user.username.charAt(0).toUpperCase() }}</span>
                            </div>
                        </td>
                        <td>{{ user.username }}</td>
                        <td>{{ user.email }}</td>
                        <td>{{ user.phone }}</td>
                        <td>
                            <span class="status-badge" :class="'status-' + user.status">{{ statusText(user.status) }}</span>
                        </td>
                        <td>{{ user.created_at }}</td>
                    </tr>
                    <tr v-if="filteredUsers.length === 0">
                        <td colspan="7" class="empty-cell">
                            <div class="empty-state">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                </svg>
                                <p>暂无用户数据</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="totalCount > 0">
            <span class="pagination-info">共 {{ totalCount }} 条记录</span>
            <div class="pagination-controls">
                <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
                <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
                <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
            </div>
        </div>

        <!-- 添加用户弹窗 -->
        <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
            <div class="modal">
                <div class="modal-header">
                    <h3>添加用户</h3>
                    <button class="modal-close" @click="showModal = false">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>用户名 <span class="required">*</span></label>
                        <input type="text" v-model="formData.username" placeholder="请输入用户名" />
                    </div>
                    <div class="form-group">
                        <label>密码 <span class="required">*</span></label>
                        <input type="password" v-model="formData.password" placeholder="请输入密码" />
                    </div>
                    <div class="form-group">
                        <label>邮箱</label>
                        <input type="email" v-model="formData.email" placeholder="请输入邮箱" />
                    </div>
                    <div class="form-group">
                        <label>手机</label>
                        <input type="text" v-model="formData.phone" placeholder="请输入手机号" />
                    </div>
                    <div class="form-group">
                        <label>头像URL</label>
                        <input type="text" v-model="formData.avatar" placeholder="请输入头像URL" />
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select v-model="formData.status">
                            <option value="active">正常</option>
                            <option value="frozen">冻结</option>
                            <option value="deleted">已删除</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="showModal = false">取消</button>
                    <button class="btn btn-primary" @click="handleSubmit">确定</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showModal = ref(false)

const users = ref([
    { id: 1, username: 'admin', password: '******', email: 'admin@company.com', phone: '13800138000', avatar: '', status: 'active', created_at: '2026-01-01 10:00:00', updated_at: '2026-01-01 10:00:00' },
    { id: 2, username: 'zhangsan', password: '******', email: 'zhangsan@company.com', phone: '13800138001', avatar: '', status: 'active', created_at: '2026-02-15 14:30:00', updated_at: '2026-02-15 14:30:00' },
    { id: 3, username: 'lisi', password: '******', email: 'lisi@company.com', phone: '13800138002', avatar: '', status: 'frozen', created_at: '2026-03-01 09:00:00', updated_at: '2026-03-10 16:00:00' }
])

const formData = ref({
    username: '',
    password: '',
    email: '',
    phone: '',
    avatar: '',
    status: 'active'
})

const statusText = (status) => {
    const map = { active: '正常', frozen: '冻结', deleted: '已删除' }
    return map[status] || status
}

const filteredUsers = computed(() => {
    if (!searchKeyword.value) return users.value
    const keyword = searchKeyword.value.toLowerCase()
    return users.value.filter(user =>
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    )
})

const totalCount = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)

const handleSearch = () => {
    currentPage.value = 1
}

const handleAdd = () => {
    formData.value = { username: '', password: '', email: '', phone: '', avatar: '', status: 'active' }
    showModal.value = true
}

const handleSubmit = () => {
    const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-')
    const newId = Math.max(...users.value.map(u => u.id), 0) + 1
    users.value.push({
        ...formData.value,
        id: newId,
        created_at: now,
        updated_at: now
    })
    showModal.value = false
}
</script>

<style scoped>
.user-management {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.search-box {
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border-radius: 8px;
    padding: 4px 12px;
}

.search-input {
    border: none;
    background: transparent;
    padding: 8px;
    outline: none;
    width: 200px;
    font-size: 14px;
}

.search-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #909399;
    padding: 4px;
}

.search-btn:hover {
    color: #409eff;
}

.toolbar-actions {
    display: flex;
    gap: 12px;
}

.btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    background: white;
    color: #606266;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn:hover {
    border-color: #409eff;
    color: #409eff;
}

.btn-primary {
    background: #409eff;
    border-color: #409eff;
    color: white;
}

.btn-primary:hover {
    background: #66b1ff;
    border-color: #66b1ff;
    color: white;
}

.table-container {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
}

.data-table th {
    background: #fafafa;
    font-weight: 600;
    color: #606266;
    font-size: 14px;
}

.data-table tbody tr:hover {
    background: #f5f7fa;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
    color: #fff;
    font-weight: 600;
    font-size: 14px;
}

.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
}

.status-active {
    background: #f6ffed;
    color: #52c41a;
}

.status-frozen {
    background: #fff7e6;
    color: #fa8c16;
}

.status-deleted {
    background: #f5f5f5;
    color: #999;
}

.empty-cell {
    text-align: center;
    padding: 60px 0 !important;
}

.empty-state {
    color: #909399;
}

.empty-state svg {
    margin-bottom: 16px;
}

.pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
}

.pagination-info {
    color: #909399;
    font-size: 14px;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.page-btn {
    padding: 6px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
    border-color: #409eff;
    color: #409eff;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-num {
    color: #606266;
    font-size: 14px;
}

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
    background: white;
    border-radius: 12px;
    width: 500px;
    max-width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #ebeef5;
}

.modal-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #909399;
    cursor: pointer;
}

.modal-close:hover {
    color: #303133;
}

.modal-body {
    padding: 24px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #606266;
    font-size: 14px;
}

.form-group label .required {
    color: #f56c6c;
    margin-left: 2px;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
    border-color: #409eff;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #ebeef5;
}
</style>
