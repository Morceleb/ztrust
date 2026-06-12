<!-- src/components/LoginUI/SocialLogin.vue -->
<script setup>
defineProps({
    providers: {
        type: Array,
        default: () => []
    }
})

defineEmits(['social-click'])
</script>

<template>
    <div class="social-area">
        <div v-for="provider in providers" :key="provider" class="social-item" @click="$emit('social-click', provider)">
            <button class="social-btn">
                {{ getProviderIcon(provider) }}
            </button>
            <span class="social-text">{{ getProviderName(provider) }}</span>
        </div>
    </div>
</template>

<script>
const providerNames = {
    wechat: '微信',
    google: 'Google',
    github: 'GitHub',
    qq: 'QQ',
    dingding: '钉钉',
    feishu: '飞书'
}

const providerIcons = {
    wechat: '微',
    google: 'G',
    github: 'Git',
    qq: 'Q',
    dingding: '钉',
    feishu: '飞'
}

function getProviderName(p) {
    return providerNames[p] || p
}

function getProviderIcon(p) {
    return providerIcons[p] || '🔗'
}
</script>

<style scoped>
.social-area {
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
}

.social-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    user-select: none;
}

.social-btn {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    border: 1px solid #e0e0e0;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.social-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #409eff;
}

.social-text {
    margin-top: 8px;
    font-size: 13px;
    color: #666;
    text-align: center;
    white-space: nowrap;
}
</style>