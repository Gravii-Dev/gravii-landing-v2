'use client'

import { useEffect } from 'react'
import { Wrapper } from '@/components/layout/wrapper'
import { Link } from '@/components/ui/link'
import s from './error.module.css'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <Wrapper theme="light" className={s.wrapperFont} webgl>
      <div className={s.container}>
        <h1 className={s.title}>Something went wrong</h1>
        <p className={s.description}>
          We're sorry, but something unexpected happened. Please try again.
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
          <Link href="/" className={s.secondaryButton}>
            Go Home
          </Link>
        </div>
      </div>
    </Wrapper>
  )
}
