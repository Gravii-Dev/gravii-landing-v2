import { MaskReveal } from '@/components/effects/mask-reveal'
import { WaitlistForm } from './form'
import s from './waitlist.module.css'

export function Waitlist() {
  return (
    <section
      id="waitlist"
      className={s.section}
    >
      <div className={s.inner}>
        <MaskReveal className={s.titleReveal}>
          <h2 className={s.title}>We search. Your lifestyle. Live different.</h2>
        </MaskReveal>

        <MaskReveal className={s.formReveal} delay={0.08}>
          <WaitlistForm />
        </MaskReveal>
      </div>
    </section>
  )
}
