'use client'

import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { ScrubTextReveal } from '@/components/effects/scrub-text-reveal'
import s from './persona.module.css'

const entrySteps = [
  {
    title: 'PLUG IN',
    description: 'Link your account once. We read your digital footprint.',
  },
  {
    title: 'RECOGNIZED',
    description: 'Your scattered activity becomes one universal digital status.',
  },
  {
    title: 'ENJOY',
    description: 'Benefits and privileges - waiting before you even look.',
  },
] as const

const personas = [
  {
    background: 'linear-gradient(180deg, #8b3a3a 0%, #6b2d2d 100%)',
    glyph: '独創',
    label: 'Creator',
  },
  {
    background: 'linear-gradient(180deg, #2d4a5b 0%, #1a3040 100%)',
    glyph: '探求',
    label: 'Explorer',
  },
  {
    background: 'linear-gradient(180deg, #594573 0%, #33264a 100%)',
    glyph: '反逆',
    label: 'Rebel',
  },
] as const

const products = [
  {
    eyebrow: 'Gravii ID',
    title: 'DIGITAL STATUS',
    description: 'Your profile attracts the right deals - opportunities come to you.',
  },
  {
    eyebrow: 'discovery',
    title: 'BORDERLESS BENEFITS',
    description: 'Finance to lifestyle, all optimized in one place.',
  },
  {
    eyebrow: 'My Space',
    title: 'PERSONAL CONCIERGE',
    description: 'Our engine curates what matters - before you even search.',
  },
] as const

const withoutGravii = [
  "Googling 'best yields' every morning",
  'Juggling platforms for scattered perks',
  'Browsing feeds hoping to find what fits',
] as const

export function Persona() {
  const [personaIndex, setPersonaIndex] = useState(2)
  const [isPreviewActive, setIsPreviewActive] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPreviewActive(entry?.isIntersecting ?? false)
      },
      {
        threshold: 0.1,
      }
    )

    observer.observe(sectionRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isPreviewActive) {
      return
    }

    const intervalId = window.setInterval(() => {
      setPersonaIndex((current) => (current + 1) % personas.length)
    }, 3000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isPreviewActive])

  useEffect(() => {
    if (!sectionRef.current) {
      return
    }

    const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
    const groups = Array.from(
      sectionRef.current.querySelectorAll<HTMLElement>('[data-reveal-group]')
    )
    let frameId = 0

    const setRevealState = (node: HTMLElement, opacity: number, yPercent: number) => {
      node.style.opacity = `${opacity}`
      node.style.transform = `translate3d(0, ${yPercent}%, 0)`
    }

    groups.forEach((group) => {
      const targets = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]'))
      targets.forEach((target) => {
        setRevealState(target, 0, 0)
      })
    })

    const syncFromViewport = () => {
      const viewportHeight = window.innerHeight

      groups.forEach((group) => {
        const targets = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]'))
        if (targets.length === 0) {
          return
        }

        targets.forEach((target) => {
          const bounds = target.getBoundingClientRect()
          if (bounds.top >= viewportHeight) {
            setRevealState(target, 0, 0)
            return
          }

          const revealDistance = viewportHeight * 0.68
          const progress = clamp01(
            (viewportHeight * 0.9 - bounds.top) / Math.max(1, revealDistance)
          )
          const resolvedProgress = progress >= 0.94 ? 1 : clamp01(progress * 0.92)
          setRevealState(target, resolvedProgress, 0)
        })
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

    scheduleSync()
    window.addEventListener('scroll', scheduleSync, { passive: true })
    window.addEventListener('resize', scheduleSync)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', scheduleSync)
      window.removeEventListener('resize', scheduleSync)
    }
  }, [])

  return (
    <section
      id="team"
      ref={sectionRef}
      className={s.section}
      data-header-theme="light"
    >
      <div className={s.surface}>
        <div className={s.inner}>
          <div className={s.stack}>
            <section className={s.group} data-reveal-group data-parallax>
              <div className={s.revealMask}>
                <ScrubTextReveal
                  as="h2"
                  className={s.headline}
                  text="One Gravii. Every door opens."
                />
              </div>

              <div className={s.stepStack}>
                {entrySteps.map((step) => (
                  <div key={step.title} className={s.revealMask}>
                    <article
                      className={`${s.panel} ${s.stepCard}`}
                      data-reveal
                    >
                      <h3 className={s.stepTitle}>{step.title}</h3>
                      <p className={s.bodyCopy}>{step.description}</p>
                    </article>
                  </div>
                ))}
              </div>
            </section>

            <section className={s.group} data-parallax>
              <div className={s.groupBlock} data-reveal-group>
                <div className={s.revealMask}>
                  <ScrubTextReveal
                    as="h2"
                    className={s.headline}
                    text="What changes for you?"
                  />
                </div>

                <div className={s.revealMask}>
                  <ScrubTextReveal
                    as="p"
                    className={`${s.eyebrow} ${s.withoutEyebrow}`}
                    text="With Gravii"
                  />
                </div>
              </div>

              <div className={s.groupBlock} data-reveal-group>
                <div className={s.comparisonGrid}>
                  <div className={s.revealMask}>
                    <article
                      className={`${s.panel} ${s.previewPanel}`}
                      data-reveal
                    >
                      {personas.map((persona, index) => (
                        <div
                          key={persona.label}
                          className={`${s.previewBackdrop} ${index === personaIndex ? s.isActive : ''}`}
                          style={{ background: persona.background }}
                          aria-hidden="true"
                        />
                      ))}

                      <div className={s.previewGlow} aria-hidden="true" />

                      <div className={s.previewContent}>
                        <div className={s.previewTop}>
                          <span className={s.previewIndex}>0{personaIndex + 1}</span>
                          <span className={s.previewMeta}>
                            Persona
                            <br />
                            Preview
                          </span>
                        </div>

                        <div className={s.previewMain}>
                          {personas.map((persona, index) => (
                            <div
                              key={`${persona.label}-copy`}
                              className={`${s.previewCopy} ${index === personaIndex ? s.isActive : ''}`}
                            >
                              <span className={s.previewGlyph}>{persona.glyph}</span>
                              <span className={s.previewLabel}>{persona.label}</span>
                            </div>
                          ))}
                        </div>

                        <div className={s.previewDots}>
                          {personas.map((persona, index) => (
                            <button
                              key={`${persona.label}-dot`}
                              type="button"
                              className={`${s.previewDot} ${index === personaIndex ? s.isSelected : ''}`}
                              onClick={() => setPersonaIndex(index)}
                              aria-label={`Show ${persona.label} preview`}
                            />
                          ))}
                        </div>
                      </div>
                    </article>
                  </div>

                  <div className={s.benefitStack}>
                    {products.map((product) => (
                      <div key={product.title} className={s.revealMask}>
                        <article
                          className={`${s.panel} ${s.benefitCard}`}
                          data-reveal
                        >
                          <span className={s.productEyebrow}>{product.eyebrow}</span>
                          <h3 className={s.benefitTitle}>{product.title}</h3>
                          <p className={s.benefitDescription}>{product.description}</p>
                        </article>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={s.groupBlock} data-reveal-group>
                <div className={s.revealMask}>
                  <ScrubTextReveal
                    as="p"
                    className={`${s.eyebrow} ${s.eyebrowMuted} ${s.withoutEyebrow}`}
                    text="Without Gravii"
                  />
                </div>

                <div className={s.revealMask}>
                  <div className={s.withoutPanel} data-reveal>
                    <div className={s.withoutGrid}>
                      {withoutGravii.map((item) => (
                        <article key={item} className={`${s.panel} ${s.withoutCard}`}>
                          <p className={s.withoutCopy}>{item}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
