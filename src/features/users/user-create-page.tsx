import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCreateUser } from './use-users'
import { UserForm } from './user-form'
import type { CreateUserFormData } from './user-schema'

export function UserCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateUser()
  const [success, setSuccess] = useState(false)

  async function handleSubmit(data: CreateUserFormData) {
    setSuccess(false)

    await createMutation.mutateAsync({
      username: data.username,
      password: data.password,
      roles: data.roles,
      active: data.active,
    })

    setSuccess(true)
    setTimeout(() => navigate('/users'), 1500)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('users.new')}</h1>

      {success && (
        <Alert>
          <AlertDescription>{t('users.successCreated')}</AlertDescription>
        </Alert>
      )}

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{t('users.errorSaving')}</AlertDescription>
        </Alert>
      )}

      <UserForm
        mode="create"
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        submitLabel={t('common.save')}
      />

      <Button variant="outline" onClick={() => navigate('/users')}>
        {t('common.back')}
      </Button>
    </div>
  )
}
