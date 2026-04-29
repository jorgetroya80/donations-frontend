import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateUser } from './use-users'
import { UserForm } from './user-form'
import type { CreateUserFormData } from './user-schema'

export function UserCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateUser()

  async function handleSubmit(data: CreateUserFormData) {
    await createMutation.mutateAsync({
      username: data.username,
      password: data.password,
      roles: data.roles,
      active: data.active,
    })

    navigate('/users')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('users.new')}</h1>

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('users.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <UserForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/users')}
        submitting={createMutation.isPending}
        submitLabel={t('common.save')}
      />
    </div>
  )
}
