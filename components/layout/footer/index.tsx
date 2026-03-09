import s from './footer.module.css'

const FOOTER_LINKS = ['X', 'Docs', 'Partner with us'] as const
const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className={s.root}>
      <div className={s.inner}>
        <span className={s.brand}>Gravii</span>

        <nav className={s.links} aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <span key={link} className={s.link}>
              {link}
            </span>
          ))}
        </nav>

        <span className={s.copy}>© {CURRENT_YEAR} Gravii. All rights reserved.</span>
      </div>
    </footer>
  )
}
