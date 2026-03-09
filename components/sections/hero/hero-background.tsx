'use client'

import { useEffect, useRef, useState } from 'react'
import { createHeroWebGPURenderer } from '@/lib/webgpu/pipeline'
import s from './hero.module.css'

export function HeroBackground() {
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
    let renderer: Awaited<ReturnType<typeof createHeroWebGPURenderer>> = null
    const resizeObserver = new ResizeObserver(() => {
      renderer?.resize()
    })

    const onMouseMove = (event: MouseEvent) => {
      renderer?.updateCursorFromClientPoint(event.clientX, event.clientY)
    }

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) {
        return
      }
      renderer?.updateCursorFromClientPoint(touch.clientX, touch.clientY)
    }

    const animate = (time: number) => {
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
        const created = await createHeroWebGPURenderer(canvas, '/models/moon.glb')
        if (isDisposed) {
          created?.destroy()
          return
        }

        if (!created) {
          setIsSupported(false)
          setIsReady(false)
          setStatusMessage('WebGPU unsupported')
          return
        }

        renderer = created
        resizeObserver.observe(canvas)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('touchmove', onTouchMove, { passive: true })
        setIsSupported(true)
        setIsReady(true)
        setStatusMessage(null)
        rafId = window.requestAnimationFrame(animate)
      } catch (err) {
        console.error('[Hero WebGPU] init failed:', err)
        setIsSupported(false)
        setIsReady(false)
        setStatusMessage('WebGPU init failed')
      }
    }

    const ensureSizeThenInit = () => {
      if (isDisposed) {
        return
      }
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w >= 100 && h >= 100) {
        init()
        return
      }
      sizeWaitRafId = window.requestAnimationFrame(ensureSizeThenInit)
    }
    sizeWaitRafId = window.requestAnimationFrame(ensureSizeThenInit)

    return () => {
      isDisposed = true
      window.cancelAnimationFrame(rafId)
      window.cancelAnimationFrame(sizeWaitRafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      resizeObserver.disconnect()
      renderer?.destroy()
    }
  }, [])

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
