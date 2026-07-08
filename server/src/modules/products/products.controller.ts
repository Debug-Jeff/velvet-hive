import type { Request, Response } from 'express'
import { ApiError } from '../../lib/apiError'
import * as productsService from './products.service'

export async function listHandler(req: Request, res: Response) {
  const { category } = req.query as { category?: string }
  const products = await productsService.listProducts(category)
  res.json(products)
}

export async function getByIdHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number }
  const product = await productsService.getProductById(id)
  if (!product) throw ApiError.notFound('Product not found')
  res.json(product)
}

export async function createHandler(req: Request, res: Response) {
  const product = await productsService.createProduct(req.body)
  res.status(201).json(product)
}

export async function updateHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number }
  const product = await productsService.updateProduct(id, req.body)
  res.json(product)
}

export async function deactivateHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number }
  await productsService.deactivateProduct(id)
  res.status(204).send()
}
