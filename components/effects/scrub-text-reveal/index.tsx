'use client'

import clsx from 'clsx'
import { createElement, useEffect, useRef, type HTMLAttributes } from 'react'
import s from './scrub-text-reveal.module.css'

type ScrubTextRevealProps = {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  text: string
  className?: string | undefined
  completeAtPageEnd?: boolean
} & Omit<HTMLAttributes<HTMLElement>, 'children'>

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function setRevealState(node: HTMLElement, opacity: number, yPercent: number) {
  node.style.opacity = `${opacity}`
  node.style.transform = `translate3d(0, ${yPercent}%, 0)`
}

export function ScrubTextReveal({
  as = 'p',
  text,
  className,
  completeAtPageEnd = false,
  ...props
}: ScrubTextRevealProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])

  const tokens = (() => {
    const seen: Record<string, number> = {}
    let motionIndex = 0

    return text.split(/(\n|\s+)/).filter(Boolean).map((part) => {
      if (part === '\n') {
        const next = (seen.break ?? 0) + 1
        seen.break = next

        return {
          type: 'break' as const,
          key: `break-${next}`,
        }
      }

      if (/^\s+$/.test(part)) {
        const next = (seen.space ?? 0) + 1
        seen.space = next

        return {
          type: 'space' as const,
          key: `space-${next}`,
          value: part,
        }
      }

      const chars = Array.from(part).map((char) => {
        const next = (seen[char] ?? 0) + 1
        seen[char] = next

        return {
          char,
          key: `${char}-${next}`,
          motionIndex: motionIndex++,
        }
      })

      const next = (seen.word ?? 0) + 1
      seen.word = next

      return {
        type: 'word' as const,
        key: `word-${next}`,
        chars,
      }
    })
  })()

  useEffect(() => {
    const root = rootRef.current
    const expectedNodeCount = Array.from(text).reduce((count, char) => {
      return /\s/.test(char) ? count : count + 1
    }, 0)
    const nodes = charRefs.current
      .filter((node): node is HTMLSpanElement => Boolean(node))
      .slice(0, expectedNodeCount)

    if (!(root && nodes.length > 0)) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((node) => {
        setRevealState(node, 1, 0)
      })
      return
    }

    let frameId = 0
    let lastVisibleCount = -1

    nodes.forEach((node) => {
      setRevealState(node, 0, 16)
    })

    const syncFromViewport = () => {
      const bounds = root.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const viewportBottom = window.scrollY + viewportHeight

      if (completeAtPageEnd && viewportBottom >= documentHeight - 2) {
        if (lastVisibleCount !== nodes.length) {
          nodes.forEach((node) => {
            setRevealState(node, 1, 0)
          })
          lastVisibleCount = nodes.length
        }
        return
      }

      if (bounds.top >= viewportHeight) {
        if (lastVisibleCount !== 0) {
          nodes.forEach((node) => {
            setRevealState(node, 0, 16)
          })
          lastVisibleCount = 0
        }
        return
      }

      const revealDistance = viewportHeight * 0.52
      const progress = clamp01(
        (viewportHeight - bounds.top) / Math.max(1, revealDistance)
      )
      const typingProgress = clamp01(progress * 0.92)
      const resolvedProgress = progress >= 0.94 ? 1 : typingProgress
      const visibleCount = Math.floor(resolvedProgress * (nodes.length + 1))

      if (visibleCount !== lastVisibleCount) {
        nodes.forEach((node, index) => {
          const isVisible = index < visibleCount
          setRevealState(node, isVisible ? 1 : 0, isVisible ? 0 : 16)
        })
        lastVisibleCount = visibleCount
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

    scheduleSync()
    window.addEventListener('scroll', scheduleSync, { passive: true })
    window.addEventListener('resize', scheduleSync)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', scheduleSync)
      window.removeEventListener('resize', scheduleSync)
    }
  }, [completeAtPageEnd, text])

  return createElement(
    as,
    {
      ...props,
      ref: rootRef,
      className: clsx(className),
    },
    tokens.map((token) => {
      if (token.type === 'break') {
        return <br key={token.key} />
      }

      if (token.type === 'space') {
        return (
          <span key={token.key} className={s.space}>
            {'\u00A0'}
          </span>
        )
      }

      return (
        <span key={token.key} className={s.word}>
          {token.chars.map((item) => (
            <span
              key={item.key}
              className={s.char}
              ref={(node) => {
                if (!node) {
                  return
                }
                charRefs.current[item.motionIndex] = node
              }}
            >
              {item.char}
            </span>
          ))}
        </span>
      )
    })
  )
}
