'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { fetchWithTimeout } from '@/lib/utils/fetch'
import { rateLimit, rateLimiters } from '@/lib/utils/rate-limit'
import {
  isValidWaitlistEmail,
  normalizeWaitlistEmail,
} from '@/lib/utils/waitlist'

type WaitlistProvider = 'hubspot' | 'mailchimp'

type WaitlistSubmission = {
  email: string
  provider: WaitlistProvider
}

type FormState<TData> = {
  status: number
  message?: string
  data?: TData
  fieldErrors?: Partial<Record<'email', string>>
}

export type WaitlistActionState = FormState<WaitlistSubmission>

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')

const WAITLIST_SUCCESS_MESSAGE = 'You are on the waitlist.'
const WAITLIST_EMAIL_ERROR = 'Enter a valid email address.'
const WAITLIST_UNAVAILABLE_MESSAGE =
  'Waitlist is temporarily unavailable. Please try again shortly.'

class WaitlistConfigurationError extends Error {
  override name = 'WaitlistConfigurationError'
}

class WaitlistRequestError extends Error {
  override name = 'WaitlistRequestError'
}

type WaitlistContext = {
  email: string
  pageUri: string
}

export async function joinWaitlistAction(
  _prevState: WaitlistActionState | null,
  formData: FormData
): Promise<WaitlistActionState> {
  const trapValue = formData.get('company')
  if (typeof trapValue === 'string' && trapValue.trim().length > 0) {
    return {
      status: 200,
      message: WAITLIST_SUCCESS_MESSAGE,
    }
  }

  const rawEmail = formData.get('email')
  if (typeof rawEmail !== 'string') {
    return {
      status: 400,
      message: WAITLIST_EMAIL_ERROR,
      fieldErrors: {
        email: WAITLIST_EMAIL_ERROR,
      },
    }
  }

  const email = normalizeWaitlistEmail(rawEmail)
  if (!isValidWaitlistEmail(email)) {
    return {
      status: 400,
      message: WAITLIST_EMAIL_ERROR,
      fieldErrors: {
        email: WAITLIST_EMAIL_ERROR,
      },
    }
  }

  const requestHeaders = await headers()
  const identifier = `${getClientIdentifier(requestHeaders)}:${email}:waitlist`
  const rateLimitResult = rateLimit(identifier, rateLimiters.strict)
  if (!rateLimitResult.success) {
    return {
      status: 429,
      message: `Too many attempts. Try again in ${rateLimitResult.resetIn}s.`,
    }
  }

  const pageUri = requestHeaders.get('referer') ?? `${APP_BASE_URL}/#waitlist`

  try {
    const provider = await submitToWaitlistProvider({
      email,
      pageUri,
    })

    return {
      status: 200,
      message: WAITLIST_SUCCESS_MESSAGE,
      data: {
        email,
        provider,
      },
    }
  } catch (error) {
    console.error('[Waitlist] submission failed', error)

    if (error instanceof WaitlistConfigurationError) {
      return {
        status: 503,
        message:
          process.env.NODE_ENV === 'development'
            ? 'Waitlist integration is not configured. Add HubSpot or Mailchimp env vars.'
            : WAITLIST_UNAVAILABLE_MESSAGE,
      }
    }

    return {
      status: 502,
      message: WAITLIST_UNAVAILABLE_MESSAGE,
    }
  }
}

async function submitToWaitlistProvider(context: WaitlistContext) {
  if (isHubSpotConfigured()) {
    await submitToHubSpot(context)
    return 'hubspot' as const
  }

  if (isMailchimpConfigured()) {
    await submitToMailchimp(context.email)
    return 'mailchimp' as const
  }

  throw new WaitlistConfigurationError('No waitlist provider configured.')
}

function isHubSpotConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID &&
      process.env.NEXT_HUBSPOT_FORM_ID
  )
}

async function submitToHubSpot({ email, pageUri }: WaitlistContext) {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID
  const formId = process.env.NEXT_HUBSPOT_FORM_ID

  if (!(portalId && formId)) {
    throw new WaitlistConfigurationError('HubSpot waitlist form is not configured.')
  }

  const response = await fetchWithTimeout(
    `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.HUBSPOT_ACCESS_TOKEN
          ? { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        fields: [
          {
            name: 'email',
            value: email,
          },
        ],
        context: {
          pageName: 'Gravii Waitlist',
          pageUri,
        },
      }),
      timeout: 10_000,
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const responseBody = await readResponseBody(response)
    throw new WaitlistRequestError(
      `HubSpot request failed (${response.status}): ${responseBody}`
    )
  }
}

function isMailchimpConfigured() {
  return Boolean(
    process.env.MAILCHIMP_API_KEY &&
      process.env.MAILCHIMP_SERVER_PREFIX &&
      process.env.MAILCHIMP_AUDIENCE_ID
  )
}

async function submitToMailchimp(email: string) {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID

  if (!(apiKey && serverPrefix && audienceId)) {
    throw new WaitlistConfigurationError(
      'Mailchimp waitlist audience is not configured.'
    )
  }

  const subscriberHash = createHash('md5').update(email).digest('hex')
  const authToken = Buffer.from(`gravii:${apiKey}`).toString('base64')

  const response = await fetchWithTimeout(
    `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        status_if_new: 'subscribed',
        tags: ['waitlist'],
      }),
      timeout: 10_000,
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const responseBody = await readResponseBody(response)
    throw new WaitlistRequestError(
      `Mailchimp request failed (${response.status}): ${responseBody}`
    )
  }
}

function getClientIdentifier(requestHeaders: Headers) {
  const forwardedFor = requestHeaders.get('x-forwarded-for')
  if (forwardedFor) {
    const [ip] = forwardedFor.split(',')
    return ip?.trim() || 'unknown'
  }

  return (
    requestHeaders.get('cf-connecting-ip') ??
    requestHeaders.get('x-real-ip') ??
    'unknown'
  )
}

async function readResponseBody(response: Response) {
  try {
    return await response.text()
  } catch {
    return 'No response body'
  }
}
