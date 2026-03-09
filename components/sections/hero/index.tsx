'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from '@/components/ui/link'
import s from './hero.module.css'
import { HeroBackground } from './hero-background'

const SPLASH_EXIT_DURATION_MS = 520

const CTA_ORBIT_CURSORS = [
  ...Array.from({ length: 4 }, (_, index) => {
    const angle = (360 / 4) * index
    return {
      id: `outer-${angle}`,
      angle,
      radius: 76,
      delay: index * 22,
      rotation: angle + 22,
    }
  }),
  ...Array.from({ length: 4 }, (_, index) => {
    const angle = (360 / 4) * index + 14
    return {
      id: `inner-${angle}`,
      angle,
      radius: 98,
      delay: 46 + index * 22,
      rotation: angle + 22,
    }
  }),
] as const

function MousePointerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={s.ctaCursorGlyph}>
      <path
        d="M4.5 3.5L10.4 17.8L12.7 12.7L17.8 10.4L4.5 3.5Z"
        fill="currentColor"
      />
      <path
        d="M12.1 12.1L19 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Hero() {
  const [splashPhase, setSplashPhase] = useState<'visible' | 'leaving' | 'hidden'>('visible')
  const splashPhaseRef = useRef<'visible' | 'leaving' | 'hidden'>('visible')
  const hasSettledRef = useRef(false)
  const exitTimerRef = useRef<number>(0)

  const clearSplashTimers = useCallback(() => {
    window.clearTimeout(exitTimerRef.current)
  }, [])

  const beginSplashExit = useCallback(() => {
    if (splashPhaseRef.current !== 'visible') {
      return
    }

    splashPhaseRef.current = 'leaving'
    setSplashPhase('leaving')
    exitTimerRef.current = window.setTimeout(() => {
      splashPhaseRef.current = 'hidden'
      setSplashPhase('hidden')
    }, SPLASH_EXIT_DURATION_MS)
  }, [])

  const handleHeroSettled = useCallback(() => {
    if (hasSettledRef.current) {
      return
    }

    hasSettledRef.current = true
    beginSplashExit()
  }, [beginSplashExit])

  useEffect(() => {
    return () => {
      clearSplashTimers()
    }
  }, [clearSplashTimers])

  useEffect(() => {
    splashPhaseRef.current = splashPhase
  }, [splashPhase])

  useEffect(() => {
    if (splashPhase === 'hidden') {
      return
    }

    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
    }
  }, [splashPhase])

  return (
    <section id="hero" className={s.section}>
      {splashPhase !== 'hidden' ? (
        <div
          className={`${s.splash} ${splashPhase === 'leaving' ? s.splashLeaving : ''}`}
        >
          <p className={s.splashTitle}>
            <span className={s.splashLine}>Welcome to</span>
            <span className={s.splashLine}>Gravii</span>
          </p>
        </div>
      ) : null}
      <HeroBackground onSettled={handleHeroSettled} />
      <div className={s.overlay}>
        <h1 className={s.label}>
          <span className={s.line}>Connect</span>
          <span className={`${s.line} ${s.lineOffset}`}>once,</span>
          <span className={s.line}>Live</span>
          <span className={`${s.line} ${s.lineOffset}`}>differently</span>
        </h1>
        <p className={s.subtitle}>
          &quot;WE&apos;VE BURNT THE OLD PLAYBOOK&quot;
        </p>
        <Link href="#waitlist" className={s.ctaButton}>
          <span className={s.ctaOrbit} aria-hidden="true">
            <span className={s.ctaPulse} />
            <span className={s.ctaCursorOrbit}>
              {CTA_ORBIT_CURSORS.map((cursor) => (
                <span
                  key={cursor.id}
                  className={s.ctaCursorItem}
                  style={
                    {
                      '--cursor-angle': `${cursor.angle}deg`,
                      '--cursor-radius': `${cursor.radius}px`,
                      '--cursor-delay': `${cursor.delay}ms`,
                      '--cursor-rotation': `${cursor.rotation}deg`,
                    } as CSSProperties
                  }
                >
                  <MousePointerIcon />
                </span>
              ))}
            </span>
          </span>
          <span className={s.ctaButtonBody}>
            <span className={s.ctaButtonText}>JOIN WAITLIST</span>
          </span>
        </Link>
      </div>
    </section>
  )
}
