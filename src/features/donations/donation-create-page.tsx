import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { getProblemMessage } from '@/lib/get-problem-message'
import { DonationForm } from './donation-form'
import type { CreateDonationFormData } from './donation-schema'
import { useCreateDonation } from './use-donations'

export function DonationCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const createMutation = useCreateDonation()

  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [pendingData, setPendingData] = useState<CreateDonationFormData | null>(
    null
  )

  async function handleSubmit(data: CreateDonationFormData) {
    setDuplicateWarning(false)

    const result = await createMutation.mutateAsync({
      amount: data.amount,
      donationDate: data.donationDate,
      donationType: data.donationType,
      paymentMethod: data.paymentMethod,
      donorId: data.donorId ?? undefined,
      notes: data.notes ?? undefined,
    })

    if (result.duplicateWarning && !result.saved) {
      setDuplicateWarning(true)
      setPendingData(data)
      return
    }

    toast.add({ title: t('donations.successCreated') })
    navigate('/donations')
  }

  async function handleConfirmDuplicate() {
    if (!pendingData) return
    setDuplicateWarning(false)

    await createMutation.mutateAsync({
      amount: pendingData.amount,
      donationDate: pendingData.donationDate,
      donationType: pendingData.donationType,
      paymentMethod: pendingData.paymentMethod,
      donorId: pendingData.donorId ?? undefined,
      notes: pendingData.notes ?? undefined,
      confirmDuplicate: true,
    })

    toast.add({ title: t('donations.successCreated') })
    navigate('/donations')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={t('donations.new')} />

      {createMutation.error && !duplicateWarning && (
        <Alert variant="destructive">
          <AlertDescription>
            {getProblemMessage(
              createMutation.error,
              t('donations.errorSaving')
            )}
          </AlertDescription>
        </Alert>
      )}

      {duplicateWarning && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-2">
            {t('donations.duplicateWarning')}
            <Button size="sm" onClick={handleConfirmDuplicate}>
              {t('donations.confirmSave')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DonationForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/donations')}
        submitting={createMutation.isPending}
        submitLabel={t('common.save')}
      />
    </div>
  )
}
