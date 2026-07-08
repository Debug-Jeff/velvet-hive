import { prisma } from '../../lib/prisma'
import { ApiError } from '../../lib/apiError'

export async function listFavoriteProducts(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  })
  return favorites.map((f) => f.product)
}

export async function listFavoritedProductIds(userId: string) {
  const favorites = await prisma.favorite.findMany({ where: { userId }, select: { productId: true } })
  return favorites.map((f) => f.productId)
}

export async function toggleFavorite(userId: string, productId: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw ApiError.notFound('Product not found')

  const existing = await prisma.favorite.findUnique({ where: { userId_productId: { userId, productId } } })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return { favorited: false }
  }

  await prisma.favorite.create({ data: { userId, productId } })
  return { favorited: true }
}
