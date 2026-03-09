import type { CSSProperties } from 'react'
import { Link } from '@/components/ui/link'
import s from './hero.module.css'
import { HeroBackground } from './hero-background'

const CTA_ORBIT_CURSORS = [
  ...Array.from({ length: 5 }, (_, index) => {
    const angle = (360 / 5) * index
    return {
      id: `outer-${angle}`,
      angle,
      radius: 76,
      delay: index * 18,
      rotation: angle + 22,
    }
  }),
  ...Array.from({ length: 6 }, (_, index) => {
    const angle = (360 / 6) * index + 10
    return {
      id: `inner-${angle}`,
      angle,
      radius: 98,
      delay: 42 + index * 18,
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
  return (
    <section id="hero" className={s.section}>
      <HeroBackground />
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
