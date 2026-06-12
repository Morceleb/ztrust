<!-- src/components/LoginUI/LoginButton.vue -->
<script setup>
defineProps({
    text: String
})

defineEmits(['click'])
</script>

<template>
    <button class="login-btn" @click="$emit('click')">
        {{ text }}
    </button>
</template>

<style scoped>
.login-btn {
    width: 100%;
    padding: 14px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
}

.login-btn:hover {
    background: #79bbff;
}
</style>