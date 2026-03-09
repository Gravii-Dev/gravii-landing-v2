'use client'

import clsx from 'clsx'
import { useActionState, useCallback, useEffect, useState } from 'react'
import {
  joinWaitlistAction,
  type WaitlistActionState,
} from '@/app/(site)/actions'
import {
  isValidWaitlistEmail,
  normalizeWaitlistEmail,
} from '@/lib/utils/waitlist'
import s from './waitlist.module.css'

const DEFAULT_STATUS_MESSAGE =
  'Join the waitlist for launch access and early product updates.'
const SUCCESS_RESET_DELAY_MS = 1600

export function WaitlistForm() {
  const [instanceKey, setInstanceKey] = useState(0)

  const handleReset = useCallback(() => {
    setInstanceKey((current) => current + 1)
  }, [])

  return <WaitlistFormInstance key={instanceKey} onReset={handleReset} />
}

function WaitlistFormInstance({ onReset }: { onReset: () => void }) {
  const [formState, formAction, isPending] = useActionState<
    WaitlistActionState | null,
    FormData
  >(joinWaitlistAction, null)
  const [email, setEmail] = useState('')
  const [hasTouched, setHasTouched] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const normalizedEmail = normalizeWaitlistEmail(email)
  const isEmailValid =
    normalizedEmail.length > 0 && isValidWaitlistEmail(normalizedEmail)
  const hasStaleResponse =
    submittedEmail !== null && normalizedEmail !== submittedEmail
  const activeState = hasStaleResponse ? null : formState
  const isSuccess = activeState?.status === 200
  const isError = (activeState?.status ?? 0) >= 400

  let clientError: string | null = null
  if (hasTouched) {
    if (normalizedEmail.length === 0) {
      clientError = 'Email is required.'
    } else if (!isEmailValid) {
      clientError = 'Enter a valid email address.'
    }
  }

  const serverError = activeState?.fieldErrors?.email
  const statusMessage =
    clientError ??
    serverError ??
    activeState?.message ??
    DEFAULT_STATUS_MESSAGE
  let buttonLabel = 'Join Waitlist'
  if (isPending) {
    buttonLabel = 'Joining...'
  } else if (isSuccess) {
    buttonLabel = 'Joined'
  } else if (isError) {
    buttonLabel = 'Try Again'
  }

  let statusClassName = s.statusHint
  if (clientError || serverError || isError) {
    statusClassName = s.statusError
  } else if (isSuccess) {
    statusClassName = s.statusSuccess
  }

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      onReset()
    }, SUCCESS_RESET_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isSuccess, onReset])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setHasTouched(true)

    if (!isEmailValid) {
      event.preventDefault()
      return
    }

    setSubmittedEmail(normalizedEmail)
  }

  return (
    <div className={s.formStack}>
      <form
        action={formAction}
        className={s.form}
        noValidate
        onSubmit={handleSubmit}
      >
        <label htmlFor="waitlist-email" className={s.srOnly}>
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          name="email"
          value={email}
          placeholder="Enter your email..."
          className={clsx(s.input, (clientError || serverError) && s.inputInvalid)}
          aria-describedby="waitlist-status"
          aria-invalid={clientError || serverError ? true : undefined}
          autoComplete="email"
          inputMode="email"
          enterKeyHint="send"
          onBlur={() => {
            setHasTouched(true)
          }}
          onChange={(event) => {
            setEmail(event.currentTarget.value)
          }}
        />
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          className={s.honeypot}
          aria-hidden="true"
        />
        <button
          type="submit"
          className={s.button}
          disabled={isPending || !isEmailValid || isSuccess}
        >
          {buttonLabel}
        </button>
      </form>

      <p
        id="waitlist-status"
        className={clsx(s.status, statusClassName)}
        role={clientError || serverError || isError ? 'alert' : 'status'}
        aria-live={clientError || serverError || isError ? 'assertive' : 'polite'}
      >
        {statusMessage}
      </p>
    </div>
  )
}
