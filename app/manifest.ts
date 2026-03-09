import type { MetadataRoute } from 'next'
import { themes } from '@/styles/colors'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gravii',
    short_name: 'Gravii',
    description:
      'Connect once. Live differently. Gravii turns your onchain activity into one identity, one signal, and one door.',
    start_url: '/',
    display: 'standalone',
    background_color: themes.red.primary,
    theme_color: themes.red.primary,
    icons: [],
  }
}
