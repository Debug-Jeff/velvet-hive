import { api } from './client'
import type { Product } from '../types/product'

export function listFavorites() {
  return api.get<Product[]>('/favorites')
}

export function toggleFavorite(productId: number) {
  return api.post<{ favorited: boolean }>(`/favorites/${productId}/toggle`)
}
