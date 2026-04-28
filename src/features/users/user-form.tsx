import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type CreateUserFormData,
  createUserSchema,
  type UpdateUserFormData,
  updateUserSchema,
  userRoles,
} from './user-schema'

interface UserFormCreateProps {
  mode: 'create'
  defaultValues?: Partial<CreateUserFormData>
  onSubmit: (data: CreateUserFormData) => void
  submitting?: boolean
  submitLabel: string
}

interface UserFormEditProps {
  mode: 'edit'
  defaultValues?: Partial<UpdateUserFormData>
  onSubmit: (data: UpdateUserFormData) => void
  submitting?: boolean
  submitLabel: string
}

type UserFormProps = UserFormCreateProps | UserFormEditProps

export function UserForm({
  mode,
  defaultValues,
  onSubmit,
  submitting,
  submitLabel,
}: UserFormProps) {
  const { t } = useTranslation()

  const schema = mode === 'create' ? createUserSchema : updateUserSchema

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
      roles: [] as (typeof userRoles)[number][],
      active: true,
      ...defaultValues,
    },
  })

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit as (data: Record<string, unknown>) => void
      )}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">{t('users.username')}</Label>
          <Input
            id="username"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'username-error' : undefined}
            {...register('username')}
          />
          {errors.username && (
            <p
              id="username-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.username.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            {mode === 'create'
              ? t('users.password')
              : t('users.passwordOptional')}
          </Label>
          <Input
            id="password"
            type="password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.password.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('users.roles')}</Label>
        <Controller
          control={control}
          name="roles"
          render={({ field }) => {
            const value = (field.value ?? []) as string[]
            return (
              <div
                className="flex flex-wrap gap-3"
                aria-describedby={errors.roles ? 'roles-error' : undefined}
              >
                {userRoles.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={value.includes(role)}
                      onChange={() =>
                        field.onChange(
                          value.includes(role)
                            ? value.filter((r) => r !== role)
                            : [...value, role]
                        )
                      }
                      aria-invalid={!!errors.roles}
                      className="size-4 rounded border-input"
                    />
                    {t(`users.roleNames.${role}`)}
                  </label>
                ))}
              </div>
            )
          }}
        />
        {errors.roles && (
          <p id="roles-error" role="alert" className="text-sm text-destructive">
            {errors.roles.message as string}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          {...register('active')}
          className="size-4 rounded border-input"
        />
        <Label htmlFor="active">{t('users.active')}</Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? t('common.loading') : submitLabel}
        </Button>
      </div>
    </form>
  )
}
