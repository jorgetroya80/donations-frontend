import { Input as InputPrimitive } from '@base-ui/react/input'
import { Eye, EyeOff } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

const baseClass =
  'border-input file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = React.useState(false)

  if (type === 'password') {
    return (
      <div className="relative">
        <InputPrimitive
          type={showPassword ? 'text' : 'password'}
          data-slot="input"
          className={cn(baseClass, 'pr-8', className)}
          {...props}
        />
        <button
          type="button"
          aria-label={
            showPassword ? t('common.hidePassword') : t('common.showPassword')
          }
          onClick={() => setShowPassword((v) => !v)}
          className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    )
  }

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(baseClass, className)}
      {...props}
    />
  )
}

export { Input }
