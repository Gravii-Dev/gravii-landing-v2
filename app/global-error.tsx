'use client'

import { useEffect } from 'react'
import { Wrapper } from '@/components/layout/wrapper'
import s from './global-error.module.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <Wrapper theme="light" className={s.wrapperFont} webgl>
      <div className={s.container}>
        <h1 className={s.title}>Critical Error</h1>
        <p className={s.description}>
          A critical error occurred. Please refresh the page or contact support
          if the problem persists.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className={s.details}>
            <summary className={s.summary}>
              Error Details (Development Only)
            </summary>
            <pre className={s.pre}>
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className={s.actions}>
          <button
            onClick={reset}
            type="button"
            className={s.primaryButton}
          >
            Try Again
          </button>
          <button
            onClick={() => {
              window.location.href = '/'
            }}
            type="button"
            className={s.secondaryButton}
          >
            Go Home
          </button>
        </div>
      </div>
    </Wrapper>
  )
}
