<template>
    <div class="resource-list">
        <h2 class="title">资源列表</h2>

        <!-- 复用同一个子组件渲染三种分类 -->
        <ResourceCategory v-for="cat in categories" :key="cat.type" :type="cat.type" :title="cat.title"
            :items="cat.items" />

        <!-- 空状态 -->
        <div v-if="resources.length === 0" class="empty">
            暂无资源数据
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
    max-width: 1000px;
    margin: 0 ;
    padding: 10px 10px 10px 0;
    font-family: system-ui, sans-serif;
}

.title {
    font-size: 24px;
    margin-bottom: 30px;
    color: #333;
}

.empty {
    text-align: center;
    color: #999;
    font-size: 18px;
    padding: 60px 0;
}
</style>