'use client'

import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import s from './intro-two.module.css'

const INTRO_TWO_COPY = 'OVER AND OVER'
const INTRO_TWO_CHARS = (() => {
  const seen: Record<string, number> = {}
  let motionIndex = 0

  return Array.from(INTRO_TWO_COPY).map((char) => {
    const token = char === ' ' ? 'space' : char
    const next = (seen[token] ?? 0) + 1
    seen[token] = next

    return {
      char,
      key: `${token}-${next}`,
      motionIndex: char === ' ' ? -1 : motionIndex++,
    }
  })
})()

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function IntroTwo() {
  const sectionRef = useRef<HTMLElement>(null)
  const textLineRef = useRef<HTMLParagraphElement>(null)
  const charRefs = useRef<HTMLSpanElement[]>([])
  const tailRef = useRef<HTMLSpanElement>(null)
  const alertCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (
      !(
        sectionRef.current &&
        textLineRef.current &&
        charRefs.current.length > 0 &&
        tailRef.current &&
        alertCardRef.current
      )
    ) {
      return
    }

    let frameId = 0
    let lastVisibleCount = -1

    gsap.set(charRefs.current, { opacity: 0, yPercent: 18 })
    gsap.set(tailRef.current, { opacity: 0 })
    gsap.set(alertCardRef.current, {
      autoAlpha: 0,
      scaleX: 0.88,
      scaleY: 1.16,
      xPercent: 10,
      yPercent: -146,
      rotate: 22,
      transformOrigin: '100% 100%',
    })

    const cardTimeline = gsap
      .timeline({ paused: true })
      .to(alertCardRef.current, {
        autoAlpha: 1,
        scaleX: 1.14,
        scaleY: 0.74,
        xPercent: -3,
        yPercent: 22,
        rotate: 1,
        duration: 0.32,
        ease: 'power4.in',
      })
      .to(
        alertCardRef.current,
        {
          scaleX: 0.97,
          scaleY: 1.08,
          xPercent: 1,
          yPercent: -12,
          rotate: 14,
          duration: 0.18,
          ease: 'power2.out',
        },
        '>'
      )
      .to(
        alertCardRef.current,
        {
          scaleX: 1,
          scaleY: 1,
          xPercent: 0,
          yPercent: 0,
          rotate: 10,
          duration: 0.34,
          ease: 'expo.out',
        },
        '>'
      )

    const syncFromViewport = () => {
      if (
        !(
          sectionRef.current &&
          textLineRef.current &&
          charRefs.current.length > 0 &&
          alertCardRef.current
        )
      ) {
        return
      }

      const textBounds = textLineRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      // Start only when the whole text line is visible in viewport.
      if (textBounds.bottom > viewportHeight) {
        if (lastVisibleCount !== 0) {
          charRefs.current.forEach((node) => {
            gsap.set(node, { opacity: 0, yPercent: 18 })
          })
          gsap.set(tailRef.current, { opacity: 0 })
          lastVisibleCount = 0
        }

        if (!cardTimeline.reversed() && cardTimeline.progress() > 0) {
          cardTimeline.timeScale(1.12).reverse()
        }
        return
      }

      const revealDistance = viewportHeight * 0.62
      const progress = clamp01(
        (viewportHeight - textBounds.bottom) / Math.max(1, revealDistance)
      )
      const typingProgress = clamp01(progress * 0.9)
      const resolvedProgress = progress >= 0.92 ? 1 : typingProgress
      const visibleCount = Math.floor(
        resolvedProgress * (charRefs.current.length + 1)
      )

      if (visibleCount !== lastVisibleCount) {
        charRefs.current.forEach((node, index) => {
          const isVisible = index < visibleCount

          gsap.set(node, {
            opacity: isVisible ? 1 : 0,
            yPercent: isVisible ? 0 : 18,
          })
        })

        lastVisibleCount = visibleCount
      }

      gsap.set(tailRef.current, {
        opacity: progress > 0 ? 1 : 0,
      })

      const shouldShowCard = resolvedProgress >= 1
      if (shouldShowCard) {
        if (cardTimeline.reversed() || cardTimeline.progress() < 1) {
          cardTimeline.timeScale(1).play()
        }
      } else if (!cardTimeline.reversed() && cardTimeline.progress() > 0) {
        cardTimeline.timeScale(1.12).reverse()
      }
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

    const handleScroll = () => {
      scheduleSync()
    }

    scheduleSync()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <section
      id="intro-two"
      ref={sectionRef}
      className={s.section}
    >
      <h2 className={s.srOnly}>Intro two</h2>
      <div className={s.stage} aria-hidden="true">
        <p ref={textLineRef} className={s.text}>
          {INTRO_TWO_CHARS.map((item) =>
            item.char === ' ' ? (
              <span key={item.key} className={s.space}>
                {'\u00A0'}
              </span>
            ) : (
              <span
                key={item.key}
                className={s.char}
                ref={(node) => {
                  if (!node) return
                  charRefs.current[item.motionIndex] = node
                }}
              >
                {item.char}
              </span>
            )
          )}
          <span ref={tailRef} className={s.tail}>
            <span className={s.blinkDot}>.</span>
          </span>
        </p>
        <div ref={alertCardRef} className={s.alertCard}>
          <div className={s.alertNoise} />
          <div className={s.alertHeader}>
            <span className={s.alertTitle}>No profile found</span>
            <span className={s.alertClose}>×</span>
          </div>
          <div className={s.alertWarning}>
            <span className={s.alertWarningCopy}>
              {'⚠ 1,847 transactions across 7 chains. Zero recognition. Zero perks. Zero status.'}
            </span>
          </div>
          <div className={s.alertWallet}>
            <span className={s.alertLabel}>Wallet</span>
            <span className={s.alertValue}>0x71C...9A21 — unlinked</span>
          </div>
        </div>
      </div>
    </section>
  )
}
