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
import type { UserRole } from '@/lib/api-types'
import { useUpdateUser, useUser } from './use-users'
import { UserForm } from './user-form'
import type { UpdateUserFormData } from './user-schema'

export function UserEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)

  const { data: user, isLoading, error } = useUser(userId)
  const updateMutation = useUpdateUser(userId)

  const [pendingData, setPendingData] = useState<UpdateUserFormData | null>(
    null
  )

  function handleFormSubmit(data: UpdateUserFormData) {
    setPendingData(data)
  }

  async function handleConfirmSave() {
    if (!pendingData) return

    await updateMutation.mutateAsync({
      username: pendingData.username,
      password: pendingData.password || undefined,
      roles: pendingData.roles as UserRole[],
      active: pendingData.active,
    })

    setPendingData(null)
    navigate('/users')
  }

  if (isLoading) {
    return (
      <Alert>
        <AlertDescription>{t('common.loading')}</AlertDescription>
      </Alert>
    )
  }

  if (error || !user) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t('users.errorLoading')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('users.edit')}</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('users.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <UserForm
        mode="edit"
        defaultValues={{
          username: user.username,
          password: '',
          roles: user.roles as UpdateUserFormData['roles'],
          active: user.active,
        }}
        onSubmit={handleFormSubmit}
        onCancel={() => navigate('/users')}
        submitting={updateMutation.isPending}
        submitLabel={t('common.save')}
      />

      <Dialog open={!!pendingData} onOpenChange={() => setPendingData(null)}>
        <DialogContent>
          <DialogTitle>{t('users.confirmEdit')}</DialogTitle>
          <DialogDescription>
            {t('users.confirmEditDescription')}
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
