<!-- src/components/LoginUI/LoginInput.vue -->
<script setup>
defineProps({
    label: String,
    placeholder: String,
    modelValue: String,
    type: {
        type: String,
        default: 'text'
    }
})

defineEmits(['update:modelValue'])
</script>

<template>
    <div class="input-group">
        <label>{{ label }}</label>
        <input :type="type" :placeholder="placeholder" :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)" />
    </div>
</template>

<style scoped>
.input-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    color: #555;
}

.input-group input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
}
</style>