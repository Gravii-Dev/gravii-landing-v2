'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import s from './hero.module.css'

const HERO_BOOT_DELAY_MS = 240
const DESKTOP_BREAKPOINT_PX = 1024

const LazyHeroBackgroundWebGL = dynamic(
  () =>
    import('./hero-background-webgl').then((mod) => ({
      default: mod.HeroBackgroundWebGL,
    })),
  {
    ssr: false,
  }
)

type HeroBackgroundProps = {
  onSettled?: () => void
}

type RenderMode = 'detecting' | 'webgpu' | 'webgl' | 'static'

type NetworkInformation = {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  saveData?: boolean
}

function shouldEnableHero3D() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false
  }

  const connection = (
    navigator as Navigator & {
      connection?: NetworkInformation
    }
  ).connection

  if (connection?.saveData) {
    return false
  }

  if (
    connection?.effectiveType &&
    ['slow-2g', '2g', '3g'].includes(connection.effectiveType)
  ) {
    return false
  }

  return true
}

function supportsWebGPU() {
  return 'gpu' in navigator
}

function supportsWebGL() {
  const canvas = document.createElement('canvas')

  return Boolean(
    canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    }) ||
      canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
  )
}

function shouldPreferWebGPU() {
  return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`).matches
}

export function HeroBackground({ onSettled }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hasSettledRef = useRef(false)
  const [isReady, setIsReady] = useState(false)
  const [renderMode, setRenderMode] = useState<RenderMode>('detecting')
  const [canUseWebGL, setCanUseWebGL] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (hasSettledRef.current) {
      return
    }

    const settle = () => {
      if (hasSettledRef.current) {
        return
      }

      hasSettledRef.current = true
      onSettled?.()
    }

    if (!shouldEnableHero3D()) {
      setRenderMode('static')
      setIsReady(false)
      setStatusMessage(null)
      settle()
      return
    }

    const webglSupported = supportsWebGL()
    setCanUseWebGL(webglSupported)
    setIsReady(false)
    setStatusMessage(null)

    if (supportsWebGPU() && (shouldPreferWebGPU() || !webglSupported)) {
      setRenderMode('webgpu')
      return
    }

    if (webglSupported) {
      setRenderMode('webgl')
      return
    }

    setRenderMode('static')
    settle()
  }, [onSettled])

  useEffect(() => {
    if (renderMode !== 'webgpu') {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    let rafId = 0
    let sizeWaitRafId = 0
    let isDisposed = false
    let hasRenderError = false
    let bootTimer = 0
    let isVisible = true
    let renderer: {
      resize: () => void
      render: (timeMs: number) => void
      destroy: () => void
      updateCursorFromClientPoint: (x: number, y: number) => void
    } | null = null

    const settle = () => {
      if (hasSettledRef.current) {
        return
      }

      hasSettledRef.current = true
      onSettled?.()
    }
    const switchToFallback = (message: string | null) => {
      if (isDisposed) {
        return
      }

      setIsReady(false)
      if (canUseWebGL) {
        setStatusMessage(null)
        setRenderMode('webgl')
        return
      }

      setStatusMessage(message)
      setRenderMode('static')
      settle()
    }
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? false
      },
      {
        threshold: 0.05,
      }
    )

    const resizeObserver = new ResizeObserver(() => {
      renderer?.resize()
    })

    const onPointerMove = (event: PointerEvent) => {
      renderer?.updateCursorFromClientPoint(event.clientX, event.clientY)
    }
    const onPointerMoveEvent: EventListener = (event) => {
      if (!(event instanceof PointerEvent)) {
        return
      }

      onPointerMove(event)
    }
    const pointerMoveEventName = 'onpointerrawupdate' in window
      ? 'pointerrawupdate'
      : 'pointermove'

    const onPointerDown = (event: PointerEvent) => {
      renderer?.updateCursorFromClientPoint(event.clientX, event.clientY)
    }

    const onWindowResize = () => {
      renderer?.resize()
    }

    const animate = (time: number) => {
      if (document.hidden || !isVisible) {
        rafId = window.requestAnimationFrame(animate)
        return
      }

      try {
        renderer?.render(time)
      } catch (err) {
        if (!hasRenderError) {
          hasRenderError = true
          console.error('[Hero WebGPU] render failed:', err)
          switchToFallback('WebGPU render failed')
        }
      }
      rafId = window.requestAnimationFrame(animate)
    }

    const init = async () => {
      try {
        const { createHeroWebGPURenderer } = await import('@/lib/webgpu/pipeline')
        const created = await createHeroWebGPURenderer(canvas, '/models/moon.glb')
        if (isDisposed) {
          created?.destroy()
          return
        }

        if (!created) {
          switchToFallback('WebGPU unsupported')
          return
        }

        renderer = created
        visibilityObserver.observe(canvas)
        resizeObserver.observe(canvas)
        window.addEventListener(pointerMoveEventName, onPointerMoveEvent, { passive: true })
        window.addEventListener('pointerdown', onPointerDown, { passive: true })
        window.addEventListener('resize', onWindowResize, { passive: true })
        setIsReady(true)
        setStatusMessage(null)
        settle()
        rafId = window.requestAnimationFrame(animate)
      } catch (err) {
        console.error('[Hero WebGPU] init failed:', err)
        switchToFallback('WebGPU init failed')
      }
    }

    const ensureSizeThenInit = () => {
      if (isDisposed) {
        return
      }
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width >= 100 && height >= 100) {
        bootTimer = window.setTimeout(() => {
          void init()
        }, HERO_BOOT_DELAY_MS)
        return
      }
      sizeWaitRafId = window.requestAnimationFrame(ensureSizeThenInit)
    }
    sizeWaitRafId = window.requestAnimationFrame(ensureSizeThenInit)

    return () => {
      isDisposed = true
      window.cancelAnimationFrame(rafId)
      window.cancelAnimationFrame(sizeWaitRafId)
      window.clearTimeout(bootTimer)
      window.removeEventListener(pointerMoveEventName, onPointerMoveEvent)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onWindowResize)
      visibilityObserver.disconnect()
      resizeObserver.disconnect()
      renderer?.destroy()
    }
  }, [canUseWebGL, onSettled, renderMode])

  const handleWebGLReady = useCallback(() => {
    if (hasSettledRef.current) {
      return
    }

    hasSettledRef.current = true
    setStatusMessage(null)
    onSettled?.()
  }, [onSettled])

  const handleWebGLError = useCallback(() => {
    setStatusMessage('WebGL fallback unavailable')
    setRenderMode('static')
    if (hasSettledRef.current) {
      return
    }

    hasSettledRef.current = true
    onSettled?.()
  }, [onSettled])

  return (
    <div className={s.backgroundWrap}>
      {renderMode === 'webgpu' ? (
        <canvas
          ref={canvasRef}
          className={`${s.canvas} ${isReady ? s.canvasVisible : ''}`}
        />
      ) : null}
      {renderMode === 'webgl' ? (
        <LazyHeroBackgroundWebGL
          onReady={handleWebGLReady}
          onError={handleWebGLError}
        />
      ) : null}
      {renderMode === 'static' ? <div className={s.fallback} aria-hidden="true" /> : null}
      {statusMessage ? <div className={s.status}>{statusMessage}</div> : null}
    </div>
  )
}
