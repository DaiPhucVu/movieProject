<template>
  <div v-if="totalPages > 1" class="pagination">
    <button class="page-btn" :disabled="currentPage === 1" @click="$emit('update:currentPage', currentPage - 1)">‹</button>
    <button
      v-for="page in visiblePages" :key="page"
      class="page-btn" :class="{ active: page === currentPage }"
      @click="$emit('update:currentPage', page)"
    >{{ page }}</button>
    <button class="page-btn" :disabled="currentPage === totalPages" @click="$emit('update:currentPage', currentPage + 1)">›</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})
defineEmits(['update:currentPage'])

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
</script>
