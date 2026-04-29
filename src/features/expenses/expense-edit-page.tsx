import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExpenseForm } from './expense-form'
import type { CreateExpenseFormData } from './expense-schema'
import { useExpense, useUpdateExpense } from './use-expenses'

export function ExpenseEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const expenseId = Number(id)

  const { data: expense, isLoading, error } = useExpense(expenseId)
  const updateMutation = useUpdateExpense(expenseId)

  const [pendingData, setPendingData] = useState<CreateExpenseFormData | null>(
    null
  )

  function handleFormSubmit(data: CreateExpenseFormData) {
    setPendingData(data)
  }

  async function handleConfirmSave() {
    if (!pendingData) return

    await updateMutation.mutateAsync({
      amount: pendingData.amount,
      expenseDate: pendingData.expenseDate,
      category: pendingData.category,
      description: pendingData.description,
      vendor: pendingData.vendor,
      paymentMethod: pendingData.paymentMethod,
    })

    setPendingData(null)
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

      <Dialog open={!!pendingData} onOpenChange={() => setPendingData(null)}>
        <DialogContent>
          <DialogTitle>{t('expenses.confirmEdit')}</DialogTitle>
          <DialogDescription>
            {t('expenses.confirmEditDescription')}
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingData(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirmSave}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
