import axios from 'axios'
import { env } from '../../../config/env'
import { ApiError } from '../../../lib/apiError'

const BASE_URL = env.DARAJA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value

  const credentials = Buffer.from(`${env.DARAJA_CONSUMER_KEY}:${env.DARAJA_CONSUMER_SECRET}`).toString('base64')
  const { data } = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  })

  // expires_in is seconds (usually 3599); refresh a little early to be safe.
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000 }
  return cachedToken.value
}

// Daraja expects Kenyan numbers as 2547XXXXXXXX / 2541XXXXXXXX - no leading 0 or +.
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.startsWith('7') || digits.startsWith('1')) {
    if (digits.length === 9) return `254${digits}`
  }
  throw ApiError.badRequest('Enter a valid Kenyan phone number (e.g. 07XXXXXXXX)', 'INVALID_PHONE')
}

function timestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  )
}

export async function stkPush(input: { phone: string; amountKes: number; accountReference: string; description: string }) {
  const token = await getAccessToken()
  const ts = timestamp()
  const password = Buffer.from(`${env.DARAJA_SHORTCODE}${env.DARAJA_PASSKEY}${ts}`).toString('base64')
  const phone = normalizePhone(input.phone)

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: env.DARAJA_SHORTCODE,
      Password: password,
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(input.amountKes),
      PartyA: phone,
      PartyB: env.DARAJA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `${env.DARAJA_CALLBACK_BASE_URL}/api/payments/mpesa/callback`,
      AccountReference: input.accountReference,
      TransactionDesc: input.description,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  )

  return data as {
    MerchantRequestID: string
    CheckoutRequestID: string
    ResponseCode: string
    ResponseDescription: string
    CustomerMessage: string
  }
}
