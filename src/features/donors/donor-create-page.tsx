import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DonorForm } from './donor-form'
import type { CreateDonorFormData } from './donor-schema'
import { useCreateDonor } from './use-donors'

export function DonorCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateDonor()
  const [success, setSuccess] = useState(false)

  async function handleSubmit(data: CreateDonorFormData) {
    setSuccess(false)

    await createMutation.mutateAsync({
      fullName: data.fullName,
      dniNie: data.dniNie,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
    })

    setSuccess(true)
    setTimeout(() => navigate('/donors'), 1500)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('donors.new')}</h1>

      {success && (
        <Alert>
          <AlertDescription>{t('donors.successCreated')}</AlertDescription>
        </Alert>
      )}

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('donors.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <DonorForm
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        submitLabel={t('common.save')}
      />

      <Button variant="outline" onClick={() => navigate('/donors')}>
        {t('common.back')}
      </Button>
    </div>
  )
}
