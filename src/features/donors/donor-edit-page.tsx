import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { getProblemMessage } from '@/lib/get-problem-message'
import { DonorForm } from './donor-form'
import type { CreateDonorFormData } from './donor-schema'
import { useDonor, useUpdateDonor } from './use-donors'

export function DonorEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { id } = useParams<{ id: string }>()
  const donorId = Number(id)

  const { data: donor, isLoading, error } = useDonor(donorId)
  const updateMutation = useUpdateDonor(donorId)

  async function handleFormSubmit(data: CreateDonorFormData) {
    await updateMutation.mutateAsync({
      fullName: data.fullName,
      nationalId: data.nationalId,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
    })

    toast.add({ title: t('donors.successUpdated') })
    navigate('/donors')
  }

  if (isLoading) {
    return (
      <Alert>
        <AlertDescription>{t('common.loading')}</AlertDescription>
      </Alert>
    )
  }

  if (error || !donor) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getProblemMessage(error, t('donors.errorLoading'))}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('donors.edit')}</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getProblemMessage(updateMutation.error, t('donors.errorSaving'))}
          </AlertDescription>
        </Alert>
      )}

      <DonorForm
        defaultValues={{
          fullName: donor.fullName,
          nationalId: donor.nationalId,
          email: donor.email,
          phone: donor.phone,
          address: donor.address,
        }}
        onSubmit={handleFormSubmit}
        onCancel={() => navigate('/donors')}
        submitting={updateMutation.isPending}
      />
    </div>
  )
}
