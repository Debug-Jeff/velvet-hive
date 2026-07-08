import { api } from './client'
import type { CreateProductInput, Product, UpdateProductInput } from '../types/product'

export function listProducts(category?: string) {
  const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : ''
  return api.get<Product[]>(`/products${query}`)
}

export function getProduct(id: number) {
  return api.get<Product>(`/products/${id}`)
}

export function createProduct(input: CreateProductInput) {
  return api.post<Product>('/products', input)
}

export function updateProduct(id: number, input: UpdateProductInput) {
  return api.put<Product>(`/products/${id}`, input)
}

export function deactivateProduct(id: number) {
  return api.delete<void>(`/products/${id}`)
}
