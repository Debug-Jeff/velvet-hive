import crypto from 'node:crypto'
import axios from 'axios'
import { env } from '../../../config/env'

const client = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
})

interface InitializeResult {
  authorizationUrl: string
  accessCode: string
  reference: string
}

export async function initializeTransaction(input: {
  email: string
  amountKes: number
  reference: string
  callbackUrl?: string
}): Promise<InitializeResult> {
  const { data } = await client.post('/transaction/initialize', {
    email: input.email,
    amount: input.amountKes * 100, // Paystack amounts are in the currency's subunit (kobo-equivalent)
    reference: input.reference,
    currency: 'KES',
    callback_url: input.callbackUrl,
  })

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  }
}

export async function verifyTransaction(reference: string) {
  const { data } = await client.get(`/transaction/verify/${encodeURIComponent(reference)}`)
  return data.data as { status: string; reference: string; amount: number; id: number }
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false
  const hash = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex')
  return hash === signature
}
