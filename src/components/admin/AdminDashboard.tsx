import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, LogOut, X, Package, Search, Download } from 'lucide-react'
import { CATEGORIES } from '../../constants'
import { useCurrency } from '../../context/CurrencyContext'
import './AdminDashboard.css'

interface Product {
  id: number
  name: string
  price: number
  category: string
  image: string
  description: string
}

interface FormState {
  name: string
  price: string
  category: string
  image: string
  description: string
}

const EMPTY: FormState = { name: '', price: '', category: 'Electronics', image: '', description: '' }
const CATS = CATEGORIES.filter(c => c !== 'All')

interface Props {
  onLogout: () => void
}

export default function AdminDashboard({ onLogout }: Props) {
  const pwd = sessionStorage.getItem('adminPwd') ?? ''
  const authHeaders = { 'Content-Type': 'application/json', 'x-admin-password': pwd }
  const { currency, toggle, format } = useCurrency()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchName = p.name.toLowerCase().includes(search.toLowerCase())
      const matchCat  = catFilter === 'All' || p.category === catFilter
      return matchName && matchCat
    })
  }, [products, search, catFilter])

  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error()
      setProducts(await res.json())
    } catch {
      setFetchError('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setFormError(''); setModal('add') }

  const openEdit = (p: Product) => {
    setEditTarget(p)
    setForm({ name: p.name, price: String(p.price), category: p.category, image: p.image ?? '', description: p.description ?? '' })
    setFormError('')
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setEditTarget(null) }

  const setField = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.category) {
      setFormError('Name, price and category are required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const body = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        category: form.category,
        image_url: form.image.trim(),
        description: form.description.trim(),
      }
      const url    = modal === 'edit' ? `/api/products/${editTarget!.id}` : '/api/products'
      const method = modal === 'edit' ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(body) })
      if (!res.ok) {
        const j = await res.json()
        setFormError(j.error ?? 'Something went wrong.')
        return
      }
      await load()
      closeModal()
    } catch {
      setFormError('Could not reach the server.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE', headers: authHeaders })
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch {
      // silent — table reflects truth on next load
    } finally {
      setDeleteConfirm(null)
    }
  }

  const RATE = 130
  const handleExport = () => {
    const label = catFilter === 'All' ? 'all' : catFilter.toLowerCase().replace(/\s+/g, '-')
    const filename = `products-${label}${search ? `-${search.toLowerCase().replace(/\s+/g, '-')}` : ''}.json`
    const exportData = filtered.map(({ price, ...rest }) => ({
      ...rest,
      price_usd: price,
      price_ksh: Math.round(price * RATE),
    }))
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const isFiltered = search !== '' || catFilter !== 'All'

  return (
    <div className="ad-wrap">
      {/* Header */}
      <header className="ad-header">
        <div className="ad-header-inner">
          <div className="ad-brand">
            <Package size={18} />
            <span>Velvet Hive <em>Admin</em></span>
          </div>
          <div className="ad-header-right">
            <a className="ad-store-link" href="/" onClick={e => { e.preventDefault(); window.location.href = '/' }}>
              View store
            </a>
            <button className="btn btn-outline btn-sm ad-logout" onClick={onLogout}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="ad-main">
        {/* Top bar */}
        <div className="ad-topbar">
          <div>
            <h2 className="ad-title">Products</h2>
            <p className="ad-subtitle">
              {isFiltered
                ? `${filtered.length} of ${products.length} items`
                : `${products.length} item${products.length !== 1 ? 's' : ''} in the store`}
            </p>
          </div>
          <button className="btn btn-primary btn-md" onClick={openAdd}>
            <Plus size={15} /> Add Product
          </button>
        </div>

        {/* Filter + export toolbar */}
        <div className="ad-toolbar">
          <div className="ad-filter-group">
            <Search size={15} className="ad-filter-icon" />
            <input
              className="ad-filter-input"
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="ad-filter-divider" />
            <select
              className="ad-filter-select"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
            >
              <option value="All">All categories</option>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            {isFiltered && (
              <button
                className="ad-filter-clear"
                onClick={() => { setSearch(''); setCatFilter('All') }}
                title="Clear filters"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            className="ad-currency-btn"
            onClick={toggle}
            title="Switch currency"
          >
            {currency === 'KSH' ? 'KSh' : 'USD'}
          </button>

          <button
            className="ad-export-btn"
            onClick={handleExport}
            disabled={filtered.length === 0}
            title={`Download ${filtered.length} product${filtered.length !== 1 ? 's' : ''} as JSON`}
          >
            <Download size={14} />
            <span>Export JSON</span>
            <span className="ad-export-badge">{filtered.length}</span>
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p className="status-msg">Loading…</p>
        ) : fetchError ? (
          <p className="status-msg status-error">{fetchError}</p>
        ) : filtered.length === 0 ? (
          <div className="ad-empty">
            <Package size={40} />
            <p>{isFiltered ? 'No products match your filters.' : 'No products yet. Add your first one!'}</p>
            {!isFiltered && <button className="btn btn-primary btn-md" onClick={openAdd}><Plus size={15} /> Add Product</button>}
          </div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th className="ad-col-img"></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="ad-col-img">
                      <div className="ad-thumb">
                        {p.image
                          ? <img src={p.image} alt={p.name} />
                          : <span className="ad-thumb-placeholder"><Package size={16} /></span>
                        }
                      </div>
                    </td>
                    <td>
                      <span className="ad-product-name">{p.name}</span>
                      {p.description && <span className="ad-product-desc">{p.description}</span>}
                    </td>
                    <td><span className="badge">{p.category}</span></td>
                    <td className="ad-price">{format(p.price)}</td>
                    <td>
                      <div className="ad-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>
                          <Pencil size={12} /> Edit
                        </button>
                        {deleteConfirm === p.id ? (
                          <div className="ad-confirm">
                            <span>Delete?</span>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Yes</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm ad-del-btn" onClick={() => setDeleteConfirm(p.id)}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add / Edit modal */}
      {modal && (
        <div className="ad-overlay" onClick={closeModal}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <div className="ad-modal-head">
              <h3>{modal === 'add' ? 'Add Product' : 'Edit Product'}</h3>
              <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="ad-modal-body">
              <div className="ad-fields">
                <label className="ad-field">
                  <span>Name *</span>
                  <input className="input" type="text" placeholder="Product name" value={form.name} onChange={setField('name')} />
                </label>
                <div className="ad-fields-row">
                  <label className="ad-field">
                    <span>Price (USD) *</span>
                    <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={setField('price')} />
                  </label>
                  <label className="ad-field">
                    <span>Category *</span>
                    <select className="input" value={form.category} onChange={setField('category')}>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                </div>
                <label className="ad-field">
                  <span>Image URL</span>
                  <input className="input" type="text" placeholder="https://…" value={form.image} onChange={setField('image')} />
                  {form.image && (
                    <div className="ad-img-preview">
                      <img src={form.image} alt="preview" onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </label>
                <label className="ad-field">
                  <span>Description</span>
                  <textarea className="input ad-textarea" rows={3} placeholder="Short product description…" value={form.description} onChange={setField('description')} />
                </label>
              </div>
              {formError && <p className="ad-form-error">{formError}</p>}
            </div>
            <div className="ad-modal-foot">
              <button className="btn btn-outline btn-md" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
