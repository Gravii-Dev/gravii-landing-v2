'use client'

import { useEffect, useRef } from 'react'
import s from './intro-two.module.css'

const INTRO_TWO_COPY = 'OVER AND OVER'
const TYPE_STEP_MS = 88
const DELETE_STEP_MS = 52
const HOLD_FULL_MS = 860
const HOLD_EMPTY_MS = 220
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

function setCharacterState(node: HTMLElement, opacity: number, yPercent: number) {
  node.style.opacity = `${opacity}`
  node.style.transform = `translate3d(0, ${yPercent}%, 0)`
}

export function IntroTwo() {
  const sectionRef = useRef<HTMLElement>(null)
  const textLineRef = useRef<HTMLParagraphElement>(null)
  const charRefs = useRef<HTMLSpanElement[]>([])
  const tailRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const sectionNode = sectionRef.current
    const textLineNode = textLineRef.current
    const tailNode = tailRef.current

    if (
      !(
        sectionNode &&
        textLineNode &&
        charRefs.current.length > 0 &&
        tailNode
      )
    ) {
      return
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const totalCharacters = charRefs.current.length
    let timeoutId = 0
    let isDisposed = false
    let isActive = false
    let visibleCount = 0
    let phase: 'typing' | 'deleting' = 'typing'

    const applyVisibleCount = (count: number) => {
      visibleCount = count
      charRefs.current.forEach((node, index) => {
        const isVisible = index < count
        setCharacterState(node, isVisible ? 1 : 0, isVisible ? 0 : 18)
      })

      tailNode.style.opacity = isActive ? '1' : '0'
    }

    const clearAnimation = () => {
      window.clearTimeout(timeoutId)
    }

    const resetLoop = () => {
      phase = 'typing'
      applyVisibleCount(0)
      tailNode.style.opacity = '0'
    }

    const scheduleNextStep = (delay: number) => {
      clearAnimation()
      timeoutId = window.setTimeout(stepLoop, delay)
    }

    const stepLoop = () => {
      if (isDisposed || !isActive) {
        return
      }

      if (phase === 'typing') {
        const nextCount = Math.min(totalCharacters, visibleCount + 1)
        applyVisibleCount(nextCount)

        if (nextCount >= totalCharacters) {
          phase = 'deleting'
          scheduleNextStep(HOLD_FULL_MS)
          return
        }

        scheduleNextStep(TYPE_STEP_MS)
        return
      }

      const nextCount = Math.max(0, visibleCount - 1)
      applyVisibleCount(nextCount)

      if (nextCount <= 0) {
        phase = 'typing'
        scheduleNextStep(HOLD_EMPTY_MS)
        return
      }

      scheduleNextStep(DELETE_STEP_MS)
    }

    if (prefersReducedMotion) {
      isActive = true
      applyVisibleCount(totalCharacters)
      tailNode.style.opacity = '1'
      return () => {
        clearAnimation()
      }
    }

    resetLoop()

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextIsActive = entry?.isIntersecting ?? false

        if (nextIsActive === isActive) {
          return
        }

        isActive = nextIsActive

        if (!isActive) {
          clearAnimation()
          resetLoop()
          return
        }

        scheduleNextStep(HOLD_EMPTY_MS)
      },
      {
        threshold: 0.38,
      }
    )

    observer.observe(sectionNode)

    return () => {
      isDisposed = true
      clearAnimation()
      observer.disconnect()
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
        {/* <div ref={alertCardRef} className={s.alertCard}>
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
        </div> */}
      </div>
    </section>
  )
}
