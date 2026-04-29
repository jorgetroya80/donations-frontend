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
import { DonorForm } from './donor-form'
import type { CreateDonorFormData } from './donor-schema'
import { useDonor, useUpdateDonor } from './use-donors'

export function DonorEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const donorId = Number(id)

  const { data: donor, isLoading, error } = useDonor(donorId)
  const updateMutation = useUpdateDonor(donorId)

  const [pendingData, setPendingData] = useState<CreateDonorFormData | null>(
    null
  )

  function handleFormSubmit(data: CreateDonorFormData) {
    setPendingData(data)
  }

  async function handleConfirmSave() {
    if (!pendingData) return

    await updateMutation.mutateAsync({
      fullName: pendingData.fullName,
      dniNie: pendingData.dniNie,
      email: pendingData.email || undefined,
      phone: pendingData.phone || undefined,
      address: pendingData.address || undefined,
    })

    setPendingData(null)
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
        <AlertDescription>{t('donors.errorLoading')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('donors.edit')}</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('donors.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <DonorForm
        defaultValues={{
          fullName: donor.fullName,
          dniNie: donor.dniNie,
          email: donor.email,
          phone: donor.phone,
          address: donor.address,
        }}
        onSubmit={handleFormSubmit}
        onCancel={() => navigate('/donors')}
        submitting={updateMutation.isPending}
        submitLabel={t('common.save')}
      />

      <Dialog open={!!pendingData} onOpenChange={() => setPendingData(null)}>
        <DialogContent>
          <DialogTitle>{t('donors.confirmEdit')}</DialogTitle>
          <DialogDescription>
            {t('donors.confirmEditDescription')}
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
