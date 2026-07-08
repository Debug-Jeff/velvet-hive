import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import PasswordInput from '@/components/auth/PasswordInput'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import TurnstileWidget from '@/components/TurnstileWidget'
import { useAuth } from '@/context/AuthContext'
import { getDefaultRouteForRole } from '@/routes/roleLanding'
import { ApiError } from '@/api/client'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formError, setFormError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })


  useEffect(() => {
    if (!user) return
    const redirect = searchParams.get('redirect')
    navigate(redirect || getDefaultRouteForRole(user.roleName), { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function onSubmit(values: LoginFormValues) {
    setFormError('')
    try {
      await login(values.email, values.password, turnstileToken)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError("That email and password don't match our records.")
      } else if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError("We couldn't reach the server. Please try again.")
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to Velvet Hive.</p>

      <div className="mt-6">
        <GoogleSignInButton label="Sign in with Google" />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" autoComplete="email" autoFocus className="h-11 pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link to="/forgot-password" className="text-xs font-medium text-muted-foreground hover:text-primary">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken('')} />

          <Button
            type="submit"
            className="h-11 w-full text-base"
            disabled={form.formState.isSubmitting || !turnstileToken}
          >
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
