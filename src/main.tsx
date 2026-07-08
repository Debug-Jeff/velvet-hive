import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router'
import { AuthProvider } from './context/AuthContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { CartProvider } from './context/CartContext'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from './components/ui/sonner'
import { initSentry, SentryErrorBoundary } from './lib/sentry'
import './styles/global.css'

initSentry()

function ErrorFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-medium">Something went wrong.</p>
      <p className="text-sm text-muted-foreground">The error has been reported. Try reloading the page.</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Reload
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryErrorBoundary fallback={<ErrorFallback />}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
              <Toaster />
            </TooltipProvider>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </SentryErrorBoundary>
  </React.StrictMode>
)
