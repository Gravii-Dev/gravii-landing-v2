import type { ReactNode } from 'react'
import { Footer } from '@/components/layout/footer'
import s from '@/components/layout/wrapper/wrapper.module.css'

type SiteShellProps = {
  children: ReactNode
  className?: string
}

export function SiteShell({ children, className }: SiteShellProps) {
  const mainClassName = className ? `${s.root} ${className}` : s.root

  return (
    <>
      <main id="main-content" className={mainClassName}>
        {children}
      </main>
      <Footer />
    </>
  )
}
