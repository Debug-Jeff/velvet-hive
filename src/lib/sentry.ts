import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export const sentryEnabled = Boolean(dsn)

export function initSentry() {
  if (!sentryEnabled) return
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  })
}

export const SentryErrorBoundary = Sentry.ErrorBoundary
