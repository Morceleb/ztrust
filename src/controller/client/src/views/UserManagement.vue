<template>
    <div class="user-management">
        <!-- 搜索和操作栏 -->
        <div class="toolbar">
            <div class="search-box">
                <input type="text" v-model="searchKeyword" placeholder="搜索用户名、账号或邮箱..." class="search-input" />
                <button class="search-btn" @click="handleSearch">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </button>
            </div>
            <div class="toolbar-actions">
                <button class="btn btn-secondary import-btn-with-tip" @click="triggerFileInput">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    导入人员
                    <div class="import-tooltip">
                        <div class="import-tooltip-title">导入说明</div>
                        <div class="import-tooltip-row"><span class="import-tooltip-label">字段要求：</span><span>账号、用户名、邮箱、手机、密码（密码不填默认为 123456）</span></div>
                        <div class="import-tooltip-row"><span class="import-tooltip-label">格式要求：</span><span>账号仅支持英文字母、数字、下划线；邮箱需符合标准格式；手机需为纯数字，长度 7-15 位</span></div>
                    </div>
                </button>
                <input
                    ref="fileInputRef"
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style="display:none"
                    @change="handleFileChange"
                />
                <button class="btn btn-primary" @click="handleAdd">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    添加人员
                </button>
            </div>
        </div>

        <!-- 数据表格 -->
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="col-index">序号</th>
                        <th class="col-avatar">头像</th>
                        <th class="col-name">用户名</th>
                        <th class="col-account">账号</th>
                        <th class="col-email">邮箱</th>
                        <th class="col-phone">手机</th>
                        <th class="col-status">状态</th>
                        <th class="col-time">创建时间</th>
                        <th class="col-spa">安全码</th>
                        <th class="col-actions">操作</th>
                        
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(user, index) in pagedUsers" :key="user.id">
                        <td class="col-index">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td class="col-avatar">
                            <div class="user-avatar">
                                <img v-if="user.avatar" :src="user.avatar" alt="avatar" />
                                <span v-else class="avatar-placeholder">{{ (user.displayName || user.username || user.name || '?').charAt(0).toUpperCase() }}</span>
                            </div>
                        </td>
                        <td class="col-name">{{ user.displayName || '-' }}</td>
                        <td class="col-account">{{ user.name || user.username || '-' }}</td>
                        <td class="col-email">{{ user.email }}</td>
                        <td class="col-phone">{{ user.phone }}</td>
                        <td class="col-status">
                            <span class="status-badge" :class="'status-' + getUserStatus(user)">{{ statusText(getUserStatus(user)) }}</span>
                        </td>
                        <td class="col-time">{{ formatTime(user.createdTime) }}</td>
                        <td class="col-spa">
                            <span
                                class="spa-badge"
                                :class="[
                                    'spa-' + (user.spaStatus || 'none'),
                                    { 'spa-clickable': user.spaStatus === 'issued' || user.spaStatus === 'disabled' }
                                ]"
                                :title="getSpaStatusTooltip(user.spaStatus)"
                                @click="onViewTokenCode(user)"
                                :style="{ cursor: (user.spaStatus === 'issued' || user.spaStatus === 'disabled') ? 'pointer' : 'default' }"
                            >
                                {{ spaStatusText(user.spaStatus) }}
                            </span>
                        </td>
                        <td class="col-actions">
                            <div class="spa-actions">
                                <div class="spa-btn-group">
                                    <button
                                        type="button"
                                        class="spa-btn spa-btn-primary"
                                        :disabled="primarySpaDisabled(user)"
                                        @click="onPrimarySpa(user)"
                                    >
                                        {{ primarySpaLabel(user) }}
                                    </button>
                                    <button
                                        type="button"
                                        class="spa-btn spa-btn-secondary"
                                        :class="{ 'is-muted': secondarySpaDisabled(user) }"
                                        :disabled="secondarySpaDisabled(user)"
                                        @click="onSecondarySpa(user)"
                                    >
                                        {{ secondarySpaLabel(user) }}
                                    </button>
                                </div>
                                <div class="action-btn-group">
                                    <button class="action-btn action-edit" @click="handleEdit(user)" title="编辑">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        class="action-btn action-delete delete-btn"
                                        @click="handleDelete(user)"
                                        title="删除"
                                        :disabled="deletingUserId === user.id"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            <line x1="10" y1="11" x2="10" y2="17"/>
                                            <line x1="14" y1="11" x2="14" y2="17"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="filteredUsers.length === 0">
                        <td colspan="10" class="empty-cell">
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
                <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">首页</button>
                <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
                <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
                <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
                <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">尾页</button>
            </div>
        </div>

        <!-- 发放/更新成功：展示安全码 -->
        <div class="modal-overlay" v-if="showTokenModal" @click.self="showTokenModal = false">
            <div class="token-modal" @click.stop>
                <div class="modal-header">
                    <div class="modal-icon-wrap modal-icon-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <polyline points="9 12 11 14 15 10"/>
                        </svg>
                    </div>
                    <div class="modal-header-text">
                        <h3 class="modal-title">{{ tokenModalMode === 'issue' ? '安全码已发放' : '安全码已更新' }}</h3>
                        <p class="modal-subtitle">{{ tokenModalMode === 'issue' ? '新用户安全码已生成，请复制并安全交付给用户' : '安全码已轮转，旧码已失效，请复制并重新交付' }}</p>
                    </div>
                    <button type="button" class="modal-close-btn" @click="showTokenModal = false" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="token-card">
                        <div class="token-card-header">
                            <span class="token-card-label">安全码</span>
                            <button type="button" class="token-copy-btn" @click="copyToken">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                                复制
                            </button>
                        </div>
                        <div class="token-card-content">
                            <code class="token-code">{{ lastTokenHex }}</code>
                        </div>
                    </div>
                    <div class="token-tip">
                        <div class="token-tip-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <span>请妥善保管此安全码，切勿泄露给他人</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-confirm" @click="showTokenModal = false">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        我知道了
                    </button>
                </div>
            </div>
        </div>

        <!-- 轻提示 -->
        <div class="toast" v-if="toastMessage">{{ toastMessage }}</div>

        <!-- 添加/编辑人员弹窗 -->
        <div class="modal-overlay" v-if="showUserModal" @click.self="closeUserModal">
            <div class="add-user-modal" @click.stop>
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <div class="modal-icon-wrap" :class="userModalMode === 'add' ? 'icon-add' : 'icon-edit'">
                            <svg v-if="userModalMode === 'add'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </div>
                        <div class="modal-title-text">
                            <h3 class="modal-title">{{ userModalMode === 'add' ? '添加人员' : '编辑人员' }}</h3>
                            <p class="modal-subtitle">{{ userModalMode === 'add' ? '填写账号信息，创建新的用户' : '修改用户账号信息' }}</p>
                        </div>
                    </div>
                    <button type="button" class="modal-close" @click="closeUserModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body modal-body-user">
                    <div class="form-card form-card-user">
                        <div class="form-user-grid">
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>用户名 <span class="required">*</span></label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        <input type="text" v-model="userFormData.displayName" class="field-input" :class="{ 'field-error': userFormErrors.displayName }" placeholder="输入用户名" />
                                    </div>
                                    <span class="field-error-text" v-if="userFormErrors.displayName">{{ userFormErrors.displayName }}</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>账号 <span class="required">*</span></label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        <input type="text" v-model="userFormData.username" class="field-input" :class="{ 'field-error': userFormErrors.username }" placeholder="字母、数字或下划线" :disabled="userModalMode === 'edit'" />
                                    </div>
                                    <span class="field-error-text" v-if="userFormErrors.username">{{ userFormErrors.username }}</span>
                                    <span class="field-hint" v-if="userModalMode === 'add'">只能是字母、数字或下划线</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>密码</label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                        <input type="password" v-model="userFormData.password" class="field-input" :placeholder="userModalMode === 'add' ? '不填默认为 123456' : '不修改请留空'" />
                                    </div>
                                    <span class="field-hint">{{ userModalMode === 'add' ? '不填默认为 123456' : '不修改请留空，将保持原密码' }}</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>邮箱 <span class="required">*</span></label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                            <polyline points="22,6 12,13 2,6"/>
                                        </svg>
                                        <input type="email" v-model="userFormData.email" class="field-input" :class="{ 'field-error': userFormErrors.email }" placeholder="user@example.com" />
                                    </div>
                                    <span class="field-error-text" v-if="userFormErrors.email">{{ userFormErrors.email }}</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>手机号 <span class="required">*</span></label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                                            <line x1="12" y1="18" x2="12.01" y2="18"/>
                                        </svg>
                                        <input type="tel" v-model="userFormData.phone" class="field-input" :class="{ 'field-error': userFormErrors.phone }" placeholder="13800138000" />
                                    </div>
                                    <span class="field-error-text" v-if="userFormErrors.phone">{{ userFormErrors.phone }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer modal-footer-user">
                    <button type="button" class="btn-modal btn-modal-ghost" @click="closeUserModal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        取消
                    </button>
                    <button type="button" class="btn-modal btn-modal-primary" @click="handleUserSubmit" :disabled="submitting">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {{ submitting ? '提交中...' : (userModalMode === 'add' ? '确定添加' : '保存修改') }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 删除确认弹窗 -->
        <div class="modal-overlay" v-if="showDeleteModal" @click.self="cancelDelete">
            <div class="delete-confirm-dialog">
                <div class="delete-confirm-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h3 class="delete-confirm-title">确认删除</h3>
                <p class="delete-confirm-message">
                    确定要删除用户「<span class="delete-username">{{ deleteTarget?.displayName || deleteTarget?.username || deleteTarget?.name }}</span>」吗？
                </p>
                <p class="delete-confirm-hint">此操作不可恢复</p>
                <div class="delete-confirm-footer">
                    <button class="delete-btn-cancel" @click="cancelDelete">取消</button>
                    <button
                        class="delete-btn-confirm"
                        @click="confirmDelete"
                        :disabled="deletingUserId !== null"
                    >
                        {{ deletingUserId !== null ? '删除中...' : '确认删除' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 导入人员预览弹窗 -->
        <div class="modal-overlay" v-if="showImportModal" @click.self="closeImportModal">
            <div class="import-modal" @click.stop>
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <div class="modal-icon-wrap icon-import">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                        </div>
                        <div class="modal-title-text">
                            <h3 class="modal-title">导入人员</h3>
                            <p class="modal-subtitle">共检测到 <strong>{{ importPreviewData.length }}</strong> 条数据，确认后开始导入</p>
                        </div>
                    </div>
                    <button type="button" class="modal-close" @click="closeImportModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- 导入错误提示 -->
                <div class="import-error-banner" v-if="importErrors.length > 0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{{ importErrors.length }} 条数据格式异常（账号或用户名为空），已自动跳过</span>
                </div>

                <!-- 导入结果 -->
                <div class="import-result-banner" v-if="importResult !== null">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>导入完成：成功 <strong class="text-success">{{ importResult.success }}</strong> 条，失败 <strong class="text-fail">{{ importResult.failed }}</strong> 条</span>
                </div>

                <!-- 数据预览区 -->
                <div class="import-preview-wrap">
                    <table class="import-preview-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>账号</th>
                                <th>用户名</th>
                                <th>邮箱</th>
                                <th>手机</th>
                                <th v-if="!importResult">状态</th>
                                <th v-if="importResult">结果</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, index) in importPreviewData" :key="index" :class="{ 'error-row': row._error }">
                                <td>{{ index + 1 }}</td>
                                <td>{{ row.name }}</td>
                                <td>{{ row.displayName }}</td>
                                <td>{{ row.email || '-' }}</td>
                                <td>{{ row.phone || '-' }}</td>
                                <td v-if="!importResult">
                                    <span v-if="row._duplicate || row._invalid" class="import-status-fail">{{ row._error }}</span>
                                    <span v-else class="import-status-ok">待导入</span>
                                </td>
                                <td v-if="importResult">
                                    <span v-if="row._success" class="import-status-ok">成功</span>
                                    <span v-else class="import-status-fail">{{ row._error || '失败' }}</span>
                                </td>
                            </tr>
                            <tr v-if="importPreviewData.length === 0">
                                <td colspan="6" class="empty-cell">
                                    <div class="empty-state">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                        </svg>
                                        <p>未检测到有效数据</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="modal-footer modal-footer-import">
                    <div class="import-format-tip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Excel 格式：用户名（必填）、邮箱、手机号。密码不填默认为 <strong>123456</strong>
                    </div>
                    <div class="import-footer-btns">
                        <button type="button" class="btn-modal btn-modal-ghost" @click="closeImportModal">
                            {{ importResult !== null ? '关闭' : '取消' }}
                        </button>
                        <button
                            type="button"
                            class="btn-modal btn-modal-primary"
                            v-if="importResult === null"
                            :disabled="importing"
                            @click="confirmImport"
                        >
                            <svg v-if="!importing" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            {{ importing ? '导入中...' : '确认导入' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { listUsers, issueSpaToken as apiIssue, disableSpaToken as apiDisable, enableSpaToken as apiEnable, saveUser as apiSaveUser, deleteUser as apiDeleteUser, getTokenCode as apiGetTokenCode } from '@/api/user.js'
import { getSpaStatus } from '@/api/spaAdmin.js'
import { listRoleGroups, getRoleGroupDetail, assignUsersToRoleGroup } from '@/api/roleGroup.js'
import * as XLSX from 'xlsx'

const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(1) // 动态计算
const totalCount = ref(0)

// 动态计算 pageSize
const calculatePageSize = () => {
    nextTick(() => {
        const windowHeight = window.innerHeight
        const topAreaHeight = 220
        const paginationHeight = 80
        const rowHeight = 56 // 每行高度
        const availableHeight = windowHeight - topAreaHeight - paginationHeight
        const rows = Math.max(1, Math.floor(availableHeight / rowHeight))
        pageSize.value = rows
    })
}

const showTokenModal = ref(false)
const tokenModalMode = ref('issue') // 'issue' | 'rotate'
const lastTokenHex = ref('')
const toastMessage = ref('')
const loadingSpaUserId = ref(null)
const users = ref([])

// 缓存所有用户账号和邮箱（用于导入时检测系统重复）
const allUserNames = ref(new Set())
const allUserEmails = ref(new Set())
const allUserPhones = ref(new Set())

// 添加/编辑用户弹窗相关
const showUserModal = ref(false)
const userModalMode = ref('add')
const userFormErrors = ref({})
const submitting = ref(false)
const userFormData = ref({
    id: '',
    displayName: '',
    username: '',
    password: '',
    email: '',
    phone: ''
})

// 删除用户相关
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deletingUserId = ref(null)

// 导入人员相关
const fileInputRef = ref(null)
const showImportModal = ref(false)
const importPreviewData = ref([])
const importErrors = ref([])
const importResult = ref(null)
const importing = ref(false)

const handleDelete = (user) => {
    deleteTarget.value = user
    showDeleteModal.value = true
}

const cancelDelete = () => {
    showDeleteModal.value = false
    deleteTarget.value = null
}

const confirmDelete = async () => {
    if (!deleteTarget.value?.id) return
    const userId = deleteTarget.value.id
    deletingUserId.value = userId
    try {
        // 1. 先获取所有角色组，查找包含该用户的角色组
        const roleGroupsRes = await listRoleGroups()
        const groupList = Array.isArray(roleGroupsRes?.data) ? roleGroupsRes.data : (Array.isArray(roleGroupsRes) ? roleGroupsRes : [])
        const groupsWithUser = await Promise.all(
            groupList.map(async (group) => {
                try {
                    const detailRes = await getRoleGroupDetail(group.id)
                    if (detailRes.code === 200 && detailRes.data?.members) {
                        const members = detailRes.data.members
                        const normalized = members.map(m => ({ userId: m.userId || m.user_id || m.id, username: m.username || m.name || '' }))
                        return normalized.some(m => m.userId === userId) ? { id: group.id, members: normalized } : null
                    }
                } catch (e) {
                    console.error('获取角色组详情失败:', e)
                }
                return null
            })
        )
        const affectedGroups = groupsWithUser.filter(g => g !== null)

        // 2. 删除用户
        const res = await apiDeleteUser(userId)
        if (res.code !== 200) {
            showToast(res.message || '删除失败')
            return
        }

        // 3. 同步更新所有受影响角色组的成员列表（剔除已删除用户）
        await Promise.all(
            affectedGroups.map(async (group) => {
                const remaining = group.members.filter(m => m.userId !== userId).map(m => m.userId)
                try {
                    await assignUsersToRoleGroup({ role_group_id: group.id, user_ids: remaining })
                } catch (e) {
                    console.error('同步角色组成员失败:', e)
                }
            })
        )

        showToast('用户已删除')
        cancelDelete()
        await fetchUsers()
    } catch (e) {
        showToast(e?.message || '网络错误')
    } finally {
        deletingUserId.value = null
    }
}

// 导入人员
const triggerFileInput = () => {
    fileInputRef.value?.click()
}

const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    parseImportFile(file)
    e.target.value = ''
}

const parseImportFile = (file) => {
    importResult.value = null
    importErrors.value = []
    const reader = new FileReader()
    reader.onload = (evt) => {
        try {
            const data = new Uint8Array(evt.target.result)
            const workbook = XLSX.read(data, { type: 'array', cellDates: true })
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

            const normalizeRow = (row) => {
                const normalized = {}
                for (const [key, val] of Object.entries(row)) {
                    const cleanKey = String(key).replace(/[\s\uFEFF\xA0]+/g, '').trim()
                    normalized[cleanKey] = val
                }
                return normalized
            }

            const allRows = []
            const errors = []

            // 收集所有账号的用户名映射（用于提示冲突）
            const nameToUsers = {}
            const emailToUsers = {}
            const phoneToUsers = {}
            users.value.forEach(u => {
                const n = u.name || u.username || ''
                const e = u.email || ''
                const p = u.phone || ''
                if (n) nameToUsers[n] = u.displayName || n
                if (e) emailToUsers[e] = u.displayName || n
                if (p) phoneToUsers[p] = u.displayName || n
            })

            // 第一遍：解析所有行，记录格式错误（账号或用户名为空）
            json.forEach((row, index) => {
                row = normalizeRow(row)
                const name = String(row['账号'] || row['name'] || '').trim()
                const displayName = String(row['用户名'] || row['displayName'] || '').trim()
                const email = String(row['邮箱'] || row['email'] || '').trim()
                const phone = String(row['手机'] || row['phone'] || '').trim()

                // 校验账号不为空
                if (!name || !displayName) {
                    errors.push(index + 1)
                    return
                }

                // 校验账号不支持中文
                if (/[\u4e00-\u9fa5]/.test(name)) {
                    allRows.push({
                        name,
                        displayName,
                        email,
                        phone,
                        _error: '账号不支持中文，请修改为英文字母、数字或下划线',
                        _invalid: true
                    })
                    return
                }

                // 校验手机号格式（11位纯数字）
                if (phone && !/^\d{11}$/.test(phone)) {
                    allRows.push({
                        name,
                        displayName,
                        email,
                        phone,
                        _error: '手机号需为11位纯数字',
                        _invalid: true
                    })
                    return
                }

                allRows.push({
                    name,
                    displayName,
                    email,
                    phone
                })
            })

            // 第二遍：检测 name（账号）文件内重复（displayName 允许重复）
            const nameCount = {}
            allRows.forEach(row => {
                if (!row._invalid) {
                    nameCount[row.name] = (nameCount[row.name] || 0) + 1
                }
            })

            // 第三遍：检测系统中已有账号、邮箱、手机重复
            allRows.forEach(row => {
                if (row._invalid) return
                const dupErrors = []
                if (allUserNames.value.has(row.name)) {
                    const existUser = nameToUsers[row.name] || row.name
                    dupErrors.push(`账号「${row.name}」与「${existUser}」相同`)
                }
                if (row.email && String(row.email).trim() && allUserEmails.value.has(String(row.email).trim())) {
                    const existUser = emailToUsers[String(row.email).trim()] || row.email
                    dupErrors.push(`邮箱「${row.email}」与「${existUser}」相同`)
                }
                if (row.phone && String(row.phone).trim() && allUserPhones.value.has(String(row.phone).trim())) {
                    const existUser = phoneToUsers[String(row.phone).trim()] || row.phone
                    dupErrors.push(`手机「${row.phone}」与「${existUser}」相同`)
                }
                if (dupErrors.length > 0) {
                    row._duplicate = true
                    row._error = dupErrors.join('，') + '，请检查修改'
                }
            })

            // 第四遍：标记文件中账号重复（以第一个出现的为准）
            Object.keys(nameCount).forEach(name => {
                if (nameCount[name] > 1) {
                    const dupRows = allRows.filter(r => String(r.name).trim() === name && !r._invalid)
                    const firstName = dupRows[0]?.displayName || dupRows[0]?.name || ''
                    // 跳过第一个，后面重复的都提示与第一个重复
                    dupRows.slice(1).forEach(row => {
                        row._duplicate = true
                        row._error = row._error ? row._error + `；账号「${name}」与「${firstName}」重复` : `账号「${name}」与「${firstName}」重复`
                    })
                }
            })

            // 第五遍：检测文件中邮箱重复（以第一个出现的为准）
            const emailCount = {}
            allRows.forEach(row => {
                if (row.email && String(row.email).trim()) {
                    const email = String(row.email).trim()
                    if (!emailCount[email]) emailCount[email] = []
                    emailCount[email].push(row)
                }
            })
            Object.keys(emailCount).forEach(email => {
                if (emailCount[email].length > 1) {
                    const rows = emailCount[email]
                    const firstName = rows[0]?.displayName || rows[0]?.name || ''
                    // 跳过第一个，后面重复的都提示与第一个重复
                    rows.slice(1).forEach(row => {
                        row._duplicate = true
                        row._error = row._error ? row._error + `；邮箱「${email}」与「${firstName}」重复` : `邮箱「${email}」与「${firstName}」重复`
                    })
                }
            })

            // 第六遍：检测文件中手机号重复（以第一个出现的为准）
            const phoneCount = {}
            allRows.forEach(row => {
                if (row.phone && String(row.phone).trim()) {
                    const phone = String(row.phone).trim()
                    if (!phoneCount[phone]) phoneCount[phone] = []
                    phoneCount[phone].push(row)
                }
            })
            Object.keys(phoneCount).forEach(phone => {
                if (phoneCount[phone].length > 1) {
                    const rows = phoneCount[phone]
                    const firstName = rows[0]?.displayName || rows[0]?.name || ''
                    // 跳过第一个，后面重复的都提示与第一个重复
                    rows.slice(1).forEach(row => {
                        row._duplicate = true
                        row._error = row._error ? row._error + `；手机「${phone}」与「${firstName}」重复` : `手机「${phone}」与「${firstName}」重复`
                    })
                }
            })

            importErrors.value = errors
            importPreviewData.value = allRows
            showImportModal.value = true

            if (allRows.length === 0) {
                showToast('文件中未检测到有效数据，请检查格式')
            } else {
                const dupRows = allRows.filter(r => r._duplicate)
                if (dupRows.length > 0) {
                    showToast(`检测到 ${dupRows.length} 条数据存在重复，已标记`)
                }
            }
        } catch (err) {
            console.error('parseImportFile error:', err)
            console.error('Error stack:', err.stack)
            let errorMsg = '文件解析失败，请确认是有效的 Excel 或 CSV 文件'
            if (err.name === 'TypeError' && err.message.includes('read')) {
                errorMsg = '浏览器不支持此文件格式，请使用 Chrome、Edge 或 Firefox 浏览器'
            }
            showToast(errorMsg)
        }
    }
    reader.readAsArrayBuffer(file)
}

const closeImportModal = () => {
    showImportModal.value = false
    importPreviewData.value = []
    importErrors.value = []
    importResult.value = null
    importing.value = false
}

const confirmImport = async () => {
    if (!importPreviewData.value.length) return
    importing.value = true
    let success = 0
    let failed = 0

    for (const row of importPreviewData.value) {
        // 跳过有问题的数据（格式错误或重复）
        if (row._invalid || row._duplicate) {
            continue
        }
        try {
            const payload = {
                name: row.name,
                displayName: row.displayName,
                password: row.password || '123456',
                ...(row.email && { email: row.email }),
                ...(row.phone && { phone: row.phone })
            }
            const res = await apiSaveUser(payload)
            if (res.code === 200) {
                row._success = true
                success++
            } else {
                row._success = false
                row._error = res.message || '导入失败'
                failed++
            }
        } catch {
            row._success = false
            row._error = '网络错误'
            failed++
        }
    }

    importResult.value = { success, failed }
    importing.value = false

    const validCount = importPreviewData.value.filter(r => !r._invalid && !r._duplicate).length
    const skipCount = importPreviewData.value.length - validCount

    if (success > 0) {
        showToast(`导入完成：成功 ${success} 条${skipCount > 0 ? `，跳过 ${skipCount} 条问题数据` : ''}`)
        await fetchUsers()
    } else {
        showToast('没有可导入的数据，请检查数据格式或重复问题')
    }
}

let toastTimer = null
function showToast(msg, ms = 3200) {
    toastMessage.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastMessage.value = '' }, ms)
}

async function fetchUsers() {
    loading.value = true
    try {
        const res = await listUsers({ page: currentPage.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined })
        if (res.code === 200 && res.data) {
            // 标准结构：{ code: 200, data: { list: [...], total: N } }
            users.value = Array.isArray(res.data.list) ? res.data.list : (Array.isArray(res.data) ? res.data : [])
            totalCount.value = res.data.total || users.value.length
        } else if (Array.isArray(res)) {
            // 后端直接返回数组：[{...}, {...}]
            users.value = res
            totalCount.value = res.length
        }
        // 更新所有用户账号和邮箱缓存（用于导入时检测重复）
        allUserNames.value = new Set(users.value.map(u => u.name).filter(Boolean))
        allUserEmails.value = new Set(users.value.map(u => u.email).filter(Boolean))
        allUserPhones.value = new Set(users.value.map(u => u.phone).filter(Boolean))
        // 获取每个用户的安全码状态
        await fetchSpaStatusAll()
    } catch (e) {
        showToast(e?.message || '加载用户列表失败')
    } finally {
        loading.value = false
    }
}

async function fetchSpaStatusAll() {
    if (!users.value.length) return
    const ids = users.value.map(u => u.id)
    const results = await Promise.allSettled(ids.map(id => getSpaStatus(id)))
    results.forEach((result, index) => {
        const i = findUserIndex(ids[index])
        if (i === -1) return
        if (result.status === 'fulfilled' && typeof result.value === 'object' && result.value.code === 200) {
            // data: -1 未发放, 0 已禁用, 1 已启用
            const statusMap = { '-1': 'none', '0': 'disabled', '1': 'issued' }
            users.value[i].spaStatus = statusMap[String(result.value.data)] || 'none'
        } else {
            users.value[i].spaStatus = users.value[i].spaStatus || 'none'
        }
    })
}

onMounted(() => {
    calculatePageSize()
    window.addEventListener('resize', calculatePageSize)
    fetchUsers()
})

onUnmounted(() => {
    window.removeEventListener('resize', calculatePageSize)
})

const handleSearch = () => {
    currentPage.value = 1
    fetchUsers()
}

function findUserIndex(id) {
    return users.value.findIndex(u => u.id === id)
}

function setUserSpaStatus(userId, status) {
    const i = findUserIndex(userId)
    if (i !== -1) users.value[i].spaStatus = status
}

const spaStatusText = (s) => {
    const map = { none: '未发放', issued: '已发放', disabled: '已禁用', updating: '更新中' }
    return map[s] || map.none
}

const primarySpaLabel = (user) => {
    const s = user.spaStatus || 'none'
    if (s === 'none') return '发放安全码'
    return '更新安全码'
}

const secondarySpaLabel = (user) => {
    const s = user.spaStatus || 'none'
    if (s === 'none') return '禁用安全码'
    if (s === 'disabled') return '启用安全码'
    return '禁用安全码'
}

const primarySpaDisabled = (user) => {
    const s = user.spaStatus || 'none'
    if (s === 'updating') return true
    if (s === 'disabled') return true
    return loadingSpaUserId.value === user.id
}

const secondarySpaDisabled = (user) => {
    const s = user.spaStatus || 'none'
    if (s === 'none') return true
    if (s === 'updating') return true
    return loadingSpaUserId.value === user.id
}

const getSpaStatusTooltip = (status) => {
    if (status === 'none') return '请先发放安全码'
    if (status === 'issued' || status === 'disabled') return '点击查看安全码'
    return ''
}

async function onViewTokenCode(user) {
    if (user.spaStatus === 'none') return
    try {
        const res = await apiGetTokenCode(user.id)
        if (res.code === 200 && res.data) {
            lastTokenHex.value = res.data
            showTokenModal.value = true
        } else {
            showToast(res.message || '获取安全码失败')
        }
    } catch (e) {
        console.error('获取安全码异常:', e)
        showToast('获取安全码失败，请稍后重试')
    }
}

async function onPrimarySpa(user) {
    const s = user.spaStatus || 'none'
    const rotate = s !== 'none'
    const spaBeforeRotate = s
    loadingSpaUserId.value = user.id
    if (rotate) setUserSpaStatus(user.id, 'updating')
    try {
        console.log('发放安全码请求:', { userId: user.id, rotate })
        const res = await apiIssue(user.id, rotate)
        console.log('发放安全码响应:', res)
        if (res.code === 200 && typeof res.data === 'string' && res.data) {
            lastTokenHex.value = res.data
            showTokenModal.value = true
            setUserSpaStatus(user.id, 'issued')
            showToast(rotate ? '安全码已轮转' : '安全码已发放')
            return
        }
        if (res.code === 500 && String(res.message || '').includes('已有安全码')) {
            setUserSpaStatus(user.id, 'issued')
            showToast('该用户已有安全码，请使用「更新安全码」轮转')
            return
        }
        showToast(res.message || '操作失败')
    } catch (e) {
        console.error('发放安全码异常:', e)
        showToast(e?.message || '网络错误')
    } finally {
        loadingSpaUserId.value = null
        const i = findUserIndex(user.id)
        if (i !== -1 && users.value[i].spaStatus === 'updating') {
            users.value[i].spaStatus = spaBeforeRotate === 'disabled' ? 'disabled' : 'issued'
        }
    }
}

async function onSecondarySpa(user) {
    const s = user.spaStatus || 'none'
    if (s === 'none') return
    loadingSpaUserId.value = user.id
    try {
        if (s === 'disabled') {
            const res = await apiEnable(user.id)
            if (res.code === 200 && Number(res.data) > 0) {
                setUserSpaStatus(user.id, 'issued')
                showToast('安全码已启用')
            } else {
                showToast(res.message || '启用失败')
            }
        } else {
            const res = await apiDisable(user.id)
            if (res.code === 200 && Number(res.data) > 0) {
                setUserSpaStatus(user.id, 'disabled')
                showToast('安全码已禁用')
            } else {
                showToast(res.message || '禁用失败')
            }
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    } finally {
        loadingSpaUserId.value = null
    }
}

async function copyToken() {
    try {
        await navigator.clipboard.writeText(lastTokenHex.value)
        showToast('已复制到剪贴板', 2000)
    } catch {
        showToast('复制失败，请手动选择复制')
    }
}

// 添加人员
const handleAdd = () => {
    userModalMode.value = 'add'
    userFormData.value = {
        id: '',
        displayName: '',
        username: '',
        password: '',
        email: '',
        phone: ''
    }
    userFormErrors.value = {}
    showUserModal.value = true
}

// 编辑人员
const handleEdit = (user) => {
    userModalMode.value = 'edit'
    userFormData.value = {
        id: user.id,
        displayName: user.displayName || '',
        username: user.name || user.username || '',
        password: '',
        email: user.email || '',
        phone: user.phone || ''
    }
    userFormErrors.value = {}
    showUserModal.value = true
}

// 关闭用户弹窗
const closeUserModal = () => {
    showUserModal.value = false
    userFormErrors.value = {}
}

// 提交用户表单
const handleUserSubmit = async () => {
    userFormErrors.value = {}

    // 用户名（displayName）必填校验
    if (!userFormData.value.displayName || userFormData.value.displayName.trim() === '') {
        userFormErrors.value.displayName = '请输入用户名'
    }

    // 账号（name）必填校验
    if (!userFormData.value.username || userFormData.value.username.trim() === '') {
        userFormErrors.value.username = '请输入账号'
    } else if (!/^[a-zA-Z0-9_]+$/.test(userFormData.value.username)) {
        userFormErrors.value.username = '账号只能包含字母、数字或下划线'
    }

    // 邮箱必填校验
    if (!userFormData.value.email || userFormData.value.email.trim() === '') {
        userFormErrors.value.email = '请输入邮箱'
    }

    // 手机号必填校验（11位纯数字）
    if (!userFormData.value.phone || userFormData.value.phone.trim() === '') {
        userFormErrors.value.phone = '请输入手机号'
    } else if (!/^\d{11}$/.test(userFormData.value.phone)) {
        userFormErrors.value.phone = '手机号需为11位纯数字'
    }

    if (Object.keys(userFormErrors.value).length > 0) return

    submitting.value = true
    try {
        // 如果新增时未设置密码，默认为 123456
        const password = userFormData.value.password?.trim() || '123456'
        const payload = {
            ...(userFormData.value.id && { id: userFormData.value.id }),
            name: userFormData.value.username.trim(),
            displayName: userFormData.value.displayName.trim(),
            password: password,
            ...(userFormData.value.email && { email: userFormData.value.email.trim() }),
            ...(userFormData.value.phone && { phone: userFormData.value.phone.trim() }),
            status: 'active'
        }

        console.log('提交用户数据:', payload)
        const res = await apiSaveUser(payload)

        if (res.code === 200) {
            showToast(userModalMode.value === 'add' ? '用户添加成功' : '用户信息已更新')
            closeUserModal()
            currentPage.value = 1
            await fetchUsers()
        } else {
            showToast(res.message || '操作失败，错误码：' + res.code)
        }
    } catch (e) {
        showToast(e?.message || '网络错误，请检查网络或后端服务')
    } finally {
        submitting.value = false
    }
}

const statusText = (status) => {
    const map = { active: '正常', frozen: '冻结', deleted: '已删除' }
    return map[status] || status || 'active'
}

const getUserStatus = (user) => {
    if (user.isDeleted) return 'deleted'
    if (user.isForbidden) return 'frozen'
    return 'active'
}

const formatTime = (time) => {
    if (!time) return '-'
    return time.replace('T', ' ').substring(0, 19)
}

const filteredUsers = computed(() => {
    if (!searchKeyword.value) return users.value
    const keyword = searchKeyword.value.toLowerCase()
    return users.value.filter(user =>
        (user.displayName || '').toLowerCase().includes(keyword) ||
        (user.name || user.username || '').toLowerCase().includes(keyword) ||
        (user.email || '').toLowerCase().includes(keyword)
    )
})

const pagedUsers = computed(() => {
    const list = filteredUsers.value
    const start = (currentPage.value - 1) * pageSize.value
    return list.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)
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

.table-container {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.data-table th,
.data-table td {
    padding: 12px 10px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 各列固定宽度 */
.col-index {
    width: 50px;
    min-width: 50px;
}

.col-avatar {
    width: 50px;
    min-width: 50px;
    text-align: center;
}

.data-table th.col-avatar,
.data-table td.col-avatar {
    text-align: center;
}

.col-status {
    width: 90px;
    min-width: 90px;
    text-align: center;
}

.data-table th.col-status,
.data-table td.col-status {
    text-align: center;
}

.col-spa {
    width: 90px;
    min-width: 90px;
    text-align: center;
}

.data-table th.col-spa,
.data-table td.col-spa {
    text-align: center;
}

.col-actions {
    width: 320px;
    min-width: 320px;
    box-sizing: border-box;
}

/* 表头 */
.data-table th.col-actions {
    width: 320px;
    min-width: 320px;
    text-align: left !important;
    padding-left: 70px !important;
    box-sizing: border-box;
}

/* 内容 */
.data-table td.col-actions {
    padding: 0 16px 0 70px !important;
    box-sizing: border-box;
}

/* 按钮容器 */
.col-actions .spa-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

/* 让删除按钮自动顶到最右 */
.col-actions .spa-actions .delete-btn {
    margin-left: auto;
}



.col-name {
    width: 100px;
    min-width: 100px;
}

.col-account {
    width: 160px;
    min-width: 140px;
}

.col-email {
    width: 200px;
    min-width: 180px;
}

.col-phone {
    width: 140px;
    min-width: 120px;
}

.col-status {
    width: 90px;
    min-width: 90px;
    text-align: center;
}

.col-time {
    width: 160px;
    min-width: 140px;
}

.col-spa {
    width: 90px;
    min-width: 90px;
    text-align: center;
}

.data-table th {
    background: #fafafa;
    font-weight: 600;
    color: #606266;
    font-size: 14px;
    text-align: left;
    padding-left: 12px;
}

.data-table td {
    text-align: left;
    padding-left: 12px;
}

.data-table tbody tr:hover {
    background: #f5f7fa;
}

.data-table tbody tr {
    height: 56px;
}

.data-table td {
    vertical-align: middle;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 56px;
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

.spa-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
}

.spa-none {
    background: #f4f4f5;
    color: #909399;
}

.spa-issued {
    background: #ecfdf5;
    color: #059669;
}

.spa-disabled {
    background: #fef2f2;
    color: #dc2626;
}

.spa-updating {
    background: #eff6ff;
    color: #2563eb;
}

.spa-clickable {
    cursor: pointer;
    transition: all 0.2s;
}

.spa-clickable:hover {
    opacity: 0.8;
    transform: scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.spa-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: space-between;
}

.spa-btn-group {
    display: flex;
    gap: 6px;
    align-items: center;
}

.action-btn-group {
    display: flex;
    gap: 6px;
    align-items: center;
}

.spa-btn {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.2s, border-color 0.2s, opacity 0.2s;
}

.spa-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.spa-btn-primary {
    background: #409eff;
    border-color: #409eff;
    color: #fff;
}

.spa-btn-primary:hover:not(:disabled) {
    background: #66b1ff;
    border-color: #66b1ff;
}

.spa-btn-secondary {
    background: #fff;
    border-color: #e2e8f0;
    color: #475569;
}

.spa-btn-secondary:hover:not(:disabled) {
    border-color: #409eff;
    color: #409eff;
}

.spa-btn-secondary.is-muted {
    opacity: 0.45;
}

.token-modal {
    width: 100%;
    max-width: 460px;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    animation: modal-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-pop {
    from { opacity: 0; transform: scale(0.88) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

.token-modal .modal-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px 24px 20px;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border-bottom: 1px solid #d1fae5;
}

.modal-icon-success {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
    flex-shrink: 0;
}

.modal-header-text {
    flex: 1;
    min-width: 0;
}

.modal-header-text .modal-title {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 700;
    color: #064e3b;
    letter-spacing: -0.02em;
}

.modal-header-text .modal-subtitle {
    margin: 0;
    font-size: 13px;
    color: #059669;
    line-height: 1.5;
}

.modal-close-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.7);
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.modal-close-btn:hover {
    background: #fff;
    color: #1e293b;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.token-modal .modal-body {
    padding: 24px;
}

.token-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
}

.token-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #f1f5f9;
}

.token-card-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.token-copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    background: linear-gradient(135deg, #409eff, #3a8ee6);
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
}

.token-copy-btn:hover {
    background: linear-gradient(135deg, #66b1ff, #409eff);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    transform: translateY(-1px);
}

.token-card-content {
    padding: 18px 16px;
}

.token-code {
    display: block;
    font-size: 18px;
    font-weight: 600;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
    word-break: break-all;
    color: #0f172a;
    line-height: 1.6;
    letter-spacing: 0.02em;
}

.token-tip {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding: 12px 14px;
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    border: 1px solid #fde68a;
    border-radius: 10px;
}

.token-tip-icon {
    color: #d97706;
    flex-shrink: 0;
}

.token-tip span {
    font-size: 13px;
    color: #92400e;
    line-height: 1.4;
}

.token-modal .modal-footer {
    display: flex;
    justify-content: center;
    padding: 16px 24px 24px;
}

.btn-confirm {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 32px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
}

.btn-confirm:hover {
    background: linear-gradient(135deg, #34d399, #10b981);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
    transform: translateY(-2px);
}

/* 遮罩层 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

/* 弹窗头部 */
.modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 24px 0;
    gap: 12px;
}

.token-hex {
    flex: 1;
    display: block;
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 13px;
    word-break: break-all;
    color: #0f172a;
    line-height: 1.5;
}

.token-display {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.token-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    letter-spacing: 0.02em;
}

.token-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 4px 4px 4px 4px;
    transition: border-color 0.2s;
}

.token-box:focus-within {
    border-color: #409eff;
}

.token-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: #fffbeb;
    border-radius: 8px;
    color: #d97706;
    font-size: 13px;
    margin-top: 12px;
}

/* 安全码 Token 展示区（发放/更新成功弹窗） */
/* 原有 .spa-token-section 等已移除，仅保留 token-display（用于发放成功弹窗） */

/* 安全码操作按钮（用于发放成功弹窗） */

.btn-copy {
    flex-shrink: 0;
    padding: 10px 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #409eff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
}

.btn-copy:hover {
    border-color: #409eff;
    background: #f0f9ff;
}

.toast {
    position: fixed;
    left: 50%;
    bottom: 32px;
    transform: translateX(-50%);
    z-index: 1100;
    padding: 10px 18px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.92);
    color: #fff;
    font-size: 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    max-width: min(90vw, 420px);
    text-align: center;
}

.data-table td.empty-cell {
    text-align: center !important;
    padding: 60px 16px !important;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;
}

.empty-state svg {
    display: block;
    margin: 0 auto 16px;
}

.empty-state p {
    margin: 0;
    text-align: center;
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

/* 工具栏按钮样式 */
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

.import-btn-with-tip {
    position: relative;
}

.import-tooltip {
    position: absolute;
    top: calc(100% + 10px);
    left: -80px;
    z-index: 100;
    display: none;
    width: 320px;
    padding: 14px 16px;
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    text-align: left;
}

.import-btn-with-tip:hover .import-tooltip {
    display: block;
}

.import-tooltip::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 100px;
    width: 10px;
    height: 10px;
    background: white;
    border-top: 1px solid #e4e7ed;
    border-left: 1px solid #e4e7ed;
    transform: rotate(45deg);
}

.import-tooltip-title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #ebeef5;
}

.import-tooltip-row {
    display: flex;
    font-size: 12px;
    line-height: 1.8;
    color: #606266;
}

.import-tooltip-label {
    color: #409eff;
    font-weight: 500;
    min-width: 70px;
    flex-shrink: 0;
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

.btn-secondary {
    background: #fff;
    border-color: #dcdfe6;
    color: #606266;
}

.btn-secondary:hover {
    border-color: #409eff;
    color: #409eff;
}

/* 添加/编辑用户弹窗 */
.add-user-modal {
    width: 100%;
    max-width: 680px;
    max-height: none;
    overflow: hidden;
    background: #fff;
    border-radius: 28px;
    box-shadow: 0 28px 72px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04);
    animation: modal-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-user-modal .modal-header {
    padding: 18px 28px 14px;
    border-radius: 28px 28px 0 0;
}

.add-user-modal .modal-icon-wrap {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
}

.add-user-modal .modal-icon-wrap.icon-add {
    background: linear-gradient(135deg, #e0f2fe, #dbeafe);
    color: #3b82f6;
}

.add-user-modal .modal-icon-wrap.icon-edit {
    background: linear-gradient(135deg, #fef3c7, #fef9c3);
    color: #f59e0b;
}

.add-user-modal .modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
}

.add-user-modal .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.add-user-modal .modal-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
}

.add-user-modal .modal-close:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.add-user-modal .form-card {
    background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    padding: 20px;
}

.add-user-modal .form-field-group {
    padding: 0 0 4px;
}

.add-user-modal .form-field-group + .form-field-group {
    border-top: 1px solid #f1f5f9;
    padding-top: 16px;
    margin-top: 12px;
}

.add-user-modal .form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.add-user-modal .form-field label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    letter-spacing: 0.01em;
}

.add-user-modal .form-field label .required {
    color: #f56c6c;
    margin-left: 2px;
}

.add-user-modal .input-wrapper {
    position: relative;
}

.add-user-modal .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
}

.add-user-modal .field-input {
    width: 100%;
    padding: 11px 14px 11px 40px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    color: #0f172a;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}

.add-user-modal .field-input::placeholder {
    color: #94a3b8;
}

.add-user-modal .field-input:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.add-user-modal .field-input:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
}

.add-user-modal .field-error {
    border-color: #f56c6c !important;
    box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.12) !important;
}

.add-user-modal .field-error-text {
    font-size: 12px;
    color: #f56c6c;
}

.add-user-modal .field-hint {
    font-size: 12px;
    color: #94a3b8;
}

.add-user-modal .select-wrapper {
    position: relative;
}

.add-user-modal .select-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
}

.add-user-modal .field-select {
    width: 100%;
    padding: 11px 14px 11px 40px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    color: #0f172a;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394A3B8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
    cursor: pointer;
}

.add-user-modal .field-select:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

/* 账号状态开关样式 */
.form-field-status {
    padding-top: 16px;
    margin-top: 4px;
    border-top: 1px solid #f1f5f9;
}

.status-toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 14px;
}

.status-toggle {
    position: relative;
    width: 48px;
    height: 26px;
    background: #e2e8f0;
    border-radius: 13px;
    cursor: pointer;
    transition: background 0.25s;
}

.status-toggle.is-frozen {
    background: linear-gradient(90deg, #f59e0b, #d97706);
}

.status-toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.status-toggle.is-frozen .status-toggle-knob {
    transform: translateX(22px);
}

.status-toggle-label {
    font-size: 15px;
    font-weight: 600;
    color: #52c41a;
    transition: color 0.2s;
    min-width: 32px;
}

.status-toggle-label.label-frozen {
    color: #f59e0b;
}

.add-user-modal .modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 18px 28px 24px;
    background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
    border-top: 1px solid #f1f5f9;
}

.add-user-modal .btn-modal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 108px;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.add-user-modal .btn-modal-ghost {
    border: 1.5px solid #e2e8f0;
    background: #fff;
    color: #64748b;
}

.add-user-modal .btn-modal-ghost:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
}

.add-user-modal .btn-modal-primary {
    border: none;
    background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.35);
}

.add-user-modal .btn-modal-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.45);
    transform: translateY(-1px);
}

.add-user-modal .btn-modal-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

@keyframes modal-in {
    from { opacity: 0; transform: scale(0.9) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

.add-user-modal .modal-title {
    font-size: 19px;
}

.add-user-modal .modal-subtitle {
    margin-top: 4px;
    font-size: 13px;
}

.add-user-modal .modal-body-user {
    padding: 14px 28px 8px;
}

.add-user-modal .modal-footer-user {
    padding: 16px 28px 22px;
    border-radius: 0 0 28px 28px;
}

.add-user-modal .form-card-user {
    padding: 16px 18px;
    border-radius: 18px;
}

.add-user-modal .form-user-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 22px;
    align-items: start;
}

.add-user-modal .form-field-group {
    padding: 0;
    margin: 0;
}

.add-user-modal .form-field-group + .form-field-group {
    border: none;
    padding-top: 0;
    margin-top: 0;
}

.add-user-modal .form-field {
    gap: 6px;
}

.add-user-modal .form-field label {
    font-size: 13px;
}

.add-user-modal .field-input {
    padding: 9px 12px 9px 38px;
    font-size: 14px;
    border-radius: 12px;
}

.add-user-modal .input-icon {
    left: 12px;
}

.add-user-modal .field-hint {
    font-size: 12px;
    color: #94a3b8;
}

/* 操作列编辑按钮 */
.action-buttons {
    display: flex;
    gap: 6px;
}

.action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-edit {
    background: #e6f7ff;
    color: #1890ff;
}

.action-edit:hover {
    background: #1890ff;
    color: #fff;
}

.user-actions {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #e2e8f0;
}

.action-delete {
    background: #fff1f0;
    color: #ff4d4f;
}

.action-delete:hover {
    background: #ff4d4f;
    color: #fff;
}

.action-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 删除确认弹窗样式 */
.delete-confirm-dialog {
    background: #fff;
    border-radius: 16px;
    padding: 32px 28px 24px;
    width: 360px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    animation: dialogEnter 0.2s ease-out;
}

@keyframes dialogEnter {
    from {
        opacity: 0;
        transform: scale(0.92);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.delete-confirm-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #fff1f0, #ffebe9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff4d4f;
}

.delete-confirm-title {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
}

.delete-confirm-message {
    margin: 0 0 6px;
    font-size: 14px;
    color: #64748b;
    line-height: 1.6;
}

.delete-username {
    color: #1a1a2e;
    font-weight: 600;
}

.delete-confirm-hint {
    margin: 0 0 24px;
    font-size: 13px;
    color: #94a3b8;
}

.delete-confirm-footer {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.delete-btn-cancel {
    flex: 1;
    padding: 10px 20px;
    background: #f1f5f9;
    color: #64748b;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.delete-btn-cancel:hover {
    background: #e2e8f0;
    color: #475569;
}

.delete-btn-confirm {
    flex: 1;
    padding: 10px 20px;
    background: linear-gradient(135deg, #ff4d4f, #ff7875);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.delete-btn-confirm:hover:not(:disabled) {
    background: linear-gradient(135deg, #ff7875, #ff4d4f);
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.delete-btn-confirm:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* 导入弹窗 */
.import-modal {
    width: 100%;
    max-width: 720px;
    max-height: 90vh;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 28px 72px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: modal-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.import-modal .modal-header {
    padding: 20px 24px 16px;
    flex-shrink: 0;
}

.import-modal .modal-icon-wrap.icon-import {
    background: linear-gradient(135deg, #e0f2fe, #dbeafe);
    color: #3b82f6;
}

.import-modal .modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
}

.import-modal .modal-icon-wrap {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.import-modal .modal-title-text {
    flex: 1;
    min-width: 0;
}

.import-modal .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.import-modal .modal-subtitle {
    margin: 2px 0 0;
    font-size: 13px;
    color: #64748b;
}

.import-modal .modal-subtitle strong {
    color: #3b82f6;
}

.import-modal .modal-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
}

.import-modal .modal-close:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.import-error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 24px 12px;
    padding: 10px 14px;
    background: #fff7e6;
    border: 1px solid #fde68a;
    border-radius: 10px;
    color: #d97706;
    font-size: 13px;
    flex-shrink: 0;
}

.import-result-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 24px 12px;
    padding: 10px 14px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    color: #166534;
    font-size: 13px;
    flex-shrink: 0;
}

.import-result-banner .text-success {
    color: #16a34a;
    font-weight: 700;
}

.import-result-banner .text-fail {
    color: #dc2626;
    font-weight: 700;
}

.import-preview-wrap {
    flex: 1;
    overflow-y: auto;
    padding: 0 24px;
    min-height: 400px;
    max-height: 600px;
}

.import-preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 15px;
}

.import-preview-table th {
    background: #fafafa;
    color: #606266;
    font-weight: 600;
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
    position: sticky;
    top: 0;
}

.import-preview-table td {
    padding: 10px 14px;
    border-bottom: 1px solid #f1f5f9;
    color: #374151;
}

.import-preview-table tbody tr.error-row {
    background: #fef2f2;
}

.import-preview-table tbody tr.error-row:hover {
    background: #fee2e2;
}

.import-preview-table tbody tr.error-row td {
    color: #dc2626;
}

.import-preview-table tbody tr:hover {
    background: #f9fafb;
}

.import-status-ok {
    color: #16a34a;
    font-weight: 600;
}

.import-status-fail {
    color: #dc2626;
    font-weight: 600;
}

.import-modal .modal-footer-import {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 24px 20px;
    background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
    border-top: 1px solid #f1f5f9;
    flex-shrink: 0;
}

.import-format-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #94a3b8;
    flex: 1;
}

.import-format-tip strong {
    color: #475569;
}

.import-footer-btns {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
}

.spin {
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.import-preview-table td.empty-cell {
    text-align: center;
    padding: 32px 16px;
}

.import-modal .btn-modal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 108px;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.import-modal .btn-modal-ghost {
    border: 1.5px solid #e2e8f0;
    background: #fff;
    color: #64748b;
}

.import-modal .btn-modal-ghost:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
}

.import-modal .btn-modal-primary {
    border: none;
    background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.35);
}

.import-modal .btn-modal-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.45);
    transform: translateY(-1px);
}

.import-modal .btn-modal-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}
</style>
