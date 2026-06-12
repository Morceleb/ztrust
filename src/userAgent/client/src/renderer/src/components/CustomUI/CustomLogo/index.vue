<!-- src/components/LoginUI/LoginLogo.vue -->
<script setup>
defineProps({
    text: String,
    imageUrl: String,
    showImage: Boolean
})
</script>

<template>
    <div class="logo-area">
        <img v-if="showImage && imageUrl" :src="imageUrl" alt="logo" class="logo-img" />
        <h1 v-if="text" class="logo-text">{{ text }}</h1>
    </div>
</template>

<style scoped>
.logo-area {
    text-align: center;
}

.logo-img {
    max-height: 80px;
}

.logo-text {
    font-size: 28px;
    font-weight: 700;
    color: #333;
}
</style>