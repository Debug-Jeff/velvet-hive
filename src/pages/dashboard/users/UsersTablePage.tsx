import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import DataTable, { type DataTableColumn } from '@/components/dashboard/DataTable/DataTable'
import DataTableToolbar from '@/components/dashboard/DataTable/DataTableToolbar'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import UserFormSheet from './UserFormSheet'
import * as usersApi from '@/api/users.api'
import { ApiError } from '@/api/client'
import type { RoleName, StaffUser } from '@/types/user'

const ROLE_FILTER_OPTIONS = [
  { label: 'All roles', value: 'ALL' },
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Accounts', value: 'ACCOUNTS' },
  { label: 'Inventory Clerk', value: 'INVENTORY_CLERK' },
  { label: 'Customer', value: 'CUSTOMER' },
]

export default function UsersTablePage() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create')
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<StaffUser | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function load() {
    setIsLoading(true)
    try {
      setUsers(await usersApi.listUsers())
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === 'ALL' || u.role.name === (roleFilter as RoleName)
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  function openCreate() {
    setSheetMode('create')
    setEditingUser(null)
    setSheetOpen(true)
  }

  function openEdit(user: StaffUser) {
    setSheetMode('edit')
    setEditingUser(user)
    setSheetOpen(true)
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setIsDeactivating(true)
    try {
      await usersApi.updateUser(deactivateTarget.id, { isActive: false })
      toast.success(`${deactivateTarget.email} deactivated`)
      setDeactivateTarget(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate user')
    } finally {
      setIsDeactivating(false)
    }
  }

  async function handleReactivate(user: StaffUser) {
    try {
      await usersApi.updateUser(user.id, { isActive: true })
      toast.success(`${user.email} reactivated`)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reactivate user')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await usersApi.deleteUser(deleteTarget.id)
      toast.success(`${deleteTarget.email} deleted`)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: DataTableColumn<StaffUser>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {u.firstName[0]}
            {u.lastName[0]}
          </div>
          <div>
            <div className="font-medium">
              {u.firstName} {u.lastName}
            </div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <Badge variant="outline">{u.role.name}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <Badge variant={u.isActive ? 'default' : 'destructive'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    { key: 'phone', header: 'Phone', render: (u) => u.phone ?? '—' },
    { key: 'createdAt', header: 'Created', render: (u) => new Date(u.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(u)}>Edit</DropdownMenuItem>
            {u.isActive ? (
              <DropdownMenuItem variant="destructive" onClick={() => setDeactivateTarget(u)}>
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleReactivate(u)}>Reactivate</DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(u)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users & Roles</h1>
          <p className="text-sm text-muted-foreground">{users.length} staff/customer accounts</p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Add staff user
        </Button>
      </div>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email…"
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterOptions={ROLE_FILTER_OPTIONS}
        filterPlaceholder="Role"
      />

      <DataTable columns={columns} data={filtered} getRowId={(u) => u.id} isLoading={isLoading} emptyMessage="No users found." />

      <UserFormSheet
        key={editingUser?.id ?? 'create'}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        user={editingUser}
        onSuccess={load}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate user?"
        description={`${deactivateTarget?.email} will no longer be able to log in.`}
        confirmLabel="Deactivate"
        variant="destructive"
        isConfirming={isDeactivating}
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete user?"
        description={`${deleteTarget?.email} will be permanently deleted. This can't be undone. Accounts with order or inventory history can't be deleted - deactivate those instead.`}
        confirmLabel="Delete"
        variant="destructive"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
