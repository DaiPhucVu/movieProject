<template>
  <div class="user-card cl-card p-3 d-flex align-items-center gap-3">
    <RouterLink :to="`/profile/${user.username}`" class="flex-shrink-0">
      <img
        :src="avatarUrl(user, 96)"
        :alt="user.displayName"
        class="user-avatar"
      />
    </RouterLink>

    <div class="flex-grow-1 min-w-0">
      <RouterLink
        :to="`/profile/${user.username}`"
        class="user-name text-decoration-none d-block"
      >{{ user.displayName }}</RouterLink>
      <p class="cl-dim small mb-1">@{{ user.username }}</p>
      <p v-if="user.bio" class="user-bio cl-muted small mb-0">{{ user.bio }}</p>
    </div>

    <button
      v-if="canFollow && !isSelf"
      type="button"
      class="cl-btn cl-btn-sm flex-shrink-0"
      :class="user.isFollowing ? 'cl-btn-ghost' : (user.followRequestPending ? 'cl-btn-ghost' : 'cl-btn-primary')"
      :disabled="pending"
      @click="$emit('toggle', user)"
    >
      <span v-if="pending">…</span>
      <span v-else-if="user.isFollowing">✓ Following</span>
      <span v-else-if="user.followRequestPending">Requested</span>
      <span v-else>+ Follow</span>
    </button>
    <span
      v-else-if="isSelf"
      class="cl-badge cl-badge-accent flex-shrink-0"
    >You</span>
  </div>
</template>

<script setup>
import { avatarUrl } from '../utils/avatar'

defineProps({
  user:      { type: Object,  required: true },
  pending:   { type: Boolean, default: false },
  isSelf:    { type: Boolean, default: false },
  canFollow: { type: Boolean, default: false },
})

defineEmits(['toggle'])
</script>

<style scoped>
.user-card {
  transition: border-color var(--cl-transition), transform var(--cl-transition);
}
.user-card:hover {
  border-color: var(--cl-border-hover);
  transform: translateY(-2px);
}
.user-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--cl-border);
}
.user-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--cl-text);
}
.user-name:hover { color: var(--cl-accent); }
.user-bio {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.min-w-0 { min-width: 0; }

@media (max-width: 575.98px) {
  .user-avatar { width: 48px; height: 48px; }
}
</style>
