<template>
  <el-button
    :type="type"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'large' | 'default' | 'small'
  loading?: boolean
  disabled?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>
