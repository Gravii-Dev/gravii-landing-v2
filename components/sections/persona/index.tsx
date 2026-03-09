'use client'

import { useEffect, useState } from 'react'
import { useRef } from 'react'
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
    eyebrow: 'Launch Bay',
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

    let observer: IntersectionObserver | null = null
    let isDisposed = false
    let ctx: { revert: () => void } | null = null

    const initAnimations = async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])

      if (isDisposed || !sectionRef.current) {
        return
      }

      gsap.registerPlugin(ScrollTrigger)

      ctx = gsap.context(() => {
        const groups = gsap.utils.toArray<HTMLElement>('[data-reveal-group]')

        groups.forEach((group) => {
          const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]', group)
          if (targets.length === 0) {
            return
          }

          gsap.set(targets, {
            yPercent: 110,
            skewY: 7,
            transformOrigin: '0% 100%',
            willChange: 'transform',
          })

          gsap.timeline({
            defaults: {
              duration: 1.18,
              ease: 'power4.out',
            },
            scrollTrigger: {
              trigger: group,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }).to(targets, {
            yPercent: 0,
            skewY: 0,
            stagger: 0.1,
            clearProps: 'willChange',
          })
        })

        const parallaxTargets = gsap.utils.toArray<HTMLElement>('[data-parallax]')

        parallaxTargets.forEach((target, index) => {
          const depth = 7 + (index % 3) * 2

          gsap.fromTo(
            target,
            { yPercent: depth },
            {
              yPercent: -depth * 0.45,
              ease: 'none',
              scrollTrigger: {
                trigger: target,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          )
        })
      }, sectionRef)
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        observer?.disconnect()
        observer = null
        void initAnimations()
      },
      {
        threshold: 0.01,
        rootMargin: '120% 0px',
      }
    )

    observer.observe(sectionRef.current)

    return () => {
      isDisposed = true
      observer?.disconnect()
      ctx?.revert()
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
                <h2 className={s.headline} data-reveal>
                  One Gravii. Every door opens.
                </h2>
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
                  <h2 className={s.headline} data-reveal>
                    What changes for you?
                  </h2>
                </div>

                <div className={s.revealMask}>
                  <p className={s.eyebrow} data-reveal>
                    With Gravii
                  </p>
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
                  <p
                    className={`${s.eyebrow} ${s.eyebrowMuted} ${s.withoutEyebrow}`}
                    data-reveal
                  >
                    Without Gravii
                  </p>
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
