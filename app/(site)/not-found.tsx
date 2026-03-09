import { Link } from '@/components/ui/link'
import s from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={s.root}>
      <div className={s.content}>
        <h1 className={s.code}>404</h1>
        <p className={s.title}>Page Not Found</p>
        <p className={s.description}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className={s.actions}>
          <Link href="/" className={s.homeLink}>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
