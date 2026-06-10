<!-- src/components/LoginUI/LoginDivider.vue -->
<script setup>
defineProps({
    text: {
        type: String,
        default: ''
    }
})
</script>

<template>
    <div class="divider">
        <!-- 有文字时：只显示文字，不显示横线 -->
        <span v-if="text" class="divider-text">
            {{ text }}
        </span>

        <!-- 没有文字时：只显示横线 -->
        <div v-else class="divider-line"></div>
    </div>
</template>

<style scoped>
.divider {
    width: 100%;
}

/* 有文字时：只显示文字 */
.divider-text {
    display: block;
    text-align: center;
    font-size: 14px;
    color: #999;
}

/* 无文字时：显示纯分割线 */
.divider-line {
    height: 1px;
    background: #eeeeee;
    width: 100%;
}
</style>