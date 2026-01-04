<template>
    <button @click="login">登录</button>
</template>

<script setup>

const props = defineProps({
    username: {
        type: String,
        required: true,
        default: '默认值'
    },
    password: {
        type: Number,
        default: 0
    }
})

const login = () => {
    console.log(username, password)
}


</script>
