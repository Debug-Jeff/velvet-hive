import nodemailer from 'nodemailer'
import { env } from '../config/env'

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
})

interface SendMailInput {
  to: string
  subject: string
  html: string
  text?: string
}

// Email delivery failures should never take down the request that triggered them
// (registration, checkout, etc.) - log and move on rather than throwing.
export async function sendMail(input: SendMailInput) {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
  } catch (err) {
    console.error(`Failed to send email to ${input.to}:`, err instanceof Error ? err.message : err)
  }
}
