'use client'

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

function setCharacterState(node: HTMLElement, opacity: number, yPercent: number) {
  node.style.opacity = `${opacity}`
  node.style.transform = `translate3d(0, ${yPercent}%, 0)`
}

const ALERT_CARD_VISIBLE_CLASS = s.alertCardVisible ?? 'alertCardVisible'

export function IntroTwo() {
  const sectionRef = useRef<HTMLElement>(null)
  const textLineRef = useRef<HTMLParagraphElement>(null)
  const charRefs = useRef<HTMLSpanElement[]>([])
  const tailRef = useRef<HTMLSpanElement>(null)
  const alertCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sectionNode = sectionRef.current
    const textLineNode = textLineRef.current
    const tailNode = tailRef.current
    const alertCardNode = alertCardRef.current

    if (
      !(
        sectionNode &&
        textLineNode &&
        charRefs.current.length > 0 &&
        tailNode &&
        alertCardNode
      )
    ) {
      return
    }

    let frameId = 0
    let lastVisibleCount = -1

    charRefs.current.forEach((node) => {
      setCharacterState(node, 0, 18)
    })
    tailNode.style.opacity = '0'
    alertCardNode.classList.remove(ALERT_CARD_VISIBLE_CLASS)

    const syncFromViewport = () => {
      if (
        !(
          sectionNode &&
          textLineNode &&
          charRefs.current.length > 0 &&
          alertCardNode
        )
      ) {
        return
      }

      const textBounds = textLineNode.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      const activationLine = viewportHeight * 1.03

      // Start just before the entire line fully settles in view so the typing
      // response feels a touch less delayed.
      if (textBounds.bottom > activationLine) {
        if (lastVisibleCount !== 0) {
          charRefs.current.forEach((node) => {
            setCharacterState(node, 0, 18)
          })
          tailNode.style.opacity = '0'
          lastVisibleCount = 0
        }

        alertCardNode.classList.remove(ALERT_CARD_VISIBLE_CLASS)
        return
      }

      const revealDistance = viewportHeight * 0.5
      const progress = clamp01(
        (activationLine - textBounds.bottom) / Math.max(1, revealDistance)
      )
      const typingProgress = clamp01(progress * 1.08)
      const resolvedProgress = progress >= 0.8 ? 1 : typingProgress
      const visibleCount = Math.floor(
        resolvedProgress * (charRefs.current.length + 1)
      )

      if (visibleCount !== lastVisibleCount) {
        charRefs.current.forEach((node, index) => {
          const isVisible = index < visibleCount

          setCharacterState(node, isVisible ? 1 : 0, isVisible ? 0 : 18)
        })

        lastVisibleCount = visibleCount
      }

      tailNode.style.opacity = progress > 0 ? '1' : '0'

      const shouldShowCard = resolvedProgress >= 0.94
      alertCardNode.classList.toggle(ALERT_CARD_VISIBLE_CLASS, shouldShowCard)
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
