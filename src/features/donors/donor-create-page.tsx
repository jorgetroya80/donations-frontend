import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DonorForm } from './donor-form'
import type { CreateDonorFormData } from './donor-schema'
import { useCreateDonor } from './use-donors'

export function DonorCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateDonor()

  async function handleSubmit(data: CreateDonorFormData) {
    await createMutation.mutateAsync({
      fullName: data.fullName,
      dniNie: data.dniNie,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
    })

    navigate('/donors')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('donors.new')}</h1>

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('donors.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <DonorForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/donors')}
        submitting={createMutation.isPending}
        submitLabel={t('common.save')}
      />
    </div>
  )
}
