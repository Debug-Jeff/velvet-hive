import * as Sentry from '@sentry/node'
import { env } from '../config/env'

export const sentryEnabled = env.SENTRY_DSN.length > 0

export function initSentry() {
  if (!sentryEnabled) return
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  })
}

export function captureException(err: unknown) {
  if (!sentryEnabled) return
  Sentry.captureException(err)
}
