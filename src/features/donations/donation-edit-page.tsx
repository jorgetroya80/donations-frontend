import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { getProblemMessage } from '@/lib/get-problem-message'
import { DonationForm } from './donation-form'
import type { CreateDonationFormData } from './donation-schema'
import { useDonation, useUpdateDonation } from './use-donations'

export function DonationEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { id } = useParams<{ id: string }>()
  const donationId = Number(id)

  const { data: donation, isLoading, error } = useDonation(donationId)
  const updateMutation = useUpdateDonation(donationId)

  async function handleFormSubmit(data: CreateDonationFormData) {
    await updateMutation.mutateAsync({
      amount: data.amount,
      donationDate: data.donationDate,
      donationType: data.donationType,
      paymentMethod: data.paymentMethod,
      donorId: data.donorId ?? undefined,
      notes: data.notes ?? undefined,
    })

    toast.add({ title: t('donations.successUpdated') })
    navigate('/donations')
  }

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label={t('common.loading')}
        className="mx-auto max-w-2xl space-y-4"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !donation) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getProblemMessage(error, t('donations.errorLoading'))}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={t('donations.edit')} />

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getProblemMessage(
              updateMutation.error,
              t('donations.errorSaving')
            )}
          </AlertDescription>
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
        onSubmit={handleFormSubmit}
        onCancel={() => navigate('/donations')}
        submitting={updateMutation.isPending}
        submitLabel={t('common.save')}
      />
    </div>
  )
}
