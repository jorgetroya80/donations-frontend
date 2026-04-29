import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { DonorResponse } from '@/lib/api-types'
import {
  type CreateDonationFormData,
  createDonationSchema,
  donationTypes,
  paymentMethods,
} from './donation-schema'

interface DonationFormProps {
  defaultValues?: Partial<CreateDonationFormData>
  donors: DonorResponse[]
  onSubmit: (data: CreateDonationFormData) => void
  onCancel?: () => void
  submitting?: boolean
  submitLabel: string
}

export function DonationForm({
  defaultValues,
  donors,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: DonationFormProps) {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateDonationFormData>({
    resolver: zodResolver(createDonationSchema),
    defaultValues: {
      amount: undefined,
      donationDate: '',
      donationType: undefined,
      paymentMethod: undefined,
      donorId: null,
      notes: '',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">{t('donations.amount')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? 'amount-error' : undefined}
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && (
            <p
              id="amount-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.amount.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="donationDate">{t('donations.date')}</Label>
          <Input
            id="donationDate"
            type="date"
            aria-invalid={!!errors.donationDate}
            aria-describedby={
              errors.donationDate ? 'donationDate-error' : undefined
            }
            {...register('donationDate')}
          />
          {errors.donationDate && (
            <p
              id="donationDate-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.donationDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="donationType">{t('donations.type')}</Label>
          <Controller
            control={control}
            name="donationType"
            render={({ field }) => (
              <Select
                value={field.value ? t(`donations.types.${field.value}`) : ''}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id="donationType"
                  className="w-full"
                  aria-invalid={!!errors.donationType}
                  aria-describedby={
                    errors.donationType ? 'donationType-error' : undefined
                  }
                >
                  <SelectValue placeholder={t('donations.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {donationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`donations.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.donationType && (
            <p
              id="donationType-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.donationType.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">{t('donations.incomeMethod')}</Label>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <Select
                value={
                  field.value
                    ? t(`donations.paymentMethods.${field.value}`)
                    : ''
                }
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id="paymentMethod"
                  className="w-full"
                  aria-invalid={!!errors.paymentMethod}
                  aria-describedby={
                    errors.paymentMethod ? 'paymentMethod-error' : undefined
                  }
                >
                  <SelectValue placeholder={t('donations.selectPayment')} />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {t(`donations.paymentMethods.${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.paymentMethod && (
            <p
              id="paymentMethod-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.paymentMethod.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('donations.donorOptional')}</Label>
        <Controller
          control={control}
          name="donorId"
          render={({ field }) => (
            <Select
              value={
                field.value
                  ? donors.find((d) => d.id === field.value)?.fullName
                  : ''
              }
              onValueChange={(v) => field.onChange(v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('donations.selectDonor')} />
              </SelectTrigger>
              <SelectContent>
                {donors.map((donor) => (
                  <SelectItem key={donor.id} value={String(donor.id)}>
                    {donor.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('donations.notesOptional')}</Label>
        <Textarea id="notes" {...register('notes')} />
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
