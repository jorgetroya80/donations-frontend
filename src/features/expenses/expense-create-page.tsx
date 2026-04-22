import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ExpenseForm } from './expense-form'
import type { CreateExpenseFormData } from './expense-schema'
import { useCreateExpense } from './use-expenses'

export function ExpenseCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateExpense()
  const [success, setSuccess] = useState(false)

  async function handleSubmit(data: CreateExpenseFormData) {
    setSuccess(false)

    await createMutation.mutateAsync({
      amount: data.amount,
      expenseDate: data.expenseDate,
      category: data.category,
      description: data.description,
      vendor: data.vendor ?? undefined,
      paymentMethod: data.paymentMethod,
    })

    setSuccess(true)
    setTimeout(() => navigate('/expenses'), 1500)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('expenses.new')}</h1>

      {success && (
        <Alert>
          <AlertDescription>{t('expenses.successCreated')}</AlertDescription>
        </Alert>
      )}

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('expenses.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <ExpenseForm
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        submitLabel={t('common.save')}
      />

      <Button variant="outline" onClick={() => navigate('/expenses')}>
        {t('common.back')}
      </Button>
    </div>
  )
}
