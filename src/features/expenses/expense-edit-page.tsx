import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { ExpenseForm } from './expense-form'
import type { CreateExpenseFormData } from './expense-schema'
import { useExpense, useUpdateExpense } from './use-expenses'

export function ExpenseEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { id } = useParams<{ id: string }>()
  const expenseId = Number(id)

  const { data: expense, isLoading, error } = useExpense(expenseId)
  const updateMutation = useUpdateExpense(expenseId)

  async function handleFormSubmit(data: CreateExpenseFormData) {
    await updateMutation.mutateAsync({
      amount: data.amount,
      expenseDate: data.expenseDate,
      category: data.category,
      description: data.description,
      vendor: data.vendor ?? undefined,
      paymentMethod: data.paymentMethod,
    })

    toast.add({ title: t('expenses.successUpdated') })
    navigate('/expenses')
  }

  if (isLoading) {
    return (
      <Alert>
        <AlertDescription>{t('common.loading')}</AlertDescription>
      </Alert>
    )
  }

  if (error || !expense) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t('expenses.errorLoading')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('expenses.edit')}</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('expenses.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <ExpenseForm
        defaultValues={{
          amount: expense.amount,
          expenseDate: expense.expenseDate,
          category: expense.category,
          description: expense.description,
          vendor: expense.vendor,
          paymentMethod: expense.paymentMethod,
        }}
        onSubmit={handleFormSubmit}
        onCancel={() => navigate('/expenses')}
        submitting={updateMutation.isPending}
        submitLabel={t('common.save')}
      />
    </div>
  )
}
