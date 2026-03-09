'use client'

import { useEffect, useRef, useState } from 'react'
import s from './hero.module.css'

const HERO_BOOT_DELAY_MS = 240
const HERO_ACTIVE_FRAME_INTERVAL_MS = 1000 / 60
const HERO_IDLE_FRAME_INTERVAL_MS = 1000 / 60
const HERO_INTERACTION_WINDOW_MS = 1600
const DESKTOP_BREAKPOINT_PX = 1024

type HeroBackgroundProps = {
  onSettled?: () => void
}

type NetworkInformation = {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  saveData?: boolean
}

function shouldEnableHeroWebGPU() {
  if (!('gpu' in navigator)) {
    return false
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false
  }

  if (!window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`).matches) {
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

export function HeroBackground({ onSettled }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    let rafId = 0
    let sizeWaitRafId = 0
    let isDisposed = false
    let hasRenderError = false
    let hasSettled = false
    let bootTimer = 0
    let lastRenderedAt = 0
    let lastInteractionAt = 0
    let isVisible = true
    let renderer: {
      resize: () => void
      render: (timeMs: number) => void
      destroy: () => void
      updateCursorFromClientPoint: (x: number, y: number) => void
    } | null = null
    const settle = () => {
      if (hasSettled) {
        return
      }

      hasSettled = true
      onSettled?.()
    }
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? false
      },
      {
        threshold: 0.05,
      }
    )
    const markInteraction = () => {
      lastInteractionAt = performance.now()
      lastRenderedAt = 0
    }

    const resizeObserver = new ResizeObserver(() => {
      renderer?.resize()
      markInteraction()
    })

    if (!shouldEnableHeroWebGPU()) {
      setIsSupported(false)
      setIsReady(false)
      setStatusMessage(null)
      settle()
      return
    }

    const onPointerMove = (event: PointerEvent) => {
      renderer?.updateCursorFromClientPoint(event.clientX, event.clientY)
      markInteraction()
    }

    const onPointerDown = (event: PointerEvent) => {
      renderer?.updateCursorFromClientPoint(event.clientX, event.clientY)
      markInteraction()
    }

    const onWindowResize = () => {
      renderer?.resize()
      markInteraction()
    }

    const animate = (time: number) => {
      const frameInterval =
        time - lastInteractionAt <= HERO_INTERACTION_WINDOW_MS
          ? HERO_ACTIVE_FRAME_INTERVAL_MS
          : HERO_IDLE_FRAME_INTERVAL_MS

      if (
        document.hidden ||
        !isVisible ||
        time - lastRenderedAt < frameInterval
      ) {
        rafId = window.requestAnimationFrame(animate)
        return
      }

      lastRenderedAt = time

      try {
        renderer?.render(time)
      } catch (err) {
        if (!hasRenderError) {
          hasRenderError = true
          console.error('[Hero WebGPU] render failed:', err)
          setStatusMessage('WebGPU render failed')
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
          setIsSupported(false)
          setIsReady(false)
          setStatusMessage('WebGPU unsupported')
          settle()
          return
        }

        renderer = created
        visibilityObserver.observe(canvas)
        resizeObserver.observe(canvas)
        window.addEventListener('pointermove', onPointerMove, { passive: true })
        window.addEventListener('pointerdown', onPointerDown, { passive: true })
        window.addEventListener('resize', onWindowResize, { passive: true })
        setIsSupported(true)
        setIsReady(true)
        setStatusMessage(null)
        markInteraction()
        settle()
        rafId = window.requestAnimationFrame(animate)
      } catch (err) {
        console.error('[Hero WebGPU] init failed:', err)
        setIsSupported(false)
        setIsReady(false)
        setStatusMessage('WebGPU init failed')
        settle()
      }
    }

    const ensureSizeThenInit = () => {
      if (isDisposed) {
        return
      }
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w >= 100 && h >= 100) {
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
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onWindowResize)
      visibilityObserver.disconnect()
      resizeObserver.disconnect()
      renderer?.destroy()
    }
  }, [onSettled])

  return (
    <div className={s.backgroundWrap}>
      <canvas
        ref={canvasRef}
        className={`${s.canvas} ${isReady && isSupported ? s.canvasVisible : ''}`}
      />
      {!isSupported ? <div className={s.fallback} aria-hidden="true" /> : null}
      {statusMessage ? <div className={s.status}>{statusMessage}</div> : null}
    </div>
  )
}
