import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExpenseForm } from './expense-form'
import type { CreateExpenseFormData } from './expense-schema'
import { useCreateExpense } from './use-expenses'

export function ExpenseCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateExpense()

  async function handleSubmit(data: CreateExpenseFormData) {
    await createMutation.mutateAsync({
      amount: data.amount,
      expenseDate: data.expenseDate,
      category: data.category,
      description: data.description,
      vendor: data.vendor ?? undefined,
      paymentMethod: data.paymentMethod,
    })

    navigate('/expenses')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('expenses.new')}</h1>

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('expenses.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <ExpenseForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/expenses')}
        submitting={createMutation.isPending}
        submitLabel={t('common.save')}
      />
    </div>
  )
}
