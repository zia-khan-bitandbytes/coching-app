import { toast } from "sonner"

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 4000,
    style: {
      background: '#10b981',
      color: 'white',
      border: '1px solid #059669',
    },
  })
}

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 5000,
    style: {
      background: '#ef4444',
      color: 'white',
      border: '1px solid #dc2626',
    },
  })
}

export const showInfoToast = (message: string) => {
  toast.info(message, {
    duration: 4000,
    style: {
      background: '#3b82f6',
      color: 'white',
      border: '1px solid #2563eb',
    },
  })
} 