import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Package, Settings, ShoppingBasket, ShoppingCart, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { useAuth } from '@/context/AuthContext'
import { STAFF_ROLES, getDefaultRouteForRole } from '@/routes/roleLanding'

function initials(firstName?: string, lastName?: string, email?: string) {
  if (firstName || lastName) return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
  return email?.[0]?.toUpperCase() ?? '?'
}

export default function Navbar() {
  const { totalItems, open } = useCart()
  const { currency, toggle } = useCurrency()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isStaff = user && STAFF_ROLES.includes(user.roleName)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <ShoppingBasket className="size-6" />
          <span className="text-lg">Velvet Hive</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggle}>
            {currency === 'KSH' ? 'KSh' : 'USD'}
          </Button>

          {user ? (
            isStaff ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={getDefaultRouteForRole(user.roleName)}>Dashboard</Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border/60 py-1 pl-1 pr-3 text-sm hover:bg-muted">
                    <Avatar className="size-6">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="text-[10px]">{initials(user.firstName, user.lastName, user.email)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user.firstName ?? user.email}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/orders">
                      <Package /> My orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account">
                      <Settings /> Account settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <LogOut /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">
                <User /> Sign in
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="relative" onClick={open}>
            <ShoppingCart />
            {totalItems > 0 && (
              <Badge className="absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-[10px]">{totalItems}</Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
