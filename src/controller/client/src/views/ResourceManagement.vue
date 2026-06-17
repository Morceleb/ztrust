<template>
    <div class="resource-management">
        <!-- 搜索和操作栏 -->
        <div class="toolbar">
            <div class="search-box">
                <input type="text" v-model="searchKeyword" placeholder="搜索资源名称..." class="search-input" />
                <button class="search-btn" @click="handleSearch">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </button>
            </div>
            <div class="toolbar-actions">
                <button class="btn btn-secondary import-btn-with-tip" @click="triggerFileInput">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    导入资源
                    <div class="import-tooltip">
                        <div class="import-tooltip-title">导入说明</div>
                        <div class="import-tooltip-row"><span class="import-tooltip-label">字段要求：</span><span>资源名称、Resource ID、资源类型、允许方法</span></div>
                        <div class="import-tooltip-row"><span class="import-tooltip-label">格式要求：</span><span>Resource ID 仅支持英文字母、数字、下划线；允许方法可选值：GET、POST、API</span></div>
                    </div>
                </button>
                <input
                    ref="fileInputRef"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style="display:none"
                    @change="handleFileChange"
                />
                <button class="btn btn-primary" @click="handleAdd">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    添加资源
                </button>
            </div>
        </div>

        <!-- 数据表格 -->
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="col-index">序号</th>
                        <th class="col-icon">图标</th>
                        <th class="col-name">资源名称</th>
                        <th class="col-type">资源类型</th>
                        <th class="col-resource-id">资源ID</th>
                        <th class="col-url">URL</th>
                        <th class="col-method">允许方法</th>
                        <th class="col-status avail-col">资源状态</th>
                        <th class="col-actions">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(resource, index) in pagedResources" :key="resource.id">
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
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                                </svg>
                            </div>
                        </td>
                        <td class="col-name">{{ resource.name }}</td>
                        <td class="col-type">{{ resource.type || '-' }}</td>
                        <td class="col-resource-id">{{ resource.resourceId || '-' }}</td>
                        <td class="col-url">
                          <span class="resource-url-text" :title="resource.url">{{ resource.url || '-' }}</span>
                        </td>
                        <td class="col-method">{{ resource.allow_method || '-' }}</td>
                        <td class="col-status avail-col">
                            <span
                                class="status-badge"
                                :class="resource.is_active ? 'status-active' : 'status-unavailable'"
                            >{{ resource.is_active ? '启用' : '禁用' }}</span>
                        </td>
                        <td class="col-actions">
                            <div class="action-buttons">
                                <button class="action-btn action-edit" @click="handleEdit(resource)" title="编辑">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                <button class="action-btn action-delete" @click="handleDelete(resource)" title="删除">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="filteredResources.length === 0">
                        <td colspan="9" class="empty-cell">
                            <div class="empty-state">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                </svg>
                                <p>暂无资源数据</p>
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

        <!-- 添加资源弹窗 -->
        <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
            <div class="add-resource-modal" @click.stop>
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <div class="modal-icon-wrap" :class="modalMode === 'add' ? 'icon-add' : 'icon-edit'">
                            <svg v-if="modalMode === 'add'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </div>
                        <div class="modal-title-text">
                            <h3 class="modal-title">{{ modalMode === 'add' ? '添加资源' : '编辑资源' }}</h3>
                            <p class="modal-subtitle">{{ modalMode === 'add' ? '填写资源信息，创建新的资源项' : '修改资源基本信息' }}</p>
                        </div>
                    </div>
                    <button type="button" class="modal-close" @click="closeModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body modal-body-resource">
                    <div class="form-card form-card-resource">
                        <div class="form-resource-grid">
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>资源名称 <span class="required">*</span></label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                                        </svg>
                                        <input type="text" v-model="formData.name" class="field-input" :class="{ 'field-error': formErrors.name }" placeholder="如：VPN服务器" />
                                    </div>
                                    <span class="field-error-text" v-if="formErrors.name">{{ formErrors.name }}</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>Resource ID <span class="required">*</span></label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                        </svg>
                                        <input type="text" v-model="formData.resourceId" class="field-input resource-id-input" :class="{ 'field-error': formErrors.resourceId }" placeholder="自动生成" />
                                        <button v-if="modalMode === 'add'" type="button" class="auto-gen-btn" @click="regenerateResourceId" title="重新生成">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <span class="field-error-text" v-if="formErrors.resourceId">{{ formErrors.resourceId }}</span>
                                </div>
                            </div>
                            <div class="form-field-group form-field-span-2">
                                <div class="form-field">
                                    <label>URL <span class="required">*</span></label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                        </svg>
                                        <input type="text" v-model="formData.url" class="field-input" :class="{ 'field-error': formErrors.url }" placeholder="https://example.com/api" />
                                    </div>
                                    <span class="field-error-text" v-if="formErrors.url">{{ formErrors.url }}</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>资源图标</label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                            <polyline points="21 15 16 10 5 21"/>
                                        </svg>
                                        <input
                                            type="text"
                                            v-model="formData.icon"
                                            class="field-input"
                                            placeholder="图片 URL 或 Emoji（选填）"
                                        />
                                    </div>
                                    <div class="icon-preset-row icon-preset-row--compact">
                                        <button
                                            v-for="preset in ICON_PRESETS"
                                            :key="preset"
                                            type="button"
                                            class="icon-preset-btn"
                                            :class="{ active: formData.icon === preset }"
                                            :title="preset"
                                            @click="formData.icon = preset"
                                        >
                                            {{ preset }}
                                        </button>
                                        <button type="button" class="icon-preset-btn icon-preset-clear" @click="formData.icon = ''" title="清除图标">
                                            清除
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>资源类型 <span class="required">*</span></label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                        </svg>
                                        <input type="text" v-model="formData.type" class="field-input" :class="{ 'field-error': formErrors.type }" placeholder="如：Web服务" />
                                    </div>
                                    <span class="field-error-text" v-if="formErrors.type">{{ formErrors.type }}</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>允许方法 <span class="required">*</span></label>
                                    <div class="method-select-group">
                                        <button
                                            type="button"
                                            class="method-option"
                                            :class="{ active: formData.allow_method.includes('GET') }"
                                            @click="toggleMethod('GET')"
                                        >
                                            <span class="method-dot method-dot-get"></span>
                                            GET
                                        </button>
                                        <button
                                            type="button"
                                            class="method-option"
                                            :class="{ active: formData.allow_method.includes('POST') }"
                                            @click="toggleMethod('POST')"
                                        >
                                            <span class="method-dot method-dot-post"></span>
                                            POST
                                        </button>
                                        <button
                                            type="button"
                                            class="method-option"
                                            :class="{ active: formData.allow_method.includes('API') }"
                                            @click="toggleMethod('API')"
                                        >
                                            <span class="method-dot method-dot-api"></span>
                                            API
                                        </button>
                                    </div>
                                    <span class="field-error-text" v-if="formErrors.allow_method">{{ formErrors.allow_method }}</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>资源状态</label>
                                    <div class="toggle-wrapper">
                                        <div class="toggle-switch" :class="{ active: formData.is_active }" @click="toggleActive">
                                            <div class="toggle-knob"></div>
                                        </div>
                                        <span class="toggle-label" :class="formData.is_active ? 'label-active' : 'label-inactive'">
                                            {{ formData.is_active ? '启用' : '禁用' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer modal-footer-resource">
                    <button type="button" class="btn-modal btn-modal-ghost" @click="closeModal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        取消
                    </button>
                    <button type="button" class="btn-modal btn-modal-primary" @click="handleSubmit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {{ modalMode === 'add' ? '确定添加' : '保存修改' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 删除确认弹窗 -->
        <div class="modal-overlay" v-if="showDeleteModal" @click.self="cancelDelete">
            <div class="confirm-dialog">
                <div class="confirm-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </div>
                <h3 class="confirm-title">确认删除</h3>
                <p class="confirm-message">
                    确定要删除资源「<strong>{{ deleteTarget?.name }}</strong>」吗？<br/>
                    <span class="confirm-sub">此操作不可恢复</span>
                </p>
                <div class="confirm-footer">
                    <button class="btn-modal btn-modal-ghost" @click="cancelDelete">取消</button>
                    <button class="btn-modal btn-modal-danger" @click="confirmDelete">确认删除</button>
                </div>
            </div>
        </div>

        <!-- 导入资源预览弹窗 -->
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
                            <h3 class="modal-title">导入资源</h3>
                            <p class="modal-subtitle">共检测到 <strong>{{ importPreviewData.length }}</strong> 条数据，确认后开始导入</p>
                        </div>
                    </div>
                    <button type="button" class="modal-close" @click="closeImportModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="import-error-banner" v-if="importErrors.length > 0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{{ importErrors.length }} 条数据格式异常（资源名称未填写），已自动跳过</span>
                </div>

                <!-- URL 警告提示 -->
                <div class="import-url-warning" v-if="importUrlWarnings.length > 0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>{{ importUrlWarnings.length }} 条数据缺少 URL，将使用默认值 /api/{{ '"' }}resourceId{{ '"' }}</span>
                    <button type="button" class="url-warning-expand" @click="showUrlWarnings = !showUrlWarnings">
                        {{ showUrlWarnings ? '收起' : '查看详情' }}
                    </button>
                </div>
                <div class="url-warnings-detail" v-if="showUrlWarnings && importUrlWarnings.length > 0">
                    <div class="url-warnings-list">
                        <span v-for="(warn, idx) in importUrlWarnings.slice(0, 10)" :key="idx" class="url-warning-item">
                            第 {{ warn.row }} 行：{{ warn.name }}
                        </span>
                        <span v-if="importUrlWarnings.length > 10" class="url-warning-more">
                            ...还有 {{ importUrlWarnings.length - 10 }} 条
                        </span>
                    </div>
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
                                <th>资源名称 *</th>
                                <th>Resource ID *</th>
                                <th>URL</th>
                                <th>资源类型</th>
                                <th>允许方法</th>
                                <th v-if="!importResult">状态</th>
                                <th v-if="importResult">结果</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, index) in importPreviewData" :key="index">
                                <td>{{ index + 1 }}</td>
                                <td>{{ row.name }}</td>
                                <td>{{ row.resourceId || '-' }}</td>
                                <td :class="{ 'url-missing': !row.url }">
                                    <span :title="row.url">{{ row.url || '(自动生成)' }}</span>
                                </td>
                                <td>{{ row.type || '-' }}</td>
                                <td>{{ row.allowMethod || '-' }}</td>
                                <td v-if="!importResult">
                                    <span class="import-status-ok">待导入</span>
                                </td>
                                <td v-if="importResult">
                                    <span v-if="row._success" class="import-status-ok">成功</span>
                                    <span v-else class="import-status-fail">{{ row._error || '失败' }}</span>
                                </td>
                            </tr>
                            <tr v-if="importPreviewData.length === 0">
                                <td colspan="7" class="empty-cell">
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
                        Excel 格式：资源名称（必填）、Resource ID（留空自动生成）、URL、资源类型、允许方法。URL 留空将自动生成，允许方法可选：GET、POST、API
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

        <!-- 轻提示 -->
        <div class="toast" v-if="toastMessage">{{ toastMessage }}</div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { listResources, saveResource, deleteResource } from '@/api/resource.js'
import * as XLSX from 'xlsx'

const ICON_PRESETS = ['🖥️', '🌐', '🔐', '📁', '⚙️', '🔗', '💾', '📊']

function isResourceIconUrl(s) {
    if (!s || typeof s !== 'string') return false
    const t = s.trim()
    return /^https?:\/\//i.test(t) || t.startsWith('data:') || (t.startsWith('/') && t.length > 1)
}

const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(1) // 动态计算
const totalCount = ref(0)

const calculatePageSize = () => {
    nextTick(() => {
        const windowHeight = window.innerHeight

        // 预留顶部区域（toolbar + padding）和分页区域高度
        const topAreaHeight = 220
        const paginationHeight = 80

        // 表格每行高度（tbody tr 高度通常在 56 左右）
        const rowHeight = 56

        const availableHeight = windowHeight - topAreaHeight - paginationHeight
        const rows = Math.max(1, Math.floor(availableHeight / rowHeight))

        pageSize.value = rows

        const newTotalPages = Math.ceil(totalCount.value / pageSize.value) || 1
        if (currentPage.value > newTotalPages) currentPage.value = newTotalPages
    })
}
const showModal = ref(false)
const showDeleteModal = ref(false)
const modalMode = ref('add')
const deleteTarget = ref(null)
const currentResource = ref(null)
const toastMessage = ref('')
const formErrors = ref({})
const resources = ref([])

// 导入资源相关
const fileInputRef = ref(null)
const showImportModal = ref(false)
const importPreviewData = ref([])
const importErrors = ref([])
const importUrlWarnings = ref([])
const showUrlWarnings = ref(false)
const importResult = ref(null)
const importing = ref(false)

let toastTimer = null
function showToast(msg, ms = 3200) {
    toastMessage.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastMessage.value = '' }, ms)
}

const formData = ref({
    id: null,
    name: '',
    type: '',
    url: '',
    icon: '',
    allow_method: '',
    is_active: true
})

async function fetchResources() {
    loading.value = true
    try {
        const res = await listResources({ page: currentPage.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined })
        if (res.code === 200 && res.data) {
            // 后端直接返回数组：[{...}, {...}]
            if (Array.isArray(res.data)) {
                // 将驼峰字段映射为下划线字段
                resources.value = res.data.map(item => ({
                    ...item,
                    allow_method: item.allowMethod,
                    is_active: item.isActive,
                    icon: item.icon ?? item.iconUrl ?? '',
                    url: item.url ?? ''
                }))
                totalCount.value = res.data.length
            }
            // 标准分页结构：{ code: 200, data: { list: [...], total: N } }
            else if (Array.isArray(res.data.list)) {
                resources.value = res.data.list.map(item => ({
                    ...item,
                    allow_method: item.allowMethod,
                    is_active: item.isActive,
                    icon: item.icon ?? item.iconUrl ?? '',
                    url: item.url ?? ''
                }))
                totalCount.value = res.data.total || res.data.list.length
            } else {
                resources.value = []
                totalCount.value = 0
            }
        } else {
            resources.value = []
            totalCount.value = 0
        }
    } catch (e) {
        showToast(e?.message || '加载资源列表失败')
        resources.value = []
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    calculatePageSize()
    window.addEventListener('resize', calculatePageSize)
    fetchResources()
})

onUnmounted(() => {
    window.removeEventListener('resize', calculatePageSize)
})

const handleSearch = () => {
    currentPage.value = 1
    calculatePageSize()
    fetchResources()
}

const closeModal = () => {
    showModal.value = false
    formErrors.value = {}
}

const toggleActive = () => {
    formData.value.is_active = !formData.value.is_active
}

const handleAdd = () => {
    modalMode.value = 'add'
    formData.value = { id: null, name: '', type: '', resourceId: generateNextResourceId(), icon: '', allow_method: ['GET'], is_active: true, url: '' }
    formErrors.value = {}
    showModal.value = true
}

// 自动生成下一个 Resource ID (RES_001, RES_002...)
const generateNextResourceId = () => {
    const prefix = 'RES_'
    let maxNum = 0
    resources.value.forEach(r => {
        const rid = r.resourceId || ''
        if (rid.startsWith(prefix)) {
            const numStr = rid.slice(prefix.length)
            const num = parseInt(numStr, 10)
            if (!isNaN(num) && num > maxNum) {
                maxNum = num
            }
        }
    })
    return prefix + String(maxNum + 1).padStart(3, '0')
}

// 重新生成 Resource ID
const regenerateResourceId = () => {
    formData.value.resourceId = generateNextResourceId()
}

// 切换方法选中状态（支持多选）
const toggleMethod = (method) => {
    const arr = formData.value.allow_method
    const idx = arr.indexOf(method)
    if (idx > -1) {
        arr.splice(idx, 1)
    } else {
        arr.push(method)
    }
}

// 批量导入时自动生成 Resource ID (RES_001, RES_002...)
let importResourceIdCounter = 0
const getImportResourceId = () => {
    importResourceIdCounter++
    const prefix = 'RES_'
    let maxNum = 0
    resources.value.forEach(r => {
        const rid = r.resourceId || ''
        if (rid.startsWith(prefix)) {
            const numStr = rid.slice(prefix.length)
            const num = parseInt(numStr, 10)
            if (!isNaN(num) && num > maxNum) {
                maxNum = num
            }
        }
    })
    return prefix + String(maxNum + importResourceIdCounter).padStart(3, '0')
}

const handleEdit = (resource) => {
    modalMode.value = 'edit'
    formData.value = {
        id: resource.id,
        name: resource.name,
        type: resource.type || '',
        resourceId: resource.resourceId || '',
        icon: resource.icon || '',
        allow_method: resource.allow_method ? (Array.isArray(resource.allow_method) ? [...resource.allow_method] : [resource.allow_method]) : ['GET'],
        is_active: resource.is_active !== false,
        url: resource.url || ''
    }
    formErrors.value = {}
    currentResource.value = resource
    showModal.value = true
}

const handleDelete = (resource) => {
    deleteTarget.value = resource
    showDeleteModal.value = true
}

const cancelDelete = () => {
    showDeleteModal.value = false
    deleteTarget.value = null
}

const confirmDelete = async () => {
    if (!deleteTarget.value) return
    try {
        const res = await deleteResource(deleteTarget.value.id)
        if (res.code === 200) {
            showToast('资源已删除')
            await fetchResources()
        } else {
            showToast(res.message || '删除失败')
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    }
    cancelDelete()
}

const handleSubmit = async () => {
    formErrors.value = {}
    if (!formData.value.name || formData.value.name.trim() === '') {
        formErrors.value.name = '请输入资源名称'
    }
    if (!formData.value.resourceId || formData.value.resourceId.trim() === '') {
        formErrors.value.resourceId = '请输入 Resource ID'
    }
    if (!formData.value.type || formData.value.type.trim() === '') {
        formErrors.value.type = '请输入资源类型'
    }
    if (!formData.value.allow_method || formData.value.allow_method.trim() === '') {
        formErrors.value.allow_method = '请输入允许方法'
    }
    if (!formData.value.url || formData.value.url.trim() === '') {
        formErrors.value.url = '请输入 URL'
    }
    if (Object.keys(formErrors.value).length > 0) return

    try {
        // 驼峰格式（符合 Java 后端规范）
        const payload = {
            id: formData.value.id || null,
            name: formData.value.name.trim(),
            type: formData.value.type?.trim() || null,
            resourceId: formData.value.resourceId?.trim() || null,
            icon: formData.value.icon?.trim() || null,
            allowMethod: formData.value.allow_method?.trim() || null,
            url: formData.value.url?.trim() || null,
            isActive: formData.value.is_active === true
        }
        console.log('提交资源数据:', payload)
        const res = await saveResource(payload)
        if (res.code === 200) {
            showToast(modalMode.value === 'add' ? '资源添加成功' : '资源修改成功')
            closeModal()
            currentPage.value = 1
            await fetchResources()
        } else {
            showToast(res.message || '操作失败，错误码：' + res.code)
        }
    } catch (e) {
        showToast(e?.message || '网络错误，请检查网络或后端服务')
    }
}

const filteredResources = computed(() => {
    if (!searchKeyword.value) return resources.value
    return resources.value.filter(r => (r.name || '').toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

const pagedResources = computed(() => {
    // 反转列表，新添加的资源显示在最前面
    const list = [...filteredResources.value].reverse()
    const start = (currentPage.value - 1) * pageSize.value
    return list.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)

// 导入资源
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
    importUrlWarnings.value = []
    importResourceIdCounter = 0  // 重置计数器
    const reader = new FileReader()
    reader.onload = (evt) => {
        try {
            const data = new Uint8Array(evt.target.result)
            const workbook = XLSX.read(data, { type: 'array', cellDates: true })
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

            const validRows = []
            const errors = []
            const urlWarnings = []
            json.forEach((row, index) => {
                const name = String(row['资源名称'] || row['name'] || '').trim()
                if (!name) {
                    errors.push(index + 1)
                    return
                }
                let resourceId = String(row['Resource ID'] || row['resourceId'] || row['resource_id'] || '').trim()
                const url = String(row['URL'] || row['url'] || '').trim()
                if (!url && resourceId) {
                    urlWarnings.push({ row: index + 2, name, resourceId })
                }
                validRows.push({
                    name,
                    resourceId,  // 保留原始值，但 confirmImport 会自动生成
                    url,
                    type: String(row['资源类型'] || row['type'] || '').trim(),
                    allowMethod: String(row['允许方法'] || row['allowMethod'] || row['allow_method'] || '').trim()
                })
            })

            importErrors.value = errors
            importUrlWarnings.value = urlWarnings
            importPreviewData.value = validRows
            showImportModal.value = true

            if (validRows.length === 0) {
                showToast('文件中未检测到有效数据，请检查格式')
            }
        } catch (err) {
            showToast('文件解析失败，请确认是有效的 Excel 或 CSV 文件')
            console.error('parseImportFile error:', err)
        }
    }
    reader.readAsArrayBuffer(file)
}

const closeImportModal = () => {
    showImportModal.value = false
    importPreviewData.value = []
    importErrors.value = []
    importUrlWarnings.value = []
    showUrlWarnings.value = false
    importResult.value = null
    importing.value = false
}

const confirmImport = async () => {
    if (!importPreviewData.value.length) return
    importing.value = true
    importResourceIdCounter = 0  // 重置计数器，确保每次导入都从当前最大ID开始递增
    let success = 0
    let failed = 0

    for (const row of importPreviewData.value) {
        try {
            const finalResourceId = row.resourceId || getImportResourceId()
            const payload = {
                name: row.name,
                resourceId: finalResourceId,
                url: row.url || (finalResourceId ? `/api/${finalResourceId}` : null),
                type: row.type || null,
                allowMethod: row.allowMethod || null,
                isActive: true
            }
            const res = await saveResource(payload)
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

    if (success > 0) {
        showToast(`导入完成：成功 ${success} 条，失败 ${failed} 条`)
        await fetchResources()
    } else {
        showToast('导入失败，请检查数据格式或网络')
    }
}
</script>

<style scoped>
.resource-management {
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
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.col-index {
    width: 60px;
    min-width: 60px;
}

.col-icon {
    width: 60px;
    min-width: 60px;
    text-align: center;
}

.col-name {
    width: 130px;
    min-width: 100px;
}

.col-type {
    width: 100px;
    min-width: 80px;
}

.col-resource-id {
    width: 150px;
    min-width: 120px;
}

.col-url {
    width: 170px;
    min-width: 140px;
}

.col-method {
    width: 100px;
    min-width: 80px;
}

.col-status {
    width: 90px;
    min-width: 80px;
}

.col-actions {
    width: 100px;
    min-width: 90px;
    text-align: center;
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

.data-table tbody tr {
    height: 56px;
}

.data-table td {
    vertical-align: middle;
}

.resource-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.resource-icon svg {
    color: #fff;
}

.resource-icon.has-custom {
    background: #f0f2f5;
}

.resource-icon-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.resource-icon-emoji {
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-preset-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
}

.icon-preset-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.icon-preset-btn:hover {
    border-color: #409eff;
    background: #f0f9ff;
}

.icon-preset-btn.active {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.icon-preset-btn.icon-preset-clear {
    width: auto;
    padding: 0 12px;
    font-size: 12px;
    color: #64748b;
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

.status-unavailable {
    background: #fff1f0;
    color: #f5222d;
}

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

.action-delete {
    background: #fff1f0;
    color: #ff4d4f;
}

.action-delete:hover {
    background: #ff4d4f;
    color: #fff;
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

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
}

.add-resource-modal {
    width: 100%;
    max-width: 760px;
    max-height: none;
    overflow: hidden;
    background: #fff;
    border-radius: 28px;
    box-shadow: 0 28px 72px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04);
    animation: modal-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-resource-modal .modal-header {
    padding: 18px 28px 14px;
    border-radius: 28px 28px 0 0;
}

.add-resource-modal .modal-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 14px;
}

.add-resource-modal .modal-title {
    font-size: 19px;
}

.add-resource-modal .modal-subtitle {
    margin-top: 4px;
    font-size: 13px;
}

.add-resource-modal .modal-body-resource {
    padding: 14px 28px 8px;
}

.add-resource-modal .modal-footer-resource {
    padding: 16px 28px 22px;
    border-radius: 0 0 28px 28px;
}

.add-resource-modal .form-card-resource {
    padding: 16px 18px;
    border-radius: 18px;
}

.add-resource-modal .form-resource-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 22px;
    align-items: start;
}

.add-resource-modal .form-field-span-2 {
    grid-column: 1 / -1;
}

.add-resource-modal .form-field-group {
    padding: 0;
    margin: 0;
}

.add-resource-modal .form-field-group + .form-field-group {
    border: none;
    padding-top: 0;
    margin-top: 0;
}

.add-resource-modal .form-field {
    gap: 6px;
}

.add-resource-modal .form-field label {
    font-size: 13px;
}

.add-resource-modal .field-input {
    padding: 9px 12px 9px 38px;
    font-size: 14px;
    border-radius: 12px;
}

.add-resource-modal .input-icon {
    left: 12px;
}

.add-resource-modal .field-hint-inline {
    font-size: 12px;
    line-height: 1.3;
}

.add-resource-modal .icon-preset-row--compact {
    margin-top: 6px;
    gap: 7px;
}

.add-resource-modal .icon-preset-btn {
    width: 36px;
    height: 36px;
    font-size: 17px;
    border-radius: 8px;
}

.add-resource-modal .icon-preset-btn.icon-preset-clear {
    width: auto;
    padding: 0 10px;
    font-size: 12px;
}

.add-resource-modal .toggle-label {
    font-size: 14px;
}

@media (max-height: 560px) {
    .add-resource-modal {
        max-height: calc(100vh - 24px);
        overflow-x: hidden;
        overflow-y: auto;
        border-radius: 28px;
    }
}

@keyframes modal-in {
    from { opacity: 0; transform: scale(0.9) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 24px 28px 20px;
    background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
    border-bottom: 1px solid #f1f5f9;
}

.modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
}

.modal-icon-wrap {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
}

.modal-icon-wrap.icon-add {
    background: linear-gradient(135deg, #e0f2fe, #dbeafe);
    color: #3b82f6;
}

.modal-icon-wrap.icon-edit {
    background: linear-gradient(135deg, #fef3c7, #fef9c3);
    color: #f59e0b;
}

.modal-title-text {
    min-width: 0;
}

.modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.modal-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #94a3b8;
}

.modal-close {
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

.modal-close:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.modal-body {
    padding: 24px 28px 8px;
}

.form-card {
    background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    padding: 20px;
}

.form-field-group {
    padding: 0 0 4px;
}

.form-field-group + .form-field-group {
    border-top: 1px solid #f1f5f9;
    padding-top: 16px;
    margin-top: 12px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-field label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    letter-spacing: 0.01em;
}

.form-field label .required {
    color: #f56c6c;
    margin-left: 2px;
}

.input-wrapper {
    position: relative;
}

.input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
}

.field-input {
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

.field-input::placeholder {
    color: #94a3b8;
}

.field-input:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.field-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
}

.field-select:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.resource-id-input {
    background-color: #f8fafc;
    color: #3b82f6;
    font-weight: 600;
    padding-right: 42px;
}

.auto-gen-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: #e2e8f0;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.auto-gen-btn:hover {
    background: #409eff;
    color: #fff;
}

/* 方法选择按钮组 */
.method-select-group {
    display: flex;
    gap: 8px;
    padding: 5px;
    background: #f1f5f9;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
}

.method-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 10px 16px;
    border: 1.5px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.method-option:hover {
    background: #fff;
    color: #0f172a;
    border-color: #cbd5e1;
}

.method-option.active {
    background: #fff;
    color: #0f172a;
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25), 0 0 0 1px #409eff;
    transform: translateY(-1px);
}

.method-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.method-dot-get {
    background: #10b981;
}

.method-dot-post {
    background: #f59e0b;
}

.method-dot-api {
    background: #8b5cf6;
}

.method-option.active .method-dot-get {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25);
    background: #059669;
}

.method-option.active .method-dot-post {
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.25);
    background: #d97706;
}

.method-option.active .method-dot-api {
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.25);
    background: #7c3aed;
}

.field-error {
    border-color: #f56c6c !important;
    box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.12) !important;
}

.field-error-text {
    font-size: 12px;
    color: #f56c6c;
}

.field-hint {
    font-size: 12px;
    color: #94a3b8;
}

.toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.25s;
}

.toggle-switch.active {
    background: linear-gradient(90deg, #409eff, #66b1ff);
}

.toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toggle-switch.active .toggle-knob {
    transform: translateX(20px);
}

.toggle-label {
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s;
}

.label-active { color: #409eff; }
.label-inactive { color: #94a3b8; }

.modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 18px 28px 24px;
    background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
    border-top: 1px solid #f1f5f9;
}

.btn-modal {
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

.btn-modal-ghost {
    border: 1.5px solid #e2e8f0;
    background: #fff;
    color: #64748b;
}

.btn-modal-ghost:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
}

.btn-modal-primary {
    border: none;
    background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.35);
}

.btn-modal-primary:hover {
    background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.45);
    transform: translateY(-1px);
}

.btn-modal-danger {
    border: none;
    background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.btn-modal-danger:hover {
    background: linear-gradient(180deg, #f87171 0%, #ef4444 100%);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
}

.confirm-dialog {
    width: 100%;
    max-width: 400px;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04);
    padding: 36px 32px 28px;
    text-align: center;
    animation: dialog-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dialog-in {
    from { opacity: 0; transform: scale(0.88) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

.confirm-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 18px;
    background: linear-gradient(135deg, #fff5f5, #fff);
    border: 1.5px solid #fee2e2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
}

.confirm-title {
    margin: 0 0 10px;
    font-size: 19px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.confirm-message {
    margin: 0 0 28px;
    font-size: 14px;
    color: #475569;
    line-height: 1.65;
}

.confirm-message strong {
    color: #0f172a;
}

.confirm-sub {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: #94a3b8;
}

.confirm-footer {
    display: flex;
    gap: 10px;
    justify-content: center;
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

@media (max-width: 540px) {
    .add-resource-modal {
        max-width: 100%;
        border-radius: 22px;
    }

    .add-resource-modal .modal-header {
        border-radius: 22px 22px 0 0;
    }

    .add-resource-modal .modal-footer-resource {
        border-radius: 0 0 22px 22px;
    }

    .add-resource-modal .form-resource-grid {
        grid-template-columns: 1fr;
    }

    .add-resource-modal .form-field-span-2 {
        grid-column: 1;
    }

    .modal-header {
        padding: 20px 20px 16px;
    }

    .modal-body {
        padding: 16px 20px 8px;
    }

    .modal-footer {
        padding: 16px 20px 20px;
    }
}

/* 导入弹窗 */
.import-modal {
    width: 100%;
    max-width: 800px;
    max-height: 85vh;
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

.import-modal .modal-icon-wrap.icon-import {
    background: linear-gradient(135deg, #e0f2fe, #dbeafe);
    color: #3b82f6;
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

.import-url-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 24px 8px;
    padding: 10px 14px;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 10px;
    color: #b45309;
    font-size: 13px;
    flex-shrink: 0;
}

.import-url-warning .url-warning-expand {
    margin-left: auto;
    padding: 2px 8px;
    border: 1px solid currentColor;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 12px;
}

.import-url-warning .url-warning-expand:hover {
    background: rgba(0, 0, 0, 0.05);
}

.url-warnings-detail {
    margin: 0 24px 8px;
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 10px;
    font-size: 12px;
}

.url-warnings-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.url-warning-item {
    padding: 2px 8px;
    background: #fef3c7;
    border-radius: 4px;
    color: #92400e;
}

.url-warning-more {
    padding: 2px 8px;
    color: #b45309;
    font-style: italic;
}

.url-missing {
    color: #d97706;
    font-style: italic;
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
    min-height: 0;
}

.import-preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.import-preview-table th {
    background: #fafafa;
    color: #606266;
    font-weight: 600;
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
    position: sticky;
    top: 0;
}

.import-preview-table td {
    padding: 9px 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #374151;
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

.spin {
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
