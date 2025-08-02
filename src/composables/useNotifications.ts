import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
  persistent?: boolean
}

const notifications = ref<Notification[]>([])
const pendingTransactions = ref<Set<string>>(new Set())

// Generate unique ID for notifications
const generateId = () => Math.random().toString(36).substr(2, 9)

// Add notification
const addNotification = (notification: Omit<Notification, 'id'>) => {
  const id = generateId()
  const newNotification: Notification = {
    id,
    duration: 5000, // Default 5 seconds
    persistent: false,
    ...notification,
  }

  notifications.value.push(newNotification)

  // Auto-remove non-persistent notifications
  if (!newNotification.persistent && newNotification.duration) {
    setTimeout(() => {
      removeNotification(id)
    }, newNotification.duration)
  }

  return id
}

// Remove notification
const removeNotification = (id: string) => {
  const index = notifications.value.findIndex((n) => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// Clear all notifications
const clearNotifications = () => {
  notifications.value = []
}

// Add pending transaction
const addPendingTransaction = (txHash: string) => {
  pendingTransactions.value.add(txHash)
}

// Remove pending transaction
const removePendingTransaction = (txHash: string) => {
  pendingTransactions.value.delete(txHash)
}

// Check if transaction is pending
const isTransactionPending = (txHash: string) => {
  return pendingTransactions.value.has(txHash)
}

// Get pending transactions count
const getPendingCount = () => pendingTransactions.value.size

// Convenience methods for different notification types
const success = (title: string, message?: string) => {
  return addNotification({
    type: 'success',
    title,
    message: message || title,
  })
}

const error = (title: string, message?: string) => {
  return addNotification({
    type: 'error',
    title,
    message: message || title,
    persistent: true, // Errors are persistent by default
  })
}

const info = (title: string, message?: string) => {
  return addNotification({
    type: 'info',
    title,
    message: message || title,
  })
}

const warning = (title: string, message?: string) => {
  return addNotification({
    type: 'warning',
    title,
    message: message || title,
  })
}

// Transaction notification helpers
const transactionPending = (txHash: string, title: string) => {
  addPendingTransaction(txHash)
  return addNotification({
    type: 'info',
    title,
    message: `Giao dịch ${txHash.slice(0, 10)}... đang chờ xử lý`,
    persistent: true,
  })
}

const transactionSuccess = (txHash: string, title: string) => {
  removePendingTransaction(txHash)
  return addNotification({
    type: 'success',
    title,
    message: `Giao dịch ${txHash.slice(0, 10)}... đã hoàn thành thành công`,
  })
}

const transactionError = (txHash: string, title: string, errorMessage?: string) => {
  removePendingTransaction(txHash)
  return addNotification({
    type: 'error',
    title,
    message: errorMessage || `Giao dịch ${txHash.slice(0, 10)}... thất bại`,
    persistent: true,
  })
}

export function useNotifications() {
  return {
    // State
    notifications,
    pendingTransactions,

    // Methods
    addNotification,
    removeNotification,
    clearNotifications,
    addPendingTransaction,
    removePendingTransaction,
    isTransactionPending,
    getPendingCount,

    // Convenience methods
    success,
    error,
    info,
    warning,

    // Transaction helpers
    transactionPending,
    transactionSuccess,
    transactionError,
  }
}
