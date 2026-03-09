import { Wrapper } from '@/components/layout/wrapper'
import { StickyHeader } from '@/components/layout/sticky-header'
import { Hero } from '@/components/sections/hero'
import { IntroOne } from '@/components/sections/intro-one'
import { IntroTwo } from '@/components/sections/intro-two'
import { Persona } from '@/components/sections/persona'
import { MarqueeCopy } from '@/components/sections/marquee-copy'
import { MarqueeNumbers } from '@/components/sections/marquee-numbers'
import { Waitlist } from '@/components/sections/waitlist'

export default function Home() {
  return (
    <Wrapper>
      <StickyHeader />
      <div>
        <Hero />
        <IntroOne />
        <IntroTwo />
        <Persona />
        <MarqueeCopy />
        <MarqueeNumbers />
        <Waitlist />
      </div>
    </Wrapper>
  )
}
