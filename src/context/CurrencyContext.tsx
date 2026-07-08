import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { formatKes, formatUsd } from '../lib/currency'

type Currency = 'KSH' | 'USD'

interface CurrencyCtx {
  currency: Currency
  toggle: () => void
  format: (priceKes: number) => string
}

const Ctx = createContext<CurrencyCtx | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency')
    return saved === 'USD' ? 'USD' : 'KSH'
  })

  const toggle = useCallback(() => {
    setCurrency((c) => {
      const next = c === 'KSH' ? 'USD' : 'KSH'
      localStorage.setItem('currency', next)
      return next
    })
  }, [])

  const format = useCallback((priceKes: number) => (currency === 'KSH' ? formatKes(priceKes) : formatUsd(priceKes)), [currency])

  return <Ctx.Provider value={{ currency, toggle, format }}>{children}</Ctx.Provider>
}

export function useCurrency(): CurrencyCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}
