import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { generalLimiter } from './middleware/rateLimit'
import authRoutes from './modules/auth/auth.routes'
import usersRoutes from './modules/users/users.routes'
import productsRoutes from './modules/products/products.routes'
import ordersRoutes from './modules/orders/orders.routes'
import paystackRoutes from './modules/payments/paystack/paystack.routes'
import mpesaRoutes from './modules/payments/mpesa/mpesa.routes'
import inventoryRoutes from './modules/inventory/inventory.routes'
import securityRoutes from './modules/security/security.routes'
import favoritesRoutes from './modules/favorites/favorites.routes'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  // Capture the raw body alongside JSON parsing - Paystack's webhook signature
  // must be verified against the exact bytes received, not a re-serialized object.
  app.use(express.json({ verify: (req, _res, buf) => { (req as express.Request).rawBody = buf } }))
  app.use(cookieParser())
  app.use(generalLimiter)

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

  app.use('/api/auth', authRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/products', productsRoutes)
  app.use('/api/orders', ordersRoutes)
  app.use('/api/payments/paystack', paystackRoutes)
  app.use('/api/payments/mpesa', mpesaRoutes)
  app.use('/api/inventory', inventoryRoutes)
  app.use('/api/security', securityRoutes)
  app.use('/api/favorites', favoritesRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
