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
import { DonationForm } from './donation-form'
import type { CreateDonationFormData } from './donation-schema'
import { useDonation, useDonors, useUpdateDonation } from './use-donations'

export function DonationEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const donationId = Number(id)

  const { data: donation, isLoading, error } = useDonation(donationId)
  const { data: donorsPage } = useDonors()
  const donors = donorsPage?.content ?? []
  const updateMutation = useUpdateDonation(donationId)

  const [pendingData, setPendingData] = useState<CreateDonationFormData | null>(
    null
  )

  function handleFormSubmit(data: CreateDonationFormData) {
    setPendingData(data)
  }

  async function handleConfirmSave() {
    if (!pendingData) return

    await updateMutation.mutateAsync({
      amount: pendingData.amount,
      donationDate: pendingData.donationDate,
      donationType: pendingData.donationType,
      paymentMethod: pendingData.paymentMethod,
      donorId: pendingData.donorId,
      notes: pendingData.notes,
    })

    setPendingData(null)
    navigate('/donations')
  }

  if (isLoading) {
    return (
      <Alert>
        <AlertDescription>{t('common.loading')}</AlertDescription>
      </Alert>
    )
  }

  if (error || !donation) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t('donations.errorLoading')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('donations.edit')}</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('donations.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <DonationForm
        defaultValues={{
          amount: donation.amount,
          donationDate: donation.donationDate,
          donationType: donation.donationType,
          paymentMethod: donation.paymentMethod,
          donorId: donation.donorId,
          notes: donation.notes,
        }}
        donors={donors}
        onSubmit={handleFormSubmit}
        onCancel={() => navigate('/donations')}
        submitting={updateMutation.isPending}
        submitLabel={t('common.save')}
      />

      <Dialog open={!!pendingData} onOpenChange={() => setPendingData(null)}>
        <DialogContent>
          <DialogTitle>{t('donations.confirmEdit')}</DialogTitle>
          <DialogDescription>
            {t('donations.confirmEditDescription')}
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
