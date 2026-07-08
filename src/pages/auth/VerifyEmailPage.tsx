import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Mail, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import OtpInput from '@/components/auth/OtpInput'
import { useAuth } from '@/context/AuthContext'
import { getDefaultRouteForRole } from '@/routes/roleLanding'
import { ApiError } from '@/api/client'
import * as authApi from '@/api/auth.api'

const RESEND_COOLDOWN_SECONDS = 60

const verifySchema = z.object({
  email: z.string().email('Enter a valid email address'),
  code: z.string().length(6, 'Enter all 6 digits'),
})

type VerifyValues = z.infer<typeof verifySchema>

export default function VerifyEmailPage() {
  const { user, verifyEmail } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailFromQuery = searchParams.get('email') ?? ''
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(emailFromQuery ? RESEND_COOLDOWN_SECONDS : 0)
  const [formError, setFormError] = useState('')

  const form = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: emailFromQuery, code: '' },
  })

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown > 0])

  // See LoginPage for why this waits on the committed context user instead of
  // navigating right after verifyEmail() resolves.
  useEffect(() => {
    if (!user) return
    navigate(getDefaultRouteForRole(user.roleName), { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function onSubmit(values: VerifyValues) {
    setFormError('')
    try {
      await verifyEmail(values.email, values.code)
      toast.success('Email verified')
    } catch (err) {
      setFormError(err instanceof ApiError ? "That code isn't right, or it's expired. Try resending." : "We couldn't reach the server.")
    }
  }

  async function handleResend() {
    const email = form.getValues('email')
    if (!email) {
      form.setError('email', { message: 'Enter your email first' })
      return
    }
    setIsResending(true)
    try {
      await authApi.resendVerification(email)
      toast.success('A new code is on its way')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div>
      <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <MailCheck className="size-5" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We sent a 6-digit code to {emailFromQuery ? <span className="font-medium text-foreground">{emailFromQuery}</span> : 'your email'}.
        Enter it below to verify your account.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
          {!emailFromQuery && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" autoComplete="email" className="h-11 pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Verification code</FormLabel>
                <FormControl>
                  <OtpInput value={field.value} onChange={field.onChange} autoFocus />
                </FormControl>
                <FormMessage className="text-center" />
              </FormItem>
            )}
          />

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="h-11 w-full text-base" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            {form.formState.isSubmitting ? 'Verifying…' : 'Verify email'}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {cooldown > 0 ? (
          <span>Resend code in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {isResending ? 'Sending…' : "Didn't get a code? Resend"}
          </button>
        )}
      </div>
    </div>
  )
}
