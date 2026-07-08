import { env } from '../config/env'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token })
  if (remoteIp) body.set('remoteip', remoteIp)

  const res = await fetch(VERIFY_URL, { method: 'POST', body })
  const data = (await res.json()) as { success: boolean }
  return data.success
}
