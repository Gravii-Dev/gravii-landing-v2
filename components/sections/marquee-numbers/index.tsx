import { MaskReveal } from '@/components/effects/mask-reveal'
import s from './marquee-numbers.module.css'

const STATS = [
  { value: '7+', label: 'Chains' },
  { value: '1M+', label: 'Transactions' },
  { value: '20', label: 'Types' },
] as const
const CLUSTERS = ['cluster-a', 'cluster-b', 'cluster-c', 'cluster-d'] as const

export function MarqueeNumbers() {
  return (
    <section
      id="marquee-numbers"
      className={s.section}
    >
      <MaskReveal className={s.revealViewport} start="top 62%">
        <div className={s.viewport}>
          <div className={s.track}>
            {CLUSTERS.map((clusterId) => (
              <div key={clusterId} className={s.cluster}>
                {STATS.map((stat) => (
                  <div key={`${clusterId}-${stat.label}`} className={s.stat}>
                    <span className={s.value}>{stat.value}</span>
                    <span className={s.label}>{stat.label}</span>
                    <span className={s.separator}>·</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </MaskReveal>
    </section>
  )
}
