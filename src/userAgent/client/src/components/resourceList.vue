<template>
    <div class="resource-list">
        <h2 class="title">资源列表</h2>

        <!-- 视图切换按钮 + 搜索框 -->
        <div class="header-actions">
            <div class="view-toggle">
                <button type="button" class="view-btn" :class="{ active: viewMode === 'square' }"
                    @click="viewMode = 'square'" title="正方形图标">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                    </svg>
                </button>
                <button type="button" class="view-btn" :class="{ active: viewMode === 'horizontal' }"
                    @click="viewMode = 'horizontal'" title="横向长方形图标">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                </button>
            </div>
            <div class="search-box">
                <div class="search-input-wrapper">
                    <input v-model="searchKeyword" type="text" placeholder="搜索资源..." class="search-input"
                        @focus="isFocused = true" @blur="isFocused = false" />
                    <svg v-if="searchKeyword" @click="clearSearch" class="clear-icon" xmlns="http://www.w3.org/2000/svg"
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <svg v-if="!isFocused && !searchKeyword" class="search-icon" xmlns="http://www.w3.org/2000/svg"
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- 复用同一个子组件渲染三种分类 -->
        <ResourceCategory v-for="cat in filteredCategories" :key="cat.type" :type="cat.type" :title="cat.title"
            :items="cat.items" :view-mode="viewMode" />

        <!-- 空状态 -->
        <div v-if="resources.length === 0" class="empty">
            暂无资源数据
        </div>

        <!-- 搜索无结果 -->
        <div v-if="searchKeyword && filteredCategories.length === 0" class="empty">
            没有找到匹配的应用
        </div>
    </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import ResourceCategory from '@/components/resourceCategory/index.vue'  // 引入子组件

const props = defineProps({
    resources: { type: Array, required: true },
})

const selectedCategory = inject('selectedCategory', ref(null))

const resources = ref(props.resources)
const searchKeyword = ref('')
const isFocused = ref(false)
// 视图模式：square 正方形图标，horizontal 横向长方形图标
const viewMode = ref('square')

// 清除搜索
const clearSearch = () => {
    searchKeyword.value = ''
}

const matchResourceName = (item, keyword) => {
    if (!keyword.trim() || !item) return false
    const name = (item.name || '').toString().toLowerCase()
    const k = keyword.trim().toLowerCase()
    return name.includes(k)
}

// 分类并映射标题
const categories = computed(() => [
    { type: 'web_page', title: '网页', items: resources.value.filter(i => i.type === 'web_page') },
    { type: 'api', title: 'API 接口', items: resources.value.filter(i => i.type === 'api') },
    { type: 'static', title: '静态资源', items: resources.value.filter(i => i.type === 'static') },
    { type: 'database', title: '数据库资源', items: resources.value.filter(i => i.type === 'database') }

])

// 先按搜索词过滤，再按选中的类别筛选
const filteredCategories = computed(() => {
    const keyword = searchKeyword.value.trim()
    let list = categories.value;

    if (keyword) {
        list = list
            .map(cat => ({
                ...cat,
                items: cat.items.filter(item => matchResourceName(item, keyword))
            }))
            .filter(cat => cat.items.length > 0)
    }

    const cat = selectedCategory?.value
    if (cat != null) {
        list = list.filter(c => c.type === cat)
    }
    return list
})



</script>

<style scoped>
.resource-list {
    width: 100%;
    margin: 0;
    padding: 10px 0 10px 0;
    font-family: system-ui, sans-serif;
    position: relative;
    box-sizing: border-box;
}

.title {
    font-size: 24px;
    margin: 0 0 30px 0;
    color: #333;
}

.header-actions {
    position: absolute;
    top: 15px;
    right: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.view-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
}

.view-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: #fff;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
}

.view-btn:hover {
    border-color: #42b883;
    color: #42b883;
}

.view-btn.active {
    background: #42b883;
    border-color: #42b883;
    color: #fff;
}

.search-box {
    display: flex;
    align-items: center;
}

.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-input {
    padding: 8px 40px 8px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-size: 14px;
    width: 250px;
    transition: all 0.2s;
    outline: none;
}

.search-input:focus {
    border-color: #42b883;
    box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.clear-icon {
    position: absolute;
    right: 30px;
    cursor: pointer;
    color: #999;
    transition: color 0.2s;
    z-index: 1;
}

.clear-icon:hover {
    color: #333;
}

.search-icon {
    position: absolute;
    right: 10px;
    color: #666;
    pointer-events: none;
    transition: opacity 0.2s;
}

.empty {
    text-align: center;
    color: #999;
    font-size: 18px;
    padding: 60px 0;
}
</style>