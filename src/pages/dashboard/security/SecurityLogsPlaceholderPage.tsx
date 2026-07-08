import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Boxes, LogIn, ShieldAlert, ShoppingBag, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatCard from '@/components/dashboard/StatCard'
import DataTableToolbar from '@/components/dashboard/DataTable/DataTableToolbar'
import * as inventoryApi from '@/api/inventory.api'
import * as ordersApi from '@/api/orders.api'
import * as usersApi from '@/api/users.api'
import * as securityApi from '@/api/security.api'
import { ApiError } from '@/api/client'
import type { InventoryMovement } from '@/types/inventory'
import type { Order } from '@/types/order'
import type { StaffUser } from '@/types/user'
import type { SecurityEvent } from '@/types/securityEvent'

type EventKind = 'inventory' | 'purchase' | 'cancellation' | 'security'

interface ActivityEvent {
  id: string
  kind: EventKind
  timestamp: string
  description: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
}

const TYPE_FILTER_OPTIONS = [
  { label: 'All events', value: 'ALL' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Purchases', value: 'purchase' },
  { label: 'Cancellations', value: 'cancellation' },
  { label: 'Security', value: 'security' },
]

const PURCHASE_STATUSES = new Set(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'])

function movementDescription(m: InventoryMovement) {
  const who = m.performedBy ? `${m.performedBy.firstName} ${m.performedBy.lastName}` : 'Someone'
  const verb = m.type === 'IN' ? 'added' : m.type === 'OUT' ? 'removed' : 'adjusted'
  const qty = m.type === 'ADJUSTMENT' ? `stock to ${m.quantity}` : `${m.quantity} units`
  return `${who} ${verb} ${qty} of ${m.product.name} - ${m.reason}`
}

function purchaseDescription(o: Order) {
  const items = o.items.map((i) => i.product.name).join(', ')
  return `${o.shippingName} has bought ${items || 'items'} (order #${o.id.slice(-8)})`
}

function securityDescription(e: SecurityEvent) {
  const who = e.user ? `${e.user.firstName} ${e.user.lastName}` : e.email ?? 'Someone'
  const ipSuffix = e.ip ? ` from ${e.ip}` : ''
  switch (e.type) {
    case 'LOGIN':
      return `${who} signed in${ipSuffix}${e.detail ? ` (${e.detail})` : ''}`
    case 'LOGOUT':
      return `${who} signed out${ipSuffix}`
    case 'LOGIN_FAILED':
      return `Failed sign-in attempt for ${who}${ipSuffix} - ${e.detail ?? 'invalid credentials'}`
    case 'SUSPICIOUS_LOGIN':
      return `Suspicious sign-in for ${who}${ipSuffix} - ${e.detail ?? 'new location'}`
  }
}

function securityVariant(type: SecurityEvent['type']): ActivityEvent['variant'] {
  if (type === 'LOGIN_FAILED' || type === 'SUSPICIOUS_LOGIN') return 'destructive'
  return 'outline'
}

export default function SecurityLogsPlaceholderPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [inactiveUsers, setInactiveUsers] = useState<StaffUser[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    setIsLoading(true)
    Promise.allSettled([
      inventoryApi.listInventoryMovements(),
      ordersApi.listOrders(),
      usersApi.listUsers(),
      securityApi.listSecurityEvents(),
    ])
      .then(([movementsRes, ordersRes, usersRes, securityRes]) => {
        if (movementsRes.status === 'fulfilled') setMovements(movementsRes.value)
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value)
        if (usersRes.status === 'fulfilled') setInactiveUsers(usersRes.value.filter((u) => !u.isActive))
        if (securityRes.status === 'fulfilled') setSecurityEvents(securityRes.value)
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load activity'))
      .finally(() => setIsLoading(false))
  }, [])

  const cancelledOrders = useMemo(() => orders.filter((o) => o.status === 'CANCELLED'), [orders])
  const purchaseOrders = useMemo(() => orders.filter((o) => PURCHASE_STATUSES.has(o.status)), [orders])
  const suspiciousCount = useMemo(
    () => securityEvents.filter((e) => e.type === 'SUSPICIOUS_LOGIN' || e.type === 'LOGIN_FAILED').length,
    [securityEvents],
  )

  const events = useMemo<ActivityEvent[]>(() => {
    const fromMovements: ActivityEvent[] = movements.map((m) => ({
      id: `mv-${m.id}`,
      kind: 'inventory',
      timestamp: m.createdAt,
      description: movementDescription(m),
      variant: 'outline',
    }))
    const fromPurchases: ActivityEvent[] = purchaseOrders.map((o) => ({
      id: `pur-${o.id}`,
      kind: 'purchase',
      timestamp: o.createdAt,
      description: purchaseDescription(o),
      variant: 'default',
    }))
    const fromCancellations: ActivityEvent[] = cancelledOrders.map((o) => ({
      id: `ord-${o.id}`,
      kind: 'cancellation',
      timestamp: o.cancelledAt ?? o.updatedAt,
      description: `Order ${o.id.slice(-8)} (${o.shippingName}) cancelled - ${o.cancellationReason ?? 'no reason given'}`,
      variant: 'destructive',
    }))
    const fromSecurity: ActivityEvent[] = securityEvents.map((e) => ({
      id: `sec-${e.id}`,
      kind: 'security',
      timestamp: e.createdAt,
      description: securityDescription(e),
      variant: securityVariant(e.type),
    }))

    return [...fromMovements, ...fromPurchases, ...fromCancellations, ...fromSecurity].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }, [movements, purchaseOrders, cancelledOrders, securityEvents])

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesType = typeFilter === 'ALL' || e.kind === typeFilter
      const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [events, typeFilter, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Security & Logs</h1>
        <p className="text-sm text-muted-foreground">Sign-ins, purchases, cancellations, and inventory activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Purchases" value={purchaseOrders.length} icon={ShoppingBag} isLoading={isLoading} accent="green" />
        <StatCard label="Inventory movements" value={movements.length} icon={Boxes} isLoading={isLoading} accent="blue" />
        <StatCard label="Suspicious / failed logins" value={suspiciousCount} icon={ShieldAlert} isLoading={isLoading} accent="amber" />
        <StatCard label="Inactive accounts" value={inactiveUsers.length} icon={UserX} isLoading={isLoading} accent="amber" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LogIn className="size-4" /> Activity feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search activity…"
            filterValue={typeFilter}
            onFilterChange={setTypeFilter}
            filterOptions={TYPE_FILTER_OPTIONS}
            filterPlaceholder="Type"
          />

          <div className="max-h-[32rem] space-y-3 overflow-y-auto">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No activity found.</p>
            ) : (
              filtered.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 border-b pb-3 text-sm last:border-0 last:pb-0">
                  <p className="flex-1">{e.description}</p>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={e.variant} className="capitalize">
                      {e.kind}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {inactiveUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inactive accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inactiveUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant="outline">{u.role.name}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
