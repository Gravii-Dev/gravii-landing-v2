'use client'

import clsx from 'clsx'
import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react'
import s from './mask-reveal.module.css'

type MaskRevealProps = {
  children: ReactNode
  className?: string | undefined
  innerClassName?: string | undefined
  start?: string
  delay?: number
  duration?: number
  completeAtPageEnd?: boolean
}

export function MaskReveal({
  children,
  className,
  innerClassName,
  start = 'top 85%',
  delay = 0,
  duration = 1.08,
  completeAtPageEnd = false,
}: MaskRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const inner = innerRef.current
    if (!(root && inner)) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      inner.style.opacity = '1'
      inner.style.transform = 'translate3d(0, 0%, 0)'
      return
    }

    let frameId = 0

    const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

    const setRevealState = (opacity: number, yPercent: number) => {
      inner.style.opacity = `${opacity}`
      inner.style.transform = `translate3d(0, ${yPercent}%, 0)`
    }

    setRevealState(0, 16)

    const syncFromViewport = () => {
      const bounds = root.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const viewportBottom = window.scrollY + viewportHeight

      if (completeAtPageEnd && viewportBottom >= documentHeight - 2) {
        setRevealState(1, 0)
        return
      }

      if (bounds.top >= viewportHeight) {
        setRevealState(0, 16)
        return
      }

      const match = /(\d+)%/.exec(start)
      const revealPoint = match ? Number(match[1]) : 85
      const revealDistance = viewportHeight * Math.max(0.2, revealPoint / 100)
      const progress = clamp01(
        (viewportHeight - bounds.top) / Math.max(1, revealDistance)
      )
      const typingProgress = clamp01(progress * 0.92)
      const resolvedProgress = progress >= 0.94 ? 1 : typingProgress

      setRevealState(resolvedProgress, (1 - resolvedProgress) * 16)
    }

    const scheduleSync = () => {
      if (frameId !== 0) {
        return
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        syncFromViewport()
      })
    }

    scheduleSync()
    window.addEventListener('scroll', scheduleSync, { passive: true })
    window.addEventListener('resize', scheduleSync)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', scheduleSync)
      window.removeEventListener('resize', scheduleSync)
    }
  }, [completeAtPageEnd, start])

  return (
    <div
      ref={rootRef}
      className={clsx(s.root, className)}
      style={
        {
          '--mask-reveal-delay': `${delay}s`,
          '--mask-reveal-duration': `${duration}s`,
        } as CSSProperties
      }
    >
      <div ref={innerRef} className={clsx(s.inner, innerClassName)}>
        {children}
      </div>
    </div>
  )
}
