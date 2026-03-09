import type { Metadata, Viewport } from 'next'

import type { PropsWithChildren } from 'react'
import { ReactTempus } from 'tempus/react'
import { Link } from '@/components/ui/link'
import { OptionalFeatures } from '@/lib/features'
import { themes } from '@/lib/styles/colors'
import { fontsVariable } from '@/lib/styles/fonts'
import AppData from '@/package.json'
import '@/lib/styles/css/index.css'
import s from './layout.module.css'

const APP_NAME = AppData.name
const APP_DEFAULT_TITLE = 'Project Name'
const APP_TITLE_TEMPLATE = '%s | Project Name'
const APP_DESCRIPTION = AppData.description
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')
const ENABLE_OPTIONAL_RUNTIME = process.env.NODE_ENV === 'development'

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    url: APP_BASE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  authors: [],
  other: {
    'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
  },
}

export const viewport: Viewport = {
  themeColor: themes.red.primary,
  colorScheme: 'normal',
}

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={fontsVariable}
      data-theme="dark"
      // NOTE: This is due to the data-theme attribute being set which causes hydration errors
      suppressHydrationWarning
    >
      <body>
        <Link href="#main-content" className={s.skipLink}>
          Skip to main content
        </Link>
        {children}
        {ENABLE_OPTIONAL_RUNTIME ? <OptionalFeatures /> : null}
        {ENABLE_OPTIONAL_RUNTIME ? <ReactTempus patch={true} /> : null}
      </body>
    </html>
  )
}
