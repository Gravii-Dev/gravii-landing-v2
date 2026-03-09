'use client'

import clsx from 'clsx'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import s from './mask-reveal.module.css'

type MaskRevealProps = {
  children: ReactNode
  className?: string | undefined
  innerClassName?: string | undefined
  start?: string
  delay?: number
  duration?: number
}

export function MaskReveal({
  children,
  className,
  innerClassName,
  start = 'top 85%',
  delay = 0,
  duration = 1.08,
}: MaskRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }

    const match = /(\d+)%/.exec(start)
    const revealPoint = match ? Number(match[1]) : 85
    const rootMargin = `0px 0px -${Math.max(0, 100 - revealPoint)}% 0px`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }
        setIsVisible(true)
        observer.disconnect()
      },
      {
        threshold: 0,
        rootMargin,
      }
    )

    observer.observe(root)

    return () => observer.disconnect()
  }, [start])

  return (
    <div
      ref={rootRef}
      className={clsx(s.root, className, isVisible && s.isVisible)}
      style={
        {
          '--mask-reveal-delay': `${delay}s`,
          '--mask-reveal-duration': `${duration}s`,
        } as CSSProperties
      }
    >
      <div className={clsx(s.inner, innerClassName)}>
        {children}
      </div>
    </div>
  )
}
