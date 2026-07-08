import { useEffect, useMemo, useState } from 'react'
import { Search, Sparkles, Truck, ShieldCheck, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ProductCard from '@/components/storefront/ProductCard'
import ProductDetail from '@/components/storefront/ProductDetail'
import * as productsApi from '@/api/products.api'
import { ApiError } from '@/api/client'
import { CATEGORIES } from '@/constants/categories'
import type { Product } from '@/types/product'

const TRUST_BADGES = [
  { icon: Truck, label: 'Fast delivery' },
  { icon: CreditCard, label: 'Card & M-Pesa payments' },
  { icon: ShieldCheck, label: 'Secure checkout' },
]

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<Product | null>(null)

  useEffect(() => {
    productsApi
      .listProducts()
      .then(setProducts)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Could not load products'))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
      const matchesCategory = category === 'All' || p.category === category
      return matchesSearch && matchesCategory
    })
  }, [products, search, category])

  return (
    <div>
      <section
        className="border-b border-border/60 px-4 py-16 text-center sm:py-20"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, var(--brand-primary-light), transparent)',
        }}
      >
        <Badge variant="outline" className="mx-auto mb-4 gap-1 border-primary/30 bg-primary/5 px-3 py-1 text-primary">
          <Sparkles className="size-3" /> Now delivering across Nairobi
        </Badge>

        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Everything for your home, <span className="text-primary">delivered.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Groceries, electronics, and more — all in one basket, at prices that make sense.
        </p>

        <div className="relative mx-auto mt-8 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-12 pl-9 shadow-sm"
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <Badge
              key={c}
              variant={c === category ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => setCategory(c)}
            >
              {c}
            </Badge>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon className="size-4 text-primary" /> {label}
            </span>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{category === 'All' ? 'All products' : category}</h2>
          {!isLoading && <p className="text-sm text-muted-foreground">{filtered.length} items</p>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onClick={() => setSelected(product)} />
            ))}
          </div>
        )}
      </main>

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
