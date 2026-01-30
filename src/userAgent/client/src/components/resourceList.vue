<template>
    <div class="resource-list">
        <h2 class="title">资源列表</h2>
        
        <!-- 搜索框 - 绝对定位在右上角 -->
        <div class="search-box">
            <div class="search-input-wrapper">
                <input 
                    v-model="searchKeyword" 
                    type="text" 
                    placeholder="搜索资源..." 
                    class="search-input"
                    @focus="isFocused = true"
                    @blur="isFocused = false"
                />
                <svg v-if="searchKeyword" @click="clearSearch" class="clear-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <svg v-if="!isFocused && !searchKeyword" class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
            </div>
        </div>

        <!-- 复用同一个子组件渲染三种分类 -->
        <ResourceCategory v-for="cat in filteredCategories" :key="cat.type" :type="cat.type" :title="cat.title"
            :items="cat.items" />

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
import { ref, computed } from 'vue'
import ResourceCategory from '@/components/resourceCategory/index.vue'  // 引入子组件
import axios from 'axios'

const props = defineProps({
    resources: { type: Array, required: true },
})

const resources = ref(props.resources)
const searchKeyword = ref('')
const isFocused = ref(false)

// 清除搜索
const clearSearch = () => {
    searchKeyword.value = ''
}

// 搜索过滤函数
const filterResources = (items, keyword) => {
    if (!keyword.trim()) return items
    const lowerKeyword = keyword.toLowerCase()
    return items.filter(item => {
        return item.name && item.name.toLowerCase().includes(lowerKeyword)
    })
}

// 分类并映射标题
const categories = computed(() => [
    {
        type: 'web_page',
        title: '网页',
        items: resources.value.filter(i => i.type === 'web_page')
    },
    {
        type: 'api',
        title: 'API 接口',
        items: resources.value.filter(i => i.type === 'api')
    },
    {
        type: 'static',
        title: '静态资源',
        items: resources.value.filter(i => i.type === 'static')
    }
])

// 根据搜索关键词过滤分类
const filteredCategories = computed(() => {
    if (!searchKeyword.value.trim()) {
        return categories.value
    }
    
    const filtered = categories.value.map(cat => ({
        ...cat,
        items: filterResources(cat.items, searchKeyword.value)
    })).filter(cat => cat.items.length > 0)
    
    return filtered
})



async function test() {
    try {
        const resp = await axios.post(
            '/api/auth/access/3',   // ← 你的用户代理地址
            {
                name: "测试"
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('响应:', resp.data);
    } catch (err) {
        console.error('请求失败:', err.response?.data || err.message);
    }
}




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

.search-box {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    padding-right: 0;
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