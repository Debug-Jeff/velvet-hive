import { Outlet } from 'react-router-dom'
import Navbar from '@/components/storefront/Navbar'
import CartSheet from '@/components/storefront/CartSheet'
import PaymentModal from '@/components/storefront/PaymentModal'

export default function StorefrontLayout() {
  return (
    <div className="theme-storefront min-h-screen bg-background text-foreground">
      <Navbar />
      <Outlet />
      <CartSheet />
      <PaymentModal />
    </div>
  )
}
