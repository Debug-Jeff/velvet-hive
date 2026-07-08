import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export const sentryEnabled = Boolean(dsn)

export function initSentry() {
  if (!sentryEnabled) return
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    integrations: [
      // Default browserApiErrorsIntegration patches EventTarget.prototype.
      // addEventListener/removeEventListener globally for breadcrumbs - a
      // documented source of breakage for Radix UI's pointer-event-based
      // popover dismiss/positioning logic (dropdowns silently stop opening).
      // Keep the rest of the integration (XHR/setTimeout/RAF breadcrumbs),
      // just turn off the piece that touches addEventListener.
      Sentry.browserApiErrorsIntegration({ eventTarget: false }),
    ],
  })
}

export const SentryErrorBoundary = Sentry.ErrorBoundary
