import type { Request, Response } from 'express'
import * as inventoryService from './inventory.service'

export async function listHandler(req: Request, res: Response) {
  const { productId, from, to } = req.query as unknown as { productId?: number; from?: Date; to?: Date }
  const movements = await inventoryService.listMovements(productId, { from, to })
  res.json(movements)
}

export async function createHandler(req: Request, res: Response) {
  const movement = await inventoryService.createMovement({ ...req.body, performedByUserId: req.user!.id })
  res.status(201).json(movement)
}
