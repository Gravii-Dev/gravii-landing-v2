import { MaskReveal } from '@/components/effects/mask-reveal'
import { ScrubTextReveal } from '@/components/effects/scrub-text-reveal'
import s from './marquee-copy.module.css'

const LABELS = [
  'Pro Trader',
  'DeFi Native',
  'NFT Collector',
  'Whale',
  'Builder',
  'Explorer',
  'HODLer',
  'Yield Farmer',
  'DAO Voter',
  'Airdrop Hunter',
  'Bridge Hopper',
  'Staker',
  'Liquidity Provider',
  'Minter',
  'Flipper',
  'Dormant Whale',
  'Gas Optimizer',
  'Multi-chain Native',
  'Early Adopter',
  'Degen',
] as const

export function MarqueeCopy() {
  const forward = [0, 1].flatMap((cycle) =>
    LABELS.map((label) => ({
      id: `forward-${cycle}-${label}`,
      label,
    }))
  )
  const reverse = [0, 1].flatMap((cycle) =>
    [...LABELS].reverse().map((label) => ({
      id: `reverse-${cycle}-${label}`,
      label,
    }))
  )

  return (
    <section
      id="marquee-copy"
      className={s.section}
    >
      <MaskReveal className={s.revealRow} start="top 62%">
        <div className={s.marqueeViewport}>
          <div className={`${s.track} ${s.trackForward}`}>
            {forward.map((item) => (
              <span key={item.id} className={s.pill}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </MaskReveal>

      <div className={s.center}>
        <MaskReveal
          className={s.titleReveal}
          innerClassName={s.titleInner}
          delay={0.04}
          start="top 62%"
        >
          <ScrubTextReveal as="h2" className={s.title} text="Dressed in data. Find your fit." />
        </MaskReveal>
        <MaskReveal
          className={s.subtitleReveal}
          innerClassName={s.subtitleInner}
          delay={0.1}
          start="top 62%"
        >
          <p className={s.subtitle}>20 behavioral types</p>
        </MaskReveal>
      </div>

      <MaskReveal className={s.revealRow} delay={0.12} start="top 62%">
        <div className={s.marqueeViewport}>
          <div className={`${s.track} ${s.trackReverse}`}>
            {reverse.map((item) => (
              <span key={item.id} className={s.pill}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </MaskReveal>
    </section>
  )
}
