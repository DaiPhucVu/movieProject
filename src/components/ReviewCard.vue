<template>
  <div class="review-card">
    <div class="review-header">
      <RouterLink :to="`/profile/${review.user.username}`" class="reviewer">
        <img :src="avatarUrl(review.user, 80)" :alt="review.user.displayName" class="reviewer-avatar" />
        <div>
          <p class="reviewer-name">{{ review.user.displayName }}</p>
          <p class="review-date">{{ formatDate(review.createdAt) }}</p>
        </div>
      </RouterLink>
      <div class="review-rating">
        <span v-for="i in 10" :key="i" class="star" :class="{ filled: i <= review.rating }">★</span>
        <span class="rating-num">{{ review.rating }}/10</span>
      </div>
    </div>
    <p class="review-content">{{ review.content }}</p>
    <div class="review-footer">
      <button class="like-btn" :class="{ liked: review.liked }" @click="handleLike">
        <span>♥</span> {{ review.likes }}
      </button>
      <div v-if="canEdit" class="review-actions">
        <RouterLink :to="`/review/edit/${review.id}`" class="btn btn-ghost btn-xs">Edit</RouterLink>
        <button class="btn btn-danger btn-xs" @click="$emit('delete', review.id)">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useMediaStore } from '../stores/media'
import { avatarUrl } from '../utils/avatar'

const props = defineProps({ review: { type: Object, required: true } })
defineEmits(['delete'])

const auth = useAuthStore()
const mediaStore = useMediaStore()
const canEdit = computed(() => auth.isAuthenticated && auth.user?.id === props.review.userId)

function handleLike() {
  if (!auth.isAuthenticated) return
  mediaStore.toggleReviewLike(props.review.id, auth.user.id)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.review-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color var(--transition);
}
.review-card:hover { border-color: var(--border-hover); }
.review-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; }
.reviewer { display: flex; align-items: center; gap: 10px; }
.reviewer-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); }
.reviewer-name { font-size: 0.9rem; font-weight: 500; color: var(--text); }
.review-date { font-size: 0.75rem; color: var(--text-muted); }
.review-rating { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.star { font-size: 0.75rem; color: var(--text-dim); }
.star.filled { color: var(--accent); }
.rating-num { font-size: 0.78rem; font-weight: 600; color: var(--accent); margin-left: 6px; }
.review-content { font-size: 0.92rem; color: var(--text-muted); line-height: 1.7; }
.review-footer { display: flex; justify-content: space-between; align-items: center; }
.like-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8rem; color: var(--text-dim);
  background: none; border: 1px solid var(--border);
  padding: 5px 12px; border-radius: 100px;
  cursor: pointer; transition: all var(--transition);
}
.like-btn:hover, .like-btn.liked { color: var(--red); border-color: rgba(232,93,93,0.4); background: rgba(232,93,93,0.08); }
.review-actions { display: flex; gap: 8px; }
.btn-xs { padding: 5px 12px; font-size: 0.78rem; }
</style>
