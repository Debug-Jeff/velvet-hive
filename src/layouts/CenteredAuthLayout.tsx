import { Link, Outlet } from 'react-router-dom'
import { ShoppingBasket } from 'lucide-react'

export default function CenteredAuthLayout() {
  return (
    <div
      className="theme-storefront flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in oklch, var(--brand-primary-light), transparent 30%), transparent), var(--background)',
      }}
    >
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <ShoppingBasket className="size-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">Velvet Hive</span>
        </Link>
        <Outlet />
      </div>
    </div>
  )
}
