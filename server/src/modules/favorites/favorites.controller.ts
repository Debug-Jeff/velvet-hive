import type { Request, Response } from 'express'
import * as favoritesService from './favorites.service'

export async function listHandler(req: Request, res: Response) {
  const products = await favoritesService.listFavoriteProducts(req.user!.id)
  res.json(products)
}

export async function toggleHandler(req: Request, res: Response) {
  const productId = Number(req.params.productId)
  const result = await favoritesService.toggleFavorite(req.user!.id, productId)
  res.json(result)
}
