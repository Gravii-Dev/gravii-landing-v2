'use client'

import { useEffect, useRef } from 'react'
import { ScrubTextReveal } from '@/components/effects/scrub-text-reveal'
import s from './intro-one.module.css'

const INTRO_ONE_TITLE = 'Tired of starting from zero?'
const INTRO_ONE_CARDS = [
  { key: 'signup', title: 'SIGN UP.', subtitle: 'again.' },
  { key: 'verify', title: 'VERIFY.', subtitle: 'again.' },
  { key: 'prove', title: 'PROVE.', subtitle: 'again.' },
] as const

const INTRO_ONE_CHARS = (() => {
  const seen: Record<string, number> = {}
  let motionIndex = 0

  return Array.from(INTRO_ONE_TITLE).map((char) => {
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

function setRevealState(node: HTMLElement, opacity: number, yPercent: number) {
  node.style.opacity = `${opacity}`
  node.style.transform = `translate3d(0, ${yPercent}%, 0)`
}

export function IntroOne() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardsWrapRef = useRef<HTMLDivElement>(null)
  const charRefs = useRef<HTMLSpanElement[]>([])
  const cardRefs = useRef<HTMLElement[]>([])

  useEffect(() => {
    const cardNodes = cardRefs.current.filter(Boolean)

    if (
      !(
        sectionRef.current &&
        titleRef.current &&
        cardsWrapRef.current &&
        charRefs.current.length > 0 &&
        cardNodes.length > 0
      )
    ) {
      return
    }

    let frameId = 0
    let lastVisibleCount = -1

    charRefs.current.forEach((node) => {
      setRevealState(node, 0, 16)
    })
      cardNodes.forEach((node) => {
        setRevealState(node, 0, 0)
      })

    const syncFromViewport = () => {
      if (
        !(
          sectionRef.current &&
          titleRef.current &&
          cardsWrapRef.current &&
          charRefs.current.length > 0 &&
          cardNodes.length > 0
        )
      ) {
        return
      }

      const titleBounds = titleRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      if (titleBounds.top >= viewportHeight) {
        if (lastVisibleCount !== 0) {
          charRefs.current.forEach((node) => {
            setRevealState(node, 0, 16)
          })
          lastVisibleCount = 0
        }
        return
      }

      const revealDistance = viewportHeight * 0.52
      const progress = clamp01(
        (viewportHeight - titleBounds.top) / Math.max(1, revealDistance)
      )
      const typingProgress = clamp01(progress * 0.92)
      const resolvedProgress = progress >= 0.94 ? 1 : typingProgress
      const visibleCount = Math.floor(
        resolvedProgress * (charRefs.current.length + 1)
      )

      if (visibleCount !== lastVisibleCount) {
        charRefs.current.forEach((node, index) => {
          const isVisible = index < visibleCount

          setRevealState(node, isVisible ? 1 : 0, isVisible ? 0 : 16)
        })

        lastVisibleCount = visibleCount
      }

      const cardsBounds = cardsWrapRef.current.getBoundingClientRect()
      const cardsProgress = clamp01(
        (viewportHeight * 0.9 - cardsBounds.top) / Math.max(1, viewportHeight * 0.85)
      )

      cardNodes.forEach((node, index) => {
        const local = clamp01((cardsProgress - index * 0.17) / 0.52)

        setRevealState(node, local, 0)
      })
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
      id="about"
      ref={sectionRef}
      className={s.section}
    >
      <div className={s.stage}>
        <h2 ref={titleRef} className={s.title}>
          {INTRO_ONE_CHARS.map((item) =>
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
        </h2>

        <div ref={cardsWrapRef} className={s.cards}>
          {INTRO_ONE_CARDS.map((card, index) => (
            <article
              key={card.key}
              className={s.card}
              ref={(node) => {
                if (!node) return
                cardRefs.current[index] = node
              }}
            >
              <ScrubTextReveal as="p" className={s.cardTitle} text={card.title} />
              <ScrubTextReveal as="p" className={s.cardSubtitle} text={card.subtitle} />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
