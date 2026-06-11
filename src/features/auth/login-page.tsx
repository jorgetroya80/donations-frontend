import { login as sdkLogin } from '@jorgetroya80/donations-api-client'
import { type SyntheticEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/api'
import { useAuth } from './auth-context'

const LOCKOUT_THRESHOLD = 5

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const failedAttempts = useRef(0)

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    try {
      const { error, response, data } = await sdkLogin({
        body: { username, password },
        client,
      })
      if (error || !data) {
        if (response?.status === 401) {
          failedAttempts.current += 1
          setError(
            failedAttempts.current >= LOCKOUT_THRESHOLD
              ? t('auth.errorLockoutHint')
              : t('auth.errorInvalidCredentials')
          )
        } else {
          setError(t('auth.errorConnection'))
        }
      } else {
        failedAttempts.current = 0
        const mustChangePassword = data.mustChangePassword ?? false
        login({
          username: data.username ?? '',
          roles: data.roles ?? [],
          mustChangePassword,
        })
        navigate(mustChangePassword ? '/settings/password' : '/', {
          replace: true,
        })
      }
    } catch {
      setError(t('auth.errorConnection'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {t('auth.login')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">{t('auth.username')}</Label>
              <Input
                id="username"
                name="username"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.submitting') : t('auth.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
