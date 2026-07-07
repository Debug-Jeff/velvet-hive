import { createContext, useContext, useState, useCallback } from 'react'

type Currency = 'KSH' | 'USD'

const RATE = 130 // 1 USD = 130 KSH

interface CurrencyCtx {
  currency: Currency
  toggle: () => void
  format: (usdPrice: number) => string
}

const Ctx = createContext<CurrencyCtx | null>(null)

function formatPrice(usdPrice: number, currency: Currency): string {
  if (currency === 'KSH') {
    const ksh = Math.round(usdPrice * RATE)
    return `KSh ${ksh.toLocaleString()}`
  }
  return `$${usdPrice.toFixed(2)}`
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency')
    return saved === 'USD' ? 'USD' : 'KSH'
  })

  const toggle = useCallback(() => {
    setCurrency(c => {
      const next = c === 'KSH' ? 'USD' : 'KSH'
      localStorage.setItem('currency', next)
      return next
    })
  }, [])

  const format = useCallback(
    (usdPrice: number) => formatPrice(usdPrice, currency),
    [currency]
  )

  return <Ctx.Provider value={{ currency, toggle, format }}>{children}</Ctx.Provider>
}

export function useCurrency(): CurrencyCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}
