import { Resend } from 'resend'
import { logger } from '@edunest/core'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'EduNest <no-reply@edunest.vn>'

export interface SendEmailInput {
  to: string
  subject: string
  react: React.ReactElement
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const { error } = await resend.emails.send({
    from:    FROM,
    to:      input.to,
    subject: input.subject,
    react:   input.react,
  })

  if (error) {
    logger.error('[Email] Send failed', { to: input.to, error: error.message })
    throw error
  }
}
