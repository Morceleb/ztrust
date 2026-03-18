<template>
    <div class="data-import">
        <div class="import-types">
            <div class="import-card" :class="{ active: importType === 'user' }" @click="importType = 'user'">
                <div class="import-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                </div>
                <div class="import-info">
                    <div class="import-title">导入人员</div>
                    <div class="import-desc">批量导入人员名单</div>
                </div>
            </div>
            <div class="import-card" :class="{ active: importType === 'resource' }" @click="importType = 'resource'">
                <div class="import-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <div class="import-info">
                    <div class="import-title">导入资源</div>
                    <div class="import-desc">批量导入资源列表</div>
                </div>
            </div>
        </div>

        <div class="import-content">
            <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
                <input type="file" ref="fileInput" @change="handleFileChange" accept=".xlsx,.xls,.csv" style="display: none" />
                <div class="upload-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                </div>
                <div class="upload-text">点击或拖拽文件到此处上传</div>
                <div class="upload-hint">支持 .xlsx, .xls, .csv 格式</div>
            </div>

            <div class="file-info" v-if="selectedFile">
                <div class="file-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
                <div class="file-details">
                    <div class="file-name">{{ selectedFile.name }}</div>
                    <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
                </div>
                <button class="remove-btn" @click="removeFile">&times;</button>
            </div>

            <div class="import-options" v-if="selectedFile">
                <h3 class="options-title">导入选项</h3>
                <div class="option-item">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="importOptions.overwrite" />
                        <span class="checkbox-custom"></span>
                        <span>覆盖已存在的数据</span>
                    </label>
                </div>
                <div class="option-item">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="importOptions.skipErrors" />
                        <span class="checkbox-custom"></span>
                        <span>跳过错误行</span>
                    </label>
                </div>
            </div>

            <div class="template-download" v-if="selectedFile">
                <a href="javascript:void(0)" @click="downloadTemplate" class="download-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    下载导入模板
                </a>
            </div>

            <div class="import-actions" v-if="selectedFile">
                <button class="btn" @click="startImport" :disabled="importing">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-if="!importing">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {{ importing ? '导入中...' : '开始导入' }}
                </button>
            </div>

            <div class="import-result" v-if="importResult">
                <div class="result-icon" :class="importResult.success ? 'success' : 'error'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path v-if="importResult.success" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline v-if="importResult.success" points="22 4 12 14.01 9 11.01"/>
                        <circle v-if="!importResult.success" cx="12" cy="12" r="10"/>
                        <line v-if="!importResult.success" x1="15" y1="9" x2="9" y2="15"/>
                        <line v-if="!importResult.success" x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                </div>
                <div class="result-content">
                    <div class="result-title">{{ importResult.success ? '导入成功' : '导入失败' }}</div>
                    <div class="result-stats">
                        <span>成功: {{ importResult.successCount }}</span>
                        <span>失败: {{ importResult.errorCount }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const importType = ref('user')
const fileInput = ref(null)
const selectedFile = ref(null)
const importing = ref(false)
const importResult = ref(null)

const importOptions = ref({
    overwrite: false,
    skipErrors: true
})

const triggerFileInput = () => {
    fileInput.value.click()
}

const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
        selectedFile.value = file
        importResult.value = null
    }
}

const handleDrop = (e) => {
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
        selectedFile.value = file
        importResult.value = null
    }
}

const removeFile = () => {
    selectedFile.value = null
    fileInput.value.value = ''
    importResult.value = null
}

const formatFileSize = (size) => {
    if (size < 1024) return size + ' B'
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

const downloadTemplate = () => {
    alert(`下载${importType.value === 'user' ? '人员' : '资源'}导入模板`)
}

const startImport = () => {
    importing.value = true
    setTimeout(() => {
        importing.value = false
        importResult.value = {
            success: true,
            successCount: 10,
            errorCount: 0
        }
    }, 1500)
}
</script>

<style scoped>
.data-import { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.import-types { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 32px; }
.import-card { display: flex; align-items: center; gap: 16px; padding: 24px; border: 2px solid #ebeef5; border-radius: 12px; cursor: pointer; transition: all 0.3s; }
.import-card:hover { border-color: #409eff; }
.import-card.active { border-color: #409eff; background: #f0f7ff; }
.import-icon { width: 64px; height: 64px; background: #f5f7fa; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #409eff; }
.import-card.active .import-icon { background: #409eff; color: white; }
.import-title { font-size: 18px; font-weight: 600; color: #303133; margin-bottom: 4px; }
.import-desc { font-size: 14px; color: #909399; }
.import-content { background: #fafafa; border-radius: 12px; padding: 32px; }
.upload-area { border: 2px dashed #dcdfe6; border-radius: 12px; padding: 48px; text-align: center; cursor: pointer; transition: all 0.3s; }
.upload-area:hover { border-color: #409eff; background: #f5f7fa; }
.upload-icon { color: #c0c4cc; margin-bottom: 16px; }
.upload-text { font-size: 16px; color: #606266; margin-bottom: 8px; }
.upload-hint { font-size: 14px; color: #909399; }
.file-info { display: flex; align-items: center; gap: 12px; margin-top: 20px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #ebeef5; }
.file-icon { width: 40px; height: 40px; background: #e6f7ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #1890ff; }
.file-details { flex: 1; }
.file-name { font-size: 14px; color: #303133; font-weight: 500; }
.file-size { font-size: 12px; color: #909399; margin-top: 4px; }
.remove-btn { width: 28px; height: 28px; background: #fff2f0; border: none; border-radius: 50%; color: #f56c6c; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.import-options { margin-top: 24px; }
.options-title { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 16px; }
.option-item { margin-bottom: 12px; }
.checkbox-label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.checkbox-label input { display: none; }
.checkbox-custom { width: 18px; height: 18px; border: 2px solid #dcdfe6; border-radius: 4px; transition: all 0.3s; position: relative; }
.checkbox-label input:checked + .checkbox-custom { background: #409eff; border-color: #409eff; }
.checkbox-label input:checked + .checkbox-custom::after { content: ''; position: absolute; left: 5px; top: 1px; width: 4px; height: 9px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.template-download { margin-top: 16px; }
.download-link { display: inline-flex; align-items: center; gap: 6px; color: #409eff; font-size: 14px; text-decoration: none; }
.download-link:hover { text-decoration: underline; }
.import-actions { margin-top: 24px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border: none; border-radius: 6px; background: #409eff; color: white; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.btn:hover { background: #66b1ff; }
.btn:disabled { background: #a0cfff; cursor: not-allowed; }
.import-result { margin-top: 24px; padding: 20px; background: white; border-radius: 8px; display: flex; align-items: center; gap: 16px; }
.result-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.result-icon.success { background: #f6ffed; color: #52c41a; }
.result-icon.error { background: #fff2f0; color: #f56c6c; }
.result-title { font-size: 16px; font-weight: 600; color: #303133; }
.result-stats { font-size: 14px; color: #909399; margin-top: 4px; }
.result-stats span { margin-right: 16px; }
</style>
