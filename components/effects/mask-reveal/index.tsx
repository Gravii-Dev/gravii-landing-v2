'use client'

import clsx from 'clsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import { type ReactNode, useEffect, useRef } from 'react'
import s from './mask-reveal.module.css'

type MaskRevealProps = {
  children: ReactNode
  className?: string | undefined
  innerClassName?: string | undefined
  start?: string
  delay?: number
  duration?: number
}

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
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
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!(rootRef.current && innerRef.current)) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.set(innerRef.current, {
        yPercent: 112,
        skewY: 7,
        transformOrigin: '0% 100%',
        willChange: 'transform',
      })

      gsap.to(innerRef.current, {
        yPercent: 0,
        skewY: 0,
        delay,
        duration,
        ease: 'power4.out',
        clearProps: 'willChange',
        scrollTrigger: {
          trigger: rootRef.current,
          start,
          toggleActions: 'play none none reverse',
        },
      })
    }, rootRef)

    return () => {
      ctx.revert()
    }
  }, [delay, duration, start])

  return (
    <div ref={rootRef} className={clsx(s.root, className)}>
      <div ref={innerRef} className={clsx(s.inner, innerClassName)}>
        {children}
      </div>
    </div>
  )
}
