import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, ShoppingBasket, CreditCard, Truck, ShieldCheck } from 'lucide-react'
import SilkBackground from '@/components/auth/SilkBackground'

const FEATURES = [
  { icon: Truck, text: 'Same-day delivery across Nairobi' },
  { icon: CreditCard, text: 'Pay by card or M-Pesa, whatever suits you' },
  { icon: ShieldCheck, text: 'Your data and payments, always secure' },
]

export default function AuthLayout() {
  return (
    <div className="theme-storefront grid min-h-screen md:grid-cols-2">
      <div className="flex flex-col bg-background px-6 py-8 sm:px-10 md:px-14">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to store
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <Link to="/" className="mb-10 flex items-center justify-center gap-2 font-semibold text-primary">
            <ShoppingBasket className="size-6" />
            <span className="text-lg">Velvet Hive</span>
          </Link>

          <div className="mx-auto w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </div>

      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground md:flex"
        style={{ background: 'linear-gradient(160deg, var(--brand-primary), var(--brand-primary-dark))' }}
      >
        <SilkBackground />

        <div className="relative flex items-center gap-2 font-semibold">
          <ShoppingBasket className="size-6" />
          <span className="text-lg">Velvet Hive</span>
        </div>

        <div className="relative space-y-6">
          <h2 className="max-w-sm text-3xl font-bold leading-tight">Everything for your home, one basket away.</h2>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-primary-foreground/90">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">© {new Date().getFullYear()} Velvet Hive. All rights reserved.</p>
      </div>
    </div>
  )
}
