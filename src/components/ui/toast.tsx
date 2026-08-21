'use client'

import { Toast as ToastPrimitive } from '@base-ui/react/toast'
import { XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ToastProvider = ToastPrimitive.Provider
const useToast = ToastPrimitive.useToastManager

function Toaster() {
  const { t } = useTranslation()
  const { toasts } = ToastPrimitive.useToastManager()

  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport
        data-slot="toast-viewport"
        className="fixed right-4 bottom-4 z-50 flex w-72 flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            toast={toast}
            data-slot="toast"
            className="data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0 relative w-full rounded-lg border bg-card p-3 pr-8 text-card-foreground shadow-md transition-all duration-200"
          >
            <ToastPrimitive.Title
              data-slot="toast-title"
              className="text-sm font-medium"
            />
            <ToastPrimitive.Description
              data-slot="toast-description"
              className="text-sm text-muted-foreground"
            />
            <ToastPrimitive.Close
              aria-label={t('common.close')}
              className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
            >
              <XIcon className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  )
}

export { Toaster, ToastProvider, useToast }
