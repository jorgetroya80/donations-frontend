import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type CreateDonorFormData, createDonorSchema } from './donor-schema'

interface DonorFormProps {
  defaultValues?: Partial<CreateDonorFormData>
  onSubmit: (data: CreateDonorFormData) => void
  onCancel?: () => void
  submitting?: boolean
  submitLabel: string
}

export function DonorForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: DonorFormProps) {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createDonorSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? '',
      dniNie: defaultValues?.dniNie ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Label htmlFor="dniNie">{t('donors.dniNie')}</Label>
          <Input
            id="dniNie"
            aria-invalid={!!errors.dniNie}
            aria-describedby={errors.dniNie ? 'dniNie-error' : undefined}
            {...register('dniNie')}
          />
          {errors.dniNie && (
            <p
              id="dniNie-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.dniNie.message}
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
          {submitting ? t('common.loading') : submitLabel}
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
