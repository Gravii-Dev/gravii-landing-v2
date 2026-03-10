import { MaskReveal } from '@/components/effects/mask-reveal'
import { ScrubTextReveal } from '@/components/effects/scrub-text-reveal'
import { WaitlistForm } from './form'
import s from './waitlist.module.css'

export function Waitlist() {
  return (
    <section
      id="waitlist"
      className={s.section}
    >
      <div className={s.inner}>
        <div className={s.titleReveal}>
          <ScrubTextReveal
            as="h2"
            className={s.title}
            completeAtPageEnd
            text={`We search.\nYour lifestyle.\nLive different.`}
          />
        </div>

        <MaskReveal className={s.formReveal} delay={0.08} completeAtPageEnd>
          <WaitlistForm />
        </MaskReveal>
      </div>
    </section>
  )
}
