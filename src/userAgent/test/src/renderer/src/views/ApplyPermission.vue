<template>
    <div class="apply-permission-page">
        <!-- 顶部标题栏 -->
        <header class="page-header">
            <button type="button" class="back-btn" @click="handleBack" aria-label="返回">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </button>
            <h1 class="page-title">申请权限</h1>
            <div class="search-wrap">
                <input
                    v-model="searchKeyword"
                    type="text"
                    class="search-input"
                    placeholder="搜索应用"
                />
                <span class="search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                </span>
            </div>
        </header>

        <!-- 标签页：全部 / 即将过期 / 已过期 -->
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
            </button>
        </div>

        <!-- 主体：左侧导航（仅「全部」显示）+ 右侧内容 -->
        <div class="page-body">
            <aside v-if="activeTab === 'all'" class="category-nav">
                <ul class="category-list">
                    <li
                        v-for="cat in categoryTree"
                        :key="cat.id"
                        class="category-item"
                        :class="{ active: selectedCategoryId === cat.id }"
                        @click="selectedCategoryId = cat.id"
                    >
                        <span class="category-name">{{ cat.name }}</span>
                    </li>
                </ul>
            </aside>

            <main class="content-main" :class="{ 'content-full': activeTab !== 'all' }">
                <h2 v-if="activeTab === 'all'" class="content-title">{{ currentCategoryName }}</h2>
                <h2 v-else class="content-title">{{ activeTabLabel }}</h2>
                <div v-if="hasResourceGroups" class="resource-groups">
                    <section
                        v-for="group in filteredResourceGroups"
                        :key="group.id"
                        class="resource-group"
                    >
                        <h3 class="group-title">{{ group.name }}</h3>
                        <ul class="resource-list">
                            <li
                                v-for="res in group.resources"
                                :key="res.id"
                                class="resource-row"
                            >
                                <div class="resource-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                                    </svg>
                                </div>
                                <div class="resource-info">
                                    <span class="resource-name">{{ res.name }}</span>
                                    <span v-if="res.description" class="resource-desc">{{ res.description }}</span>
                                    <span v-if="res.tempTag" class="resource-tag">临时使用</span>
                                </div>
                                <button
                                    type="button"
                                    class="btn-apply"
                                    @click="openApplyModal(res)"
                                >
                                    申请权限
                                </button>
                            </li>
                        </ul>
                    </section>
                </div>
                <div v-else class="empty-state">
                    <div class="empty-state-illus">
                        <svg class="empty-box-svg" viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
                            <!-- 漂浮小球 -->
                            <circle cx="42" cy="52" r="12" fill="url(#ball1)" opacity="0.9"/>
                            <circle cx="118" cy="48" r="14" fill="url(#ball2)" opacity="0.85"/>
                            <circle cx="95" cy="78" r="10" fill="url(#ball3)" opacity="0.9"/>
                            <circle cx="68" cy="38" r="8" fill="url(#ball4)" opacity="0.8"/>
                            <!-- 开口盒子（等距感） -->
                            <defs>
                                <linearGradient id="boxLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style="stop-color:#93c5fd"/>
                                    <stop offset="100%" style="stop-color:#bfdbfe"/>
                                </linearGradient>
                                <linearGradient id="boxRight" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#7dd3fc"/>
                                    <stop offset="100%" style="stop-color:#bae6fd"/>
                                </linearGradient>
                                <linearGradient id="boxBottom" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#a5f3fc"/>
                                    <stop offset="100%" style="stop-color:#cffafe"/>
                                </linearGradient>
                                <linearGradient id="ball1" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" style="stop-color:#93c5fd"/>
                                    <stop offset="100%" style="stop-color:#60a5fa"/>
                                </linearGradient>
                                <linearGradient id="ball2" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" style="stop-color:#5eead4"/>
                                    <stop offset="100%" style="stop-color:#2dd4bf"/>
                                </linearGradient>
                                <linearGradient id="ball3" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" style="stop-color:#67e8f9"/>
                                    <stop offset="100%" style="stop-color:#22d3ee"/>
                                </linearGradient>
                                <linearGradient id="ball4" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" style="stop-color:#bae6fd"/>
                                    <stop offset="100%" style="stop-color:#7dd3fc"/>
                                </linearGradient>
                            </defs>
                            <!-- 盒子左侧面 -->
                            <path d="M 50 95 L 50 45 L 80 25 L 80 75 Z" fill="url(#boxLeft)" stroke="#e0f2fe" stroke-width="1"/>
                            <!-- 盒子右侧面 -->
                            <path d="M 80 75 L 80 25 L 110 45 L 110 95 Z" fill="url(#boxRight)" stroke="#e0f2fe" stroke-width="1"/>
                            <!-- 盒子底面 -->
                            <path d="M 50 95 L 80 75 L 110 95 L 80 115 Z" fill="url(#boxBottom)" stroke="#e0f2fe" stroke-width="1"/>
                            <!-- 盒内小球 -->
                            <circle cx="78" cy="68" r="9" fill="url(#ball1)" opacity="0.95"/>
                        </svg>
                    </div>
                    <p class="empty-state-text">没有可申请的应用</p>
                </div>
            </main>
        </div>

        <!-- 权限申请弹窗 -->
        <PermissionApplyModal
            v-model:visible="applyModalVisible"
            :resource="currentApplyResource"
            @submit="handleApplySubmit"
        />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PermissionApplyModal from '../components/PermissionApplyModal.vue'

const router = useRouter()
const searchKeyword = ref('')
const activeTab = ref('all') // all | expiring | expired
const selectedCategoryId = ref('default-1')

const tabs = [
    { value: 'all', label: '全部' },
    { value: 'expiring', label: '即将过期' },
    { value: 'expired', label: '已过期' }
]

// 左侧分类：默认资源组、其他资源组
const categoryTree = [
    { id: 'default-1', name: '默认资源组' },
    { id: 'other-1', name: '其他资源组' }
]

const currentCategoryName = computed(() => {
    const cat = categoryTree.find(c => c.id === selectedCategoryId.value)
    return cat ? cat.name : '默认资源组'
})

const activeTabLabel = computed(() => {
    const t = tabs.find(tab => tab.value === activeTab.value)
    return t ? t.label : ''
})

// 模拟资源分组数据
const resourceGroups = ref([
    {
        id: 'g1',
        categoryId: 'default-1',
        name: '默认资源组',
        resources: [
            { id: 'r1', name: '公司堡垒机', description: '【VPN配置转换】原ALL协议类型调整为TCP' }
        ]
    },
    {
        id: 'g2',
        categoryId: 'default-1',
        name: '默认资源组',
        resources: [
            { id: 'r2', name: 'sangfor_l3vpn' },
            { id: 'r3', name: 'sangfor_tcp', tempTag: true },
            { id: 'r4', name: 'ssh' },
            { id: 'r5', name: 'VPN控制台' },
            { id: 'r6', name: '控制台' },
            { id: 'r7', name: '跳板机' }
        ]
    },
    {
        id: 'g3',
        categoryId: 'other-1',
        name: '其他资源组',
        resources: [
            { id: 'r8', name: '安全设备1' },
            { id: 'r9', name: '安全设备2' }
        ]
    }
])

const filteredResourceGroups = computed(() => {
    // 即将过期、已过期暂无数据，仅「全部」有列表
    if (activeTab.value === 'expiring' || activeTab.value === 'expired') {
        return []
    }
    let list = resourceGroups.value.filter(g => g.categoryId === selectedCategoryId.value)
    const kw = searchKeyword.value.trim().toLowerCase()
    if (kw) {
        list = list.map(g => ({
            ...g,
            resources: g.resources.filter(r =>
                r.name.toLowerCase().includes(kw) ||
                (r.description && r.description.toLowerCase().includes(kw))
            )
        })).filter(g => g.resources.length > 0)
    }
    return list
})

const hasResourceGroups = computed(() => filteredResourceGroups.value.length > 0)

const applyModalVisible = ref(false)
const currentApplyResource = ref(null)

const handleBack = () => router.push('/')

const openApplyModal = (resource) => {
    currentApplyResource.value = resource
    applyModalVisible.value = true
}

const handleApplySubmit = () => {
    applyModalVisible.value = false
    currentApplyResource.value = null
    // 可在此处提示申请成功、刷新列表等
}
</script>

<style scoped>
.apply-permission-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
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

.search-wrap {
    margin-left: auto;
    position: relative;
    display: flex;
    align-items: center;
}
.search-input {
    width: 220px;
    height: 36px;
    padding: 8px 36px 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #334155;
    outline: none;
    transition: border-color 0.2s;
}
.search-input::placeholder {
    color: #94a3b8;
}
.search-input:focus {
    border-color: #3b82f6;
}
.search-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
}

.tabs-wrap {
    display: flex;
    gap: 4px;
    padding: 12px 20px 0;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
}
.tab-btn {
    padding: 10px 20px;
    border: none;
    background: transparent;
    font-size: 14px;
    color: #64748b;
    cursor: pointer;
    border-radius: 6px 6px 0 0;
    transition: all 0.2s;
}
.tab-btn:hover {
    color: #334155;
}
.tab-btn.active {
    background: #3b82f6;
    color: #fff;
    font-weight: 500;
}

.page-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.category-nav {
    width: 120px;
    flex-shrink: 0;
    border-right: 1px solid #e2e8f0;
    overflow-y: auto;
    background: #fafafa;
}
.category-list {
    list-style: none;
    margin: 0;
    padding: 12px 0;
}
.category-item {
    padding: 10px 12px;
    font-size: 14px;
    color: #475569;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
}
.category-item:hover {
    background: #f1f5f9;
    color: #1e293b;
}
.category-item.active {
    background: #eff6ff;
    color: #2563eb;
    font-weight: 500;
}

.content-main {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px 24px;
    min-width: 0;
}

.content-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px;
}

.resource-groups {
    display: flex;
    flex-direction: column;
    gap: 24px;
}
.resource-group {
    margin: 0;
}
.group-title {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    margin: 0 0 12px;
}
.resource-list {
    list-style: none;
    margin: 0;
    padding: 0;
}
.resource-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.resource-row:hover {
    border-color: #cbd5e1;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.resource-icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background: #3b82f6;
    color: #fff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.resource-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.resource-name {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
}
.resource-desc {
    font-size: 13px;
    color: #64748b;
}
.resource-tag {
    font-size: 12px;
    color: #f59e0b;
    background: #fffbeb;
    padding: 2px 8px;
    border-radius: 4px;
}
.btn-apply {
    flex-shrink: 0;
    padding: 8px 16px;
    font-size: 14px;
    color: #2563eb;
    background: #fff;
    border: 1px solid #2563eb;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
}
.btn-apply:hover {
    background: #eff6ff;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    padding: 48px 24px;
    text-align: center;
}
.empty-state-illus {
    margin-bottom: 24px;
}
.empty-box-svg {
    width: 160px;
    height: 140px;
    display: block;
}
.empty-state-text {
    margin: 0;
    font-size: 15px;
    color: #475569;
    font-weight: 500;
}
</style>
