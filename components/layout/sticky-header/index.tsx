'use client'

import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link } from '@/components/ui/link'
import s from './sticky-header.module.css'

const ORBIT_CURSORS = [
  ...Array.from({ length: 6 }, (_, index) => {
    const angle = (360 / 6) * index
    return {
      id: `outer-${angle}`,
      angle,
      radius: 82,
      delay: index * 18,
      rotation: angle + 22,
    }
  }),
  ...Array.from({ length: 8 }, (_, index) => {
    const angle = (360 / 8) * index + 12
    return {
      id: `inner-${angle}`,
      angle,
      radius: 108,
      delay: 48 + index * 16,
      rotation: angle + 22,
    }
  }),
] as const

function MousePointerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={s.cursorGlyph}>
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

type HeaderPillProps = {
  href: string
  label: string
  className: string
  onClick?: ((event: ReactMouseEvent<HTMLElement>) => void) | undefined
  ariaDisabled?: boolean | undefined
}

function HeaderPill({
  href,
  label,
  className,
  onClick,
  ariaDisabled = false,
}: HeaderPillProps) {
  return (
    <Link
      href={href}
      className={className}
      aria-disabled={ariaDisabled || undefined}
      {...(onClick ? { onClick } : {})}
    >
      <span className={s.pillOrbit} aria-hidden="true">
        <span className={s.pillPulse} />
        <span className={s.cursorOrbit}>
          {ORBIT_CURSORS.map((cursor) => (
            <span
              key={cursor.id}
              className={s.cursorItem}
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
      <span className={s.pillBody}>
        <span className={s.pillSurface} aria-hidden="true" />
        <span className={s.pillText}>{label}</span>
      </span>
    </Link>
  )
}

export function StickyHeader() {
  const [isVisible, setIsVisible] = useState(true)
  const [usesLightText, setUsesLightText] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    let frameId = 0

    const syncHeader = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScrollYRef.current = currentScrollY

      const header = headerRef.current
      if (!header) {
        return
      }

      const bounds = header.getBoundingClientRect()
      const sampleX = window.innerWidth * 0.5
      const sampleY = Math.max(
        8,
        Math.min(bounds.top + bounds.height * 0.5, window.innerHeight - 8)
      )
      const stack = document.elementsFromPoint(sampleX, sampleY)

      let nextUsesLightText = false

      for (const element of stack) {
        if (header.contains(element)) {
          continue
        }

        const themedParent = element.closest('[data-header-theme]')
        if (themedParent instanceof HTMLElement) {
          nextUsesLightText = themedParent.dataset.headerTheme === 'light'
          break
        }
      }

      setUsesLightText(nextUsesLightText)
    }

    const handleScroll = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(syncHeader)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    syncHeader()

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <header
      ref={headerRef}
      className={`${s.root} ${!isVisible ? s.isHidden : ''} ${usesLightText ? s.lightText : ''}`.trim()}
    >
      {/* Left Area: Logo and Nav Menu */}
      <div className={s.leftGroup}>
        <Link href="#hero" className={s.logoLink}>
          GRAVII
        </Link>

        <nav className={s.nav}>
          <HeaderPill
            href="#about"
            label="ABOUT"
            className={`${s.pillLink} ${s.navLink}`}
          />
          <HeaderPill
            href="#team"
            label="TEAM"
            className={`${s.pillLink} ${s.navLink}`}
          />
        </nav>
      </div>

      {/* Right Area: Action Button */}
      <div>
        <HeaderPill
          href="#"
          label="LAUNCH APP"
          className={`${s.pillLink} ${s.actionLink}`}
          onClick={(e) => e.preventDefault()}
          ariaDisabled
        />
      </div>
    </header>
  )
}
