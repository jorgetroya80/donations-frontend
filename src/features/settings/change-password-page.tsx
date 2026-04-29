import { zodResolver } from '@hookform/resolvers/zod'
import { HTTPError } from 'ky'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type ChangePasswordFormData,
  changePasswordSchema,
} from './change-password-schema'
import { useChangePassword } from './use-change-password'

export function ChangePasswordPage() {
  const { t } = useTranslation()
  const mutation = useChangePassword()
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: ChangePasswordFormData) {
    setSuccess(false)
    setApiError('')
    try {
      await mutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      setSuccess(true)
      reset()
    } catch (err) {
      if (err instanceof HTTPError && err.response.status === 400) {
        setApiError(t('settings.errorCurrentPassword'))
      } else {
        setApiError(t('settings.errorChanging'))
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.changePassword')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        {success && (
          <Alert>
            <AlertDescription>{t('settings.successChanged')}</AlertDescription>
          </Alert>
        )}

        {apiError && (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="currentPassword">
            {t('settings.currentPassword')}
          </Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            aria-describedby={
              errors.currentPassword ? 'currentPassword-error' : undefined
            }
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p
              id="currentPassword-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            aria-describedby={
              errors.newPassword ? 'newPassword-error' : undefined
            }
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p
              id="newPassword-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            {t('settings.confirmPassword')}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? 'confirmPassword-error' : undefined
            }
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p
              id="confirmPassword-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('common.save')}
        </Button>
      </form>
    </div>
  )
}
