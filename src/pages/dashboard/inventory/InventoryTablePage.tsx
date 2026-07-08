import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DataTable, { type DataTableColumn } from '@/components/dashboard/DataTable/DataTable'
import DataTableToolbar from '@/components/dashboard/DataTable/DataTableToolbar'
import InventoryMovementFormSheet from './InventoryMovementFormSheet'
import * as productsApi from '@/api/products.api'
import { ApiError } from '@/api/client'
import { CATEGORIES } from '@/constants/categories'
import type { Product } from '@/types/product'

const CATEGORY_FILTER_OPTIONS = CATEGORIES.map((c) => ({ label: c === 'All' ? 'All categories' : c, value: c }))

export default function InventoryTablePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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

      <InventoryMovementFormSheet open={sheetOpen} onOpenChange={setSheetOpen} product={selectedProduct} onSuccess={load} />
    </div>
  )
}
