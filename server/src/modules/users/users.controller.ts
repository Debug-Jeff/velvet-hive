import type { Request, Response } from 'express'
import { ApiError } from '../../lib/apiError'
import * as usersService from './users.service'

export async function listHandler(_req: Request, res: Response) {
  const users = await usersService.listUsers()
  res.json(users)
}

export async function createHandler(req: Request, res: Response) {
  const user = await usersService.createUser(req.body)
  res.status(201).json(user)
}

export async function updateHandler(req: Request, res: Response) {
  const id = req.params.id as string
  const user = await usersService.updateUser(id, req.body)
  res.json(user)
}

export async function deleteHandler(req: Request, res: Response) {
  const id = req.params.id as string
  if (id === req.user!.id) throw ApiError.badRequest('You cannot delete your own account', 'CANNOT_DELETE_SELF')
  await usersService.deleteUser(id)
  res.status(204).send()
}
