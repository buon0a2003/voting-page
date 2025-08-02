<template>
  <div class="notification-center">
    <div v-if="getPendingCount() > 0" class="pending-indicator">
      <div class="notification is-info is-light">
        <div class="columns is-vcentered is-mobile">
          <div class="column">
            <p class="has-text-weight-semibold">
              <span class="icon is-small mr-2">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              {{ getPendingCount() }} transaction{{ getPendingCount() > 1 ? 's' : '' }} pending
            </p>
          </div>
          <div class="column is-narrow">
            <button class="delete is-small" @click="clearNotifications"></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <TransitionGroup name="notification" tag="div" class="notifications-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'notification',
          `is-${getNotificationClass(notification.type)}`,
          'notification-item',
        ]"
      >
        <div class="columns is-vcentered is-mobile">
          <div class="column">
            <div class="notification-header">
              <p class="has-text-weight-semibold">{{ notification.title }}</p>
              <p
                v-if="notification.message && notification.message !== notification.title"
                class="is-size-7 mt-1"
              >
                {{ notification.message }}
              </p>
            </div>
          </div>
          <div class="column is-narrow">
            <button
              class="delete"
              @click="removeNotification(notification.id)"
              :aria-label="`Close ${notification.title} notification`"
            ></button>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '../composables/useNotifications'

const { notifications, removeNotification, clearNotifications, getPendingCount } =
  useNotifications()

const getNotificationClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'success'
    case 'error':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'info':
    default:
      return 'info'
  }
}
</script>

<style scoped>
.notification-center {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  width: 100%;
}

.pending-indicator {
  margin-bottom: 10px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  margin-bottom: 0;
  color: #ffffff;
}

.notification-header {
  word-break: break-word;
}

/* Transition animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* Responsive design */
@media (max-width: 768px) {
  .notification-center {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
