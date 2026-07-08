import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as favoritesApi from '../api/favorites.api'
import { useAuth } from './AuthContext'

interface FavoritesContextValue {
  favoriteIds: Set<number>
  isFavorited: (productId: number) => boolean
  toggleFavorite: (productId: number) => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set())
      return
    }
    favoritesApi
      .listFavorites()
      .then((products) => setFavoriteIds(new Set(products.map((p) => p.id))))
      .catch(() => {})
  }, [user])

  async function toggleFavorite(productId: number) {
    const wasFavorited = favoriteIds.has(productId)

    // Optimistic update - reverted below if the request fails.
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (wasFavorited) next.delete(productId)
      else next.add(productId)
      return next
    })

    try {
      await favoritesApi.toggleFavorite(productId)
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (wasFavorited) next.add(productId)
        else next.delete(productId)
        return next
      })
    }
  }

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, isFavorited: (id) => favoriteIds.has(id), toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
