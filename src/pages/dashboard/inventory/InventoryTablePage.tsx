import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DataTable, { type DataTableColumn } from '@/components/dashboard/DataTable/DataTable'
import DataTableToolbar from '@/components/dashboard/DataTable/DataTableToolbar'
import DateRangePicker, { type DateRangeValue } from '@/components/dashboard/DateRangePicker'
import ExportCsvButton from '@/components/dashboard/ExportCsvButton'
import InventoryMovementFormSheet from './InventoryMovementFormSheet'
import * as productsApi from '@/api/products.api'
import * as inventoryApi from '@/api/inventory.api'
import { ApiError } from '@/api/client'
import { CATEGORIES } from '@/constants/categories'
import type { Product } from '@/types/product'
import type { InventoryMovement } from '@/types/inventory'

const CATEGORY_FILTER_OPTIONS = CATEGORIES.map((c) => ({ label: c === 'All' ? 'All categories' : c, value: c }))

const MOVEMENT_TYPE_LABELS: Record<InventoryMovement['type'], string> = {
  IN: 'Stock in',
  OUT: 'Stock out',
  ADJUSTMENT: 'Adjustment',
}

export default function InventoryTablePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [isLoadingMovements, setIsLoadingMovements] = useState(true)
  const [range, setRange] = useState<DateRangeValue>({})

  function loadMovements() {
    setIsLoadingMovements(true)
    inventoryApi
      .listInventoryMovements(undefined, range)
      .then(setMovements)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load movements'))
      .finally(() => setIsLoadingMovements(false))
  }

  useEffect(() => {
    loadMovements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  async function load() {
    setIsLoading(true)
    try {
      setProducts(await productsApi.listProducts())
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  function handleMovementRecorded() {
    load()
    loadMovements()
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  function openMovement(product: Product) {
    setSelectedProduct(product)
    setSheetOpen(true)
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div>
          <div className="font-medium">{p.name}</div>
          <div className="text-xs text-muted-foreground">{p.sku}</div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <Badge variant="outline">{p.category}</Badge> },
    {
      key: 'stock',
      header: 'Current stock',
      render: (p) => (
        <span className={p.stockQuantity <= p.reorderThreshold ? 'font-semibold text-destructive' : 'font-medium'}>
          {p.stockQuantity}
        </span>
      ),
    },
    { key: 'threshold', header: 'Reorder at', render: (p) => p.reorderThreshold },
    {
      key: 'status',
      header: 'Status',
      render: (p) =>
        p.stockQuantity <= p.reorderThreshold ? (
          <Badge variant="destructive">Low stock</Badge>
        ) : (
          <Badge variant="outline">OK</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <Button variant="outline" size="sm" onClick={() => openMovement(p)}>
          <PackagePlus /> Record movement
        </Button>
      ),
    },
  ]

  const movementColumns: DataTableColumn<InventoryMovement>[] = [
    { key: 'product', header: 'Product', render: (m) => m.product.name },
    { key: 'type', header: 'Type', render: (m) => <Badge variant="outline">{MOVEMENT_TYPE_LABELS[m.type]}</Badge> },
    { key: 'quantity', header: 'Quantity', render: (m) => m.quantity },
    { key: 'stockAfter', header: 'Stock after', render: (m) => m.stockAfter },
    { key: 'performedBy', header: 'By', render: (m) => (m.performedBy ? `${m.performedBy.firstName} ${m.performedBy.lastName}` : '—') },
    { key: 'reason', header: 'Reason', render: (m) => <span className="text-sm text-muted-foreground">{m.reason}</span> },
    { key: 'date', header: 'Date', render: (m) => new Date(m.createdAt).toLocaleString() },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">{products.filter((p) => p.stockQuantity <= p.reorderThreshold).length} products need restocking</p>
      </div>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or SKU…"
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        filterOptions={CATEGORY_FILTER_OPTIONS}
        filterPlaceholder="Category"
      />

      <DataTable columns={columns} data={filtered} getRowId={(p) => p.id} isLoading={isLoading} emptyMessage="No products found." />

      <InventoryMovementFormSheet open={sheetOpen} onOpenChange={setSheetOpen} product={selectedProduct} onSuccess={handleMovementRecorded} />

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Recent movements</h2>
          <div className="flex items-center gap-2">
            <DateRangePicker value={range} onChange={setRange} />
            <ExportCsvButton
              filename="inventory-movements.csv"
              headers={['Product', 'Type', 'Quantity', 'Stock after', 'By', 'Reason', 'Date']}
              rows={movements.map((m) => [
                m.product.name,
                MOVEMENT_TYPE_LABELS[m.type],
                m.quantity,
                m.stockAfter,
                m.performedBy ? `${m.performedBy.firstName} ${m.performedBy.lastName}` : '',
                m.reason,
                new Date(m.createdAt).toLocaleString(),
              ])}
            />
          </div>
        </div>
        <DataTable
          columns={movementColumns}
          data={movements}
          getRowId={(m) => m.id}
          isLoading={isLoadingMovements}
          emptyMessage="No movements in this range."
          pageSize={15}
        />
      </div>
    </div>
  )
}
