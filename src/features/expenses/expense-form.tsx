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
          <Label htmlFor="expenseDate">{t('expenses.date')}</Label>
          <Input
            id="expenseDate"
            type="date"
            aria-invalid={!!errors.expenseDate}
            aria-describedby={
              errors.expenseDate ? 'expenseDate-error' : undefined
            }
            {...register('expenseDate')}
          />
          {errors.expenseDate && (
            <p
              id="expenseDate-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.expenseDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t('expenses.category')}</Label>
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
                <SelectTrigger
                  id="category"
                  className="w-full"
                  aria-invalid={!!errors.category}
                  aria-describedby={
                    errors.category ? 'category-error' : undefined
                  }
                >
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
            <p
              id="category-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.category.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">{t('expenses.paymentMethod')}</Label>
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
                <SelectTrigger
                  id="paymentMethod"
                  className="w-full"
                  aria-invalid={!!errors.paymentMethod}
                  aria-describedby={
                    errors.paymentMethod ? 'paymentMethod-error' : undefined
                  }
                >
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
        <Label htmlFor="description">{t('expenses.description')}</Label>
        <Textarea
          id="description"
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? 'description-error' : undefined
          }
          {...register('description')}
        />
        {errors.description && (
          <p
            id="description-error"
            role="alert"
            className="text-sm text-destructive"
          >
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
