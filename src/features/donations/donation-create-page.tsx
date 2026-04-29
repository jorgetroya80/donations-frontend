import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DonationForm } from './donation-form'
import type { CreateDonationFormData } from './donation-schema'
import { useCreateDonation, useDonors } from './use-donations'

export function DonationCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateDonation()
  const { data: donorsPage } = useDonors()
  const donors = donorsPage?.content ?? []

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

    navigate('/donations')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('donations.new')}</h1>

      {createMutation.error && !duplicateWarning && (
        <Alert variant="destructive">
          <AlertDescription>{t('donations.errorSaving')}</AlertDescription>
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
        donors={donors}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/donations')}
        submitting={createMutation.isPending}
        submitLabel={t('common.save')}
      />
    </div>
  )
}
