import type { MetadataRoute } from 'next'
import AppData from '@/package.json'
import { themes } from '@/styles/colors'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: AppData.name,
    short_name: AppData.name,
    description: AppData.description,
    start_url: '/',
    display: 'standalone',
    background_color: themes.red.primary,
    theme_color: themes.red.primary,
    icons: [],
  }
}
