import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseApiFieldErrors } from '@/lib/parse-api-field-errors'
import { type CreateDonorFormData, createDonorSchema } from './donor-schema'

interface DonorFormProps {
  defaultValues?: Partial<CreateDonorFormData>
  onSubmit: (data: CreateDonorFormData) => void | Promise<void>
  onCancel?: () => void
  submitting?: boolean
}

export function DonorForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: DonorFormProps) {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createDonorSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? '',
      nationalId: defaultValues?.nationalId ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
    },
  })

  async function submitHandler(data: CreateDonorFormData) {
    try {
      await onSubmit(data)
    } catch (err) {
      const fields = parseApiFieldErrors(err)
      for (const [field, message] of Object.entries(fields)) {
        setError(field as keyof CreateDonorFormData, { message })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('donors.fullName')}</Label>
          <Input
            id="fullName"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            {...register('fullName')}
          />
          {errors.fullName && (
            <p
              id="fullName-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationalId">{t('donors.nationalId')}</Label>
          <Input
            id="nationalId"
            aria-invalid={!!errors.nationalId}
            aria-describedby={
              errors.nationalId ? 'nationalId-error' : undefined
            }
            {...register('nationalId')}
          />
          {errors.nationalId && (
            <p
              id="nationalId-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.nationalId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('donors.emailOptional')}</Label>
          <Input
            id="email"
            type="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('donors.phoneOptional')}</Label>
          <Input id="phone" {...register('phone')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t('donors.addressOptional')}</Label>
        <Input id="address" {...register('address')} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? t('common.loading') : t('common.save')}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}
