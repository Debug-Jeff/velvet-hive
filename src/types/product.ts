export interface Product {
  id: number
  sku: string
  name: string
  category: string
  description: string
  imageUrl: string
  priceKes: number
  costKes: number | null
  stockQuantity: number
  reorderThreshold: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  sku: string
  name: string
  category: string
  imageUrl: string
  description?: string
  priceKes: number
  costKes?: number
  stockQuantity?: number
  reorderThreshold?: number
}

export interface UpdateProductInput {
  name?: string
  category?: string
  imageUrl?: string
  description?: string
  priceKes?: number
  costKes?: number
  reorderThreshold?: number
}
