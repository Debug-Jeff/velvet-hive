import rateLimit from 'express-rate-limit'

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

// Tight burst limit specifically on credential-guessing endpoints (login/register).
// Deliberately scoped to just those two routes, not the whole /api/auth mount —
// /refresh, /logout, /me are normal-traffic endpoints, not brute-force vectors.
export const credentialsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later.' } },
})
