import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Package, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import StatCard from '@/components/dashboard/StatCard'
import DataTable, { type DataTableColumn } from '@/components/dashboard/DataTable/DataTable'
import DataTableToolbar from '@/components/dashboard/DataTable/DataTableToolbar'
import DateRangePicker, { type DateRangeValue } from '@/components/dashboard/DateRangePicker'
import ExportCsvButton from '@/components/dashboard/ExportCsvButton'
import * as productsApi from '@/api/products.api'
import * as inventoryApi from '@/api/inventory.api'
import { ApiError } from '@/api/client'
import { CATEGORIES } from '@/constants/categories'
import type { Product } from '@/types/product'
import type { InventoryMovement } from '@/types/inventory'

const stockChartConfig = {
  stock: { label: 'Units in stock', color: 'var(--chart-3)' },
} satisfies ChartConfig

const CATEGORY_FILTER_OPTIONS = CATEGORIES.map((c) => ({ label: c === 'All' ? 'All categories' : c, value: c }))

const MOVEMENT_TYPE_LABELS: Record<InventoryMovement['type'], string> = {
  IN: 'Stock in',
  OUT: 'Stock out',
  ADJUSTMENT: 'Adjustment',
}

export default function StockReportPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [isLoadingMovements, setIsLoadingMovements] = useState(true)
  const [range, setRange] = useState<DateRangeValue>({})

  useEffect(() => {
    productsApi
      .listProducts()
      .then(setProducts)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load products'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    setIsLoadingMovements(true)
    inventoryApi
      .listInventoryMovements(undefined, range)
      .then(setMovements)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load movements'))
      .finally(() => setIsLoadingMovements(false))
  }, [range])

  const { lowStockCount, inventoryValue } = useMemo(() => {
    return {
      lowStockCount: products.filter((p) => p.stockQuantity <= p.reorderThreshold).length,
      inventoryValue: products.reduce((sum, p) => sum + p.priceKes * p.stockQuantity, 0),
    }
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  const stockByCategory = useMemo(() => {
    const byCategory = new Map<string, number>()
    for (const p of products) {
      byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + p.stockQuantity)
    }
    return Array.from(byCategory.entries()).map(([category, stock]) => ({ category, stock }))
  }, [products])

  const columns: DataTableColumn<Product>[] = [
    { key: 'name', header: 'Product', render: (p) => <div><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.sku}</div></div> },
    { key: 'category', header: 'Category', render: (p) => <Badge variant="outline">{p.category}</Badge> },
    { key: 'stock', header: 'Stock', render: (p) => <span className={p.stockQuantity <= p.reorderThreshold ? 'font-semibold text-destructive' : ''}>{p.stockQuantity}</span> },
    { key: 'value', header: 'Stock value', render: (p) => `KSh ${(p.priceKes * p.stockQuantity).toLocaleString()}` },
    {
      key: 'margin',
      header: 'Margin',
      render: (p) => (p.costKes == null ? <span className="text-muted-foreground">—</span> : `KSh ${(p.priceKes - p.costKes).toLocaleString()}`),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (p.stockQuantity <= p.reorderThreshold ? <Badge variant="destructive">Low stock</Badge> : <Badge variant="outline">OK</Badge>),
    },
  ]

  const movementColumns: DataTableColumn<InventoryMovement>[] = [
    { key: 'product', header: 'Product', render: (m) => m.product.name },
    { key: 'type', header: 'Type', render: (m) => <Badge variant="outline">{MOVEMENT_TYPE_LABELS[m.type]}</Badge> },
    { key: 'quantity', header: 'Quantity', render: (m) => m.quantity },
    { key: 'stockAfter', header: 'Stock after', render: (m) => m.stockAfter },
    { key: 'reason', header: 'Reason', render: (m) => <span className="text-sm text-muted-foreground">{m.reason}</span> },
    { key: 'date', header: 'Date', render: (m) => new Date(m.createdAt).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Stock Reports</h1>
          <p className="text-sm text-muted-foreground">Inventory levels and value</p>
        </div>
        <ExportCsvButton
          filename="stock-report.csv"
          headers={['Product', 'SKU', 'Category', 'Stock', 'Stock value (KES)', 'Margin (KES)']}
          rows={filtered.map((p) => [
            p.name,
            p.sku,
            p.category,
            p.stockQuantity,
            p.priceKes * p.stockQuantity,
            p.costKes == null ? '' : p.priceKes - p.costKes,
          ])}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total products" value={products.length} icon={Package} isLoading={isLoading} accent="blue" />
        <StatCard label="Low stock items" value={lowStockCount} icon={AlertTriangle} isLoading={isLoading} accent="amber" />
        <StatCard label="Inventory value" value={`KSh ${inventoryValue.toLocaleString()}`} icon={Wallet} isLoading={isLoading} accent="green" />
      </div>

      {!isLoading && products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock by category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={stockChartConfig} className="h-64 w-full">
              <BarChart data={stockByCategory}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="category" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="stock" fill="var(--color-stock)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products…"
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        filterOptions={CATEGORY_FILTER_OPTIONS}
        filterPlaceholder="Category"
      />

      <DataTable columns={columns} data={filtered} getRowId={(p) => p.id} isLoading={isLoading} emptyMessage="No products found." pageSize={15} />

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Recent movements</h2>
          <div className="flex items-center gap-2">
            <DateRangePicker value={range} onChange={setRange} />
            <ExportCsvButton
              filename="stock-movements.csv"
              headers={['Product', 'Type', 'Quantity', 'Stock after', 'Reason', 'Date']}
              rows={movements.map((m) => [
                m.product.name,
                MOVEMENT_TYPE_LABELS[m.type],
                m.quantity,
                m.stockAfter,
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
