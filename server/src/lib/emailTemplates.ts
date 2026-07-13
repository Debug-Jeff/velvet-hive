import { env } from '../config/env'

function layout(bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1e293b;">
    <h2 style="color: #8f5822; margin-bottom: 4px;">${env.APP_NAME}</h2>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 12px; color: #8a7a68;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>`
}

export function verificationEmail(input: { firstName: string; code: string }) {
  return {
    subject: `${env.APP_NAME}: verify your email`,
    html: layout(`
      <p>Hi ${input.firstName},</p>
      <p>Thanks for creating an account. Use this code to verify your email address:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; background: #f6eada; padding: 12px 20px; border-radius: 10px; display: inline-block;">${input.code}</p>
      <p>This code expires in 15 minutes.</p>
    `),
  }
}

export function accountExistsEmail(input: { firstName: string }) {
  return {
    subject: `${env.APP_NAME}: sign-up attempt on your account`,
    html: layout(`
      <p>Hi ${input.firstName},</p>
      <p>Someone just tried to create a new ${env.APP_NAME} account using this email address, which already has one.</p>
      <p>If this was you, you can just log in instead. If you've forgotten your password, use the "Forgot password" link on the sign-in page.</p>
    `),
  }
}

export function passwordResetEmail(input: { firstName: string; code: string }) {
  return {
    subject: `${env.APP_NAME}: reset your password`,
    html: layout(`
      <p>Hi ${input.firstName},</p>
      <p>We received a request to reset your password. Use this code to continue:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; background: #f6eada; padding: 12px 20px; border-radius: 10px; display: inline-block;">${input.code}</p>
      <p>This code expires in 15 minutes.</p>
    `),
  }
}

export function suspiciousLoginEmail(input: { firstName: string; ip: string; time: string; userAgent: string }) {
  return {
    subject: `${env.APP_NAME}: new sign-in to your account`,
    html: layout(`
      <p>Hi ${input.firstName},</p>
      <p>We noticed a sign-in to your account from a new location:</p>
      <ul>
        <li><strong>Time:</strong> ${input.time}</li>
        <li><strong>IP address:</strong> ${input.ip}</li>
        <li><strong>Device:</strong> ${input.userAgent}</li>
      </ul>
      <p>If this was you, no action is needed. If you don't recognize this activity, reset your password immediately.</p>
    `),
  }
}

export function orderConfirmationEmail(input: {
  firstName: string
  orderId: string
  totalKes: number
  items: Array<{ name: string; quantity: number; priceAtPurchaseKes: number }>
}) {
  const rows = input.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 6px 0;">${item.name} &times; ${item.quantity}</td>
          <td style="padding: 6px 0; text-align: right;">KSh ${(item.priceAtPurchaseKes * item.quantity).toLocaleString()}</td>
        </tr>`,
    )
    .join('')

  return {
    subject: `${env.APP_NAME}: order confirmed (#${input.orderId.slice(-8)})`,
    html: layout(`
      <p>Hi ${input.firstName},</p>
      <p>Thanks for your purchase! Your order has been confirmed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${rows}
        <tr>
          <td style="padding-top: 10px; border-top: 1px solid #f0eae2; font-weight: 700;">Total</td>
          <td style="padding-top: 10px; border-top: 1px solid #f0eae2; text-align: right; font-weight: 700;">KSh ${input.totalKes.toLocaleString()}</td>
        </tr>
      </table>
      <p>Order reference: ${input.orderId}</p>
    `),
  }
}

export function orderCancellationEmail(input: { firstName: string; orderId: string; reason: string }) {
  return {
    subject: `${env.APP_NAME}: order cancelled (#${input.orderId.slice(-8)})`,
    html: layout(`
      <p>Hi ${input.firstName},</p>
      <p>Your order has been cancelled. Here's why:</p>
      <p style="background: #f6eada; padding: 12px 16px; border-radius: 10px;">${input.reason}</p>
      <p>If you already paid for this order, our team will follow up separately about a refund.</p>
      <p>Order reference: ${input.orderId}</p>
    `),
  }
}
