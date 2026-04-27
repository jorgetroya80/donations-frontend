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
import {
  type CreateExpenseFormData,
  createExpenseSchema,
  expenseCategories,
  paymentMethods,
} from './expense-schema'

interface ExpenseFormProps {
  defaultValues?: Partial<CreateExpenseFormData>
  onSubmit: (data: CreateExpenseFormData) => void
  submitting?: boolean
  submitLabel: string
}

export function ExpenseForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel,
}: ExpenseFormProps) {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      amount: undefined,
      expenseDate: '',
      category: undefined,
      description: '',
      vendor: '',
      paymentMethod: undefined,
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">{t('expenses.amount')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expenseDate">{t('expenses.date')}</Label>
          <Input id="expenseDate" type="date" {...register('expenseDate')} />
          {errors.expenseDate && (
            <p className="text-sm text-destructive">
              {errors.expenseDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t('expenses.category')}</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                value={
                  field.value ? t(`expenses.categories.${field.value}`) : ''
                }
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('expenses.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`expenses.categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-sm text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t('expenses.paymentMethod')}</Label>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <Select
                value={
                  field.value ? t(`expenses.paymentMethods.${field.value}`) : ''
                }
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('expenses.selectPayment')} />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {t(`expenses.paymentMethods.${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.paymentMethod && (
            <p className="text-sm text-destructive">
              {errors.paymentMethod.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('expenses.description')}</Label>
        <Textarea id="description" {...register('description')} />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor">{t('expenses.vendorOptional')}</Label>
        <Input id="vendor" {...register('vendor')} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? t('common.loading') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
