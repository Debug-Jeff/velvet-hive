import { prisma } from '../../lib/prisma'

export function listProducts(category?: string) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(category && category !== 'All' ? { category } : {}),
    },
    orderBy: { id: 'asc' },
  })
}

export function getProductById(id: number) {
  return prisma.product.findFirst({ where: { id, isActive: true } })
}

export function createProduct(data: {
  sku: string
  name: string
  category: string
  imageUrl: string
  description?: string
  priceKes: number
  stockQuantity?: number
  reorderThreshold?: number
}) {
  return prisma.product.create({ data })
}

export function updateProduct(
  id: number,
  data: Partial<{
    name: string
    category: string
    imageUrl: string
    description: string
    priceKes: number
    reorderThreshold: number
  }>,
) {
  return prisma.product.update({ where: { id }, data })
}

export function deactivateProduct(id: number) {
  return prisma.product.update({ where: { id }, data: { isActive: false } })
}
