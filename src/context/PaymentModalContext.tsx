import { createContext, useContext, useState, type ReactNode } from 'react'

export type PaymentModalStep = 'choose' | 'confirming'

interface PaymentModalState {
  orderId: string | null
  step: PaymentModalStep
  reference: string | null
}

interface PaymentModalContextValue extends PaymentModalState {
  isOpen: boolean
  openForOrder: (orderId: string, step: PaymentModalStep, reference?: string) => void
  close: () => void
}

const PaymentModalContext = createContext<PaymentModalContextValue | null>(null)

export function PaymentModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PaymentModalState>({ orderId: null, step: 'choose', reference: null })

  function openForOrder(orderId: string, step: PaymentModalStep, reference?: string) {
    setState({ orderId, step, reference: reference ?? null })
  }

  function close() {
    setState({ orderId: null, step: 'choose', reference: null })
  }

  return (
    <PaymentModalContext.Provider value={{ ...state, isOpen: !!state.orderId, openForOrder, close }}>
      {children}
    </PaymentModalContext.Provider>
  )
}

export function usePaymentModal() {
  const ctx = useContext(PaymentModalContext)
  if (!ctx) throw new Error('usePaymentModal must be used within PaymentModalProvider')
  return ctx
}
