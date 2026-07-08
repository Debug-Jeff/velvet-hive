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
import * as productsApi from '@/api/products.api'
import { ApiError } from '@/api/client'
import { CATEGORIES } from '@/constants/categories'
import type { Product } from '@/types/product'

const stockChartConfig = {
  stock: { label: 'Units in stock', color: 'var(--chart-3)' },
} satisfies ChartConfig

const CATEGORY_FILTER_OPTIONS = CATEGORIES.map((c) => ({ label: c === 'All' ? 'All categories' : c, value: c }))

export default function StockReportPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  useEffect(() => {
    productsApi
      .listProducts()
      .then(setProducts)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load products'))
      .finally(() => setIsLoading(false))
  }, [])

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
      key: 'status',
      header: 'Status',
      render: (p) => (p.stockQuantity <= p.reorderThreshold ? <Badge variant="destructive">Low stock</Badge> : <Badge variant="outline">OK</Badge>),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Stock Reports</h1>
        <p className="text-sm text-muted-foreground">Inventory levels and value</p>
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
    </div>
  )
}
