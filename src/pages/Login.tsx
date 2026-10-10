import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { GraduationCap, LogIn, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/services/api'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function Login() {
  const { t, lang, setLang } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      toast.success(t('auth.signin'))
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError && err.status !== 401 ? err.message : t('auth.error'))
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--sidebar-background))] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--sidebar-primary))] shadow-xl">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">{t('app.name')}</h1>
          <p className="mt-1 text-sm text-white/60">{t('app.tagline')}</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-extrabold">{t('auth.title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('auth.subtitle')}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold">{t('common.email')}</label>
                <Input
                  type="email" dir="ltr" className="min-h-[44px] text-start"
                  placeholder="admin@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold">{t('auth.password')}</label>
                <Input
                  type="password" dir="ltr" className="min-h-[44px] text-start"
                  placeholder="********" value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm font-bold text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="min-h-[44px] w-full text-base font-bold" disabled={loading}>
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <>
                    <LogIn className="me-2 h-4 w-4" />
                    {t('auth.signin')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="min-h-[44px] px-4 text-sm font-bold text-white/70 hover:text-white">
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </div>
    </div>
  )
}