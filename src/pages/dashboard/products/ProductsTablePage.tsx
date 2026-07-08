import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LayoutGrid, List, MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import DataTable, { type DataTableColumn } from '@/components/dashboard/DataTable/DataTable'
import DataTableToolbar from '@/components/dashboard/DataTable/DataTableToolbar'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import ProductFormSheet from './ProductFormSheet'
import ProductGridCard from './ProductGridCard'
import * as productsApi from '@/api/products.api'
import { ApiError } from '@/api/client'
import { CATEGORIES } from '@/constants/categories'
import { cn } from '@/lib/utils'
import { optimizedImageUrl } from '@/lib/cloudinaryImage'
import type { Product } from '@/types/product'

const CATEGORY_FILTER_OPTIONS = CATEGORIES.map((c) => ({ label: c === 'All' ? 'All categories' : c, value: c }))

type ViewMode = 'list' | 'grid'
type GridSize = 'sm' | 'md' | 'lg'

const GRID_SIZE_CLASSES: Record<GridSize, string> = {
  sm: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6',
  md: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  lg: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

export default function ProductsTablePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [gridSize, setGridSize] = useState<GridSize>('md')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

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

  function openCreate() {
    setSheetMode('create')
    setEditingProduct(null)
    setSheetOpen(true)
  }

  function openEdit(product: Product) {
    setSheetMode('edit')
    setEditingProduct(product)
    setSheetOpen(true)
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setIsDeactivating(true)
    try {
      await productsApi.deactivateProduct(deactivateTarget.id)
      toast.success(`${deactivateTarget.name} removed from catalog`)
      setDeactivateTarget(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove product')
    } finally {
      setIsDeactivating(false)
    }
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <img src={optimizedImageUrl(p.imageUrl)} alt="" className="size-9 shrink-0 rounded-md object-cover" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
          <div>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.sku}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <Badge variant="outline">{p.category}</Badge> },
    { key: 'price', header: 'Price', render: (p) => `KSh ${p.priceKes.toLocaleString()}` },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => (
        <span className={p.stockQuantity <= p.reorderThreshold ? 'font-medium text-destructive' : ''}>{p.stockQuantity}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(p)}>Edit</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeactivateTarget(p)}>
              Remove
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
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} items in the catalog</p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Add product
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DataTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or SKU…"
          filterValue={categoryFilter}
          onFilterChange={setCategoryFilter}
          filterOptions={CATEGORY_FILTER_OPTIONS}
          filterPlaceholder="Category"
        />

        <div className="flex items-center gap-2">
          {viewMode === 'grid' && (
            <ToggleGroup type="single" value={gridSize} onValueChange={(v) => v && setGridSize(v as GridSize)} variant="outline">
              <ToggleGroupItem value="sm" className="text-xs">S</ToggleGroupItem>
              <ToggleGroupItem value="md" className="text-xs">M</ToggleGroupItem>
              <ToggleGroupItem value="lg" className="text-xs">L</ToggleGroupItem>
            </ToggleGroup>
          )}
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} variant="outline">
            <ToggleGroupItem value="list" aria-label="List view">
              <List />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {viewMode === 'list' ? (
        <DataTable columns={columns} data={filtered} getRowId={(p) => p.id} isLoading={isLoading} emptyMessage="No products found." />
      ) : isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No products found.</p>
      ) : (
        <div className={cn('grid gap-4', GRID_SIZE_CLASSES[gridSize])}>
          {filtered.map((p) => (
            <ProductGridCard key={p.id} product={p} onEdit={() => openEdit(p)} onRemove={() => setDeactivateTarget(p)} />
          ))}
        </div>
      )}

      <ProductFormSheet
        key={editingProduct?.id ?? 'create'}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        product={editingProduct}
        onSuccess={load}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Remove product?"
        description={`"${deactivateTarget?.name}" will be hidden from the storefront. Order history referencing it is preserved.`}
        confirmLabel="Remove"
        variant="destructive"
        isConfirming={isDeactivating}
        onConfirm={handleDeactivate}
      />
    </div>
  )
}
