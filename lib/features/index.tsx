/**
 * Optional Features for Root Layout
 *
 * Conditionally loads optional features based on project configuration.
 * This prevents unused features from being mounted in the root layout.
 */

'use client'

import dynamic from 'next/dynamic'

// Feature detection - opt-in to avoid loading heavy WebGL libraries by default
const hasWebGL = process.env.NEXT_PUBLIC_ENABLE_WEBGL === 'true'
const isDevelopment = process.env.NODE_ENV === 'development'

// Lazy imports to avoid loading unused features
const LazyGlobalCanvas = dynamic(
  () =>
    import('@/webgl/components/global-canvas').then((mod) => ({
      default: mod.LazyGlobalCanvas,
    })),
  { ssr: false }
)

const OrchestraTools = dynamic(
  () => import('@/dev').then((mod) => ({ default: mod.OrchestraTools })),
  { ssr: false }
)

/**
 * Conditionally loads optional root layout features
 */
export function OptionalFeatures() {
  if (!(hasWebGL || isDevelopment)) {
    return null
  }

  return (
    <>
      {hasWebGL ? <LazyGlobalCanvas /> : null}
      {isDevelopment ? <OrchestraTools /> : null}
    </>
  )
}
