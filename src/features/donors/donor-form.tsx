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
  submitting?: boolean
  submitLabel: string
}

export function DonorForm({
  defaultValues,
  onSubmit,
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
          <Input id="fullName" {...register('fullName')} />
          {errors.fullName && (
            <p className="text-sm text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dniNie">{t('donors.dniNie')}</Label>
          <Input id="dniNie" {...register('dniNie')} />
          {errors.dniNie && (
            <p className="text-sm text-destructive">{errors.dniNie.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('donors.emailOptional')}</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
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
      </div>
    </form>
  )
}
