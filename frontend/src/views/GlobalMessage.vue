<!-- GlobalMessage.vue -->
<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        :class="['toast', toast.type]"
        @click="removeToast(toast.id)"
      >
        <div class="toast-content">
          <div class="toast-icon">
            <i :class="getIconClass(toast.type)"></i>
          </div>
          <div class="toast-text">
            <div class="toast-title">{{ getTitle(toast.type) }}</div>
            <div class="toast-message">{{ toast.content }}</div>
          </div>
        </div>
        <button class="toast-close" @click.stop="removeToast(toast.id)">
          <i class="fas fa-times"></i>
        </button>
        <div v-if="toast.duration > 0" class="toast-progress">
          <div 
            class="toast-progress-bar" 
            :style="{
              'animation-duration': `${toast.duration}ms`,
              'animation-play-state': toast.paused ? 'paused' : 'running'
            }"
            @animationend="handleProgressEnd(toast.id)"
          ></div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
export default {
  name: 'GlobalMessage',
  data() {
    return {
      toasts: [],
      nextId: 1
    }
  },
  methods: {
    addMessage(content, type = 'info', duration = 5000) {
      const id = this.nextId++
      const toast = {
        id,
        content,
        type,
        duration,
        paused: false,
        timer: null
      }
      
      this.toasts.unshift(toast)
      
      // 自动移除
      if (duration > 0) {
        toast.timer = setTimeout(() => {
          this.removeToast(id)
        }, duration)
      }
      
      return id
    },
    
    removeToast(id) {
      const index = this.toasts.findIndex(toast => toast.id === id)
      if (index !== -1) {
        const toast = this.toasts[index]
        if (toast.timer) {
          clearTimeout(toast.timer)
        }
        this.toasts.splice(index, 1)
      }
    },
    
    clearAll() {
      this.toasts.forEach(toast => {
        if (toast.timer) {
          clearTimeout(toast.timer)
        }
      })
      this.toasts = []
    },
    
    getIconClass(type) {
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      }
      return icons[type] || icons.info
    },
    
    getTitle(type) {
      const titles = {
        success: '成功',
        error: '错误',
        warning: '警告',
        info: '提示'
      }
      return titles[type] || '提示'
    },
    
    handleProgressEnd(toastId) {
      // 进度条动画结束时自动移除 toast
      this.removeToast(toastId)
    },
    
    // 可选：暂停/恢复进度条动画（用于悬停效果）
    pauseProgress(toastId) {
      const toast = this.toasts.find(t => t.id === toastId)
      if (toast) {
        toast.paused = true
      }
    },
    
    resumeProgress(toastId) {
      const toast = this.toasts.find(t => t.id === toastId)
      if (toast) {
        toast.paused = false
      }
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #1976d2;
  cursor: pointer;
  pointer-events: all;
  transition: all 0.3s ease;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.toast:hover {
  transform: translateX(-5px) translateY(-2px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

/* 进入和离开动画 */
.toast-enter-active {
  animation: toastIn 0.4s ease;
}

.toast-leave-active {
  animation: toastOut 0.4s ease;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.toast-icon {
  font-size: 20px;
  margin-top: 2px;
  flex-shrink: 0;
}

.toast.success .toast-icon {
  color: #10b981;
}

.toast.error .toast-icon {
  color: #ef4444;
}

.toast.warning .toast-icon {
  color: #f59e0b;
}

.toast.info .toast-icon {
  color: #3b82f6;
}

.toast-text {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: #1f2937;
}

.toast.success .toast-title {
  color: #10b981;
}

.toast.error .toast-title {
  color: #ef4444;
}

.toast.warning .toast-title {
  color: #f59e0b;
}

.toast.info .toast-title {
  color: #3b82f6;
}

.toast-message {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 8px;
}

.toast-close:hover {
  background: #f3f4f6;
  color: #6b7280;
}

/* 进度条 - 自动缩回 */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.toast-progress-bar {
  height: 100%;
  background: currentColor;
  border-radius: 0 0 12px 12px;
  transform-origin: left;
  animation: progressShrink linear forwards;
}

/* 进度条缩回动画 */
@keyframes progressShrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

.toast.success .toast-progress-bar {
  background: #10b981;
}

.toast.error .toast-progress-bar {
  background: #ef4444;
}

.toast.warning .toast-progress-bar {
  background: #f59e0b;
}

.toast.info .toast-progress-bar {
  background: #3b82f6;
}

/* 边框颜色 */
.toast.success {
  border-left-color: #10b981;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast.warning {
  border-left-color: #f59e0b;
}

.toast.info {
  border-left-color: #3b82f6;
}

/* 可选：添加悬停暂停效果 */
.toast:hover .toast-progress-bar {
  animation-play-state: paused;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .toast-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .toast {
    padding: 14px;
  }
  
  .toast-content {
    gap: 10px;
  }
  
  .toast-icon {
    font-size: 18px;
  }
  
  .toast-title {
    font-size: 13px;
  }
  
  .toast-message {
    font-size: 13px;
  }
}
</style>