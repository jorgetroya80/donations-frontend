import { login as sdkLogin } from '@jorgetroya80/donations-api-client'
import { CircleAlert } from 'lucide-react'
import { type SyntheticEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  // Ref-only counter mirrors the backend's 15-min lockout after 5 fails;
  // resets on reload because the API returns the same generic 401 either way.
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

      if (response?.status === 401) {
        failedAttempts.current += 1
        setError(
          failedAttempts.current >= LOCKOUT_THRESHOLD
            ? t('auth.errorLockoutHint')
            : t('auth.errorInvalidCredentials')
        )
        return
      }
      // Blank/whitespace credentials: the API rejects them with a
      // validation 400 that does not count toward the account lockout.
      if (response?.status === 400) {
        setError(t('auth.errorInvalidCredentials'))
        return
      }
      if (error || !data?.username || !data.roles) {
        setError(t('auth.errorConnection'))
        return
      }

      failedAttempts.current = 0
      const mustChangePassword = data.mustChangePassword ?? false
      login({
        username: data.username,
        roles: data.roles,
        mustChangePassword,
      })
      navigate(mustChangePassword ? '/settings/password' : '/', {
        replace: true,
      })
    } catch {
      setError(t('auth.errorConnection'))
    } finally {
      setLoading(false)
    }
  }

  const errorId = error ? 'login-error' : undefined

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {/* CardTitle renders a div; the page needs a real h1 (1.3.1).
              Same classes, minus text-balance — the base layer already
              applies it to every h1. */}
          <h1 className="font-heading text-center text-2xl leading-snug font-medium">
            {t('auth.login')}
          </h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" id="login-error">
                <CircleAlert aria-hidden="true" />
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
                aria-invalid={!!error}
                aria-describedby={errorId}
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
                aria-invalid={!!error}
                aria-describedby={errorId}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? t('auth.submitting') : t('auth.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
