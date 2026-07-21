import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const email = 'admin@nonnytech.com'
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return

    setIsSubmitting(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error('Invalid password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-tertiary-container/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-2xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-5">
            <Icon name="laptop" size={30} className="text-on-primary" />
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
            NonnyTech
          </h1>
          <p className="text-on-surface-variant mt-1.5 text-sm font-medium">
            Admin Console
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-8">
          <div className="mb-6">
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Sign in
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Enter the admin password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Hidden username field for password manager autofill */}
            <input
              type="text"
              value={email}
              readOnly
              className="hidden"
              autoComplete="username"
              tabIndex={-1}
            />

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-on-surface"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                  autoComplete="current-password"
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-lg pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center justify-center gap-2 mt-1"
            >
              {isSubmitting ? (
                <>
                  <Icon name="progress_activity" size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Icon name="login" size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-on-surface-variant/60 mt-6">
          &copy; {new Date().getFullYear()} NonnyTech. All rights reserved.
        </p>
      </div>
    </div>
  )
}
