import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { useUpdateUser, useUser } from './use-users'

type UserRole = 'ADMIN' | 'TREASURER' | 'PASTOR' | 'OPERATOR'

import { UserForm } from './user-form'
import type { UpdateUserFormData } from './user-schema'

export function UserEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)

  const { data: user, isLoading, error } = useUser(userId)
  const updateMutation = useUpdateUser(userId)

  async function handleFormSubmit(data: UpdateUserFormData) {
    await updateMutation.mutateAsync({
      username: data.username,
      password: data.password || undefined,
      roles: data.roles as UserRole[],
      active: data.active,
    })

    toast.add({ title: t('users.successUpdated') })
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
    </div>
  )
}
