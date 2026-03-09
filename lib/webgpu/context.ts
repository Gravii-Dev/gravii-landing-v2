import type { WebGPUCanvasContext } from './types'

export async function createWebGPUContext(
  canvas: HTMLCanvasElement
): Promise<WebGPUCanvasContext | null> {
  if (!('gpu' in navigator)) {
    return null
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    return null
  }

  const device = await adapter.requestDevice()
  const context = canvas.getContext('webgpu')
  if (!context) {
    return null
  }

  const format = navigator.gpu.getPreferredCanvasFormat()

  const resize = () => {
    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 1.5)
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    context.configure({
      device,
      format,
      alphaMode: 'premultiplied',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    })
  }

  resize()

  const destroy = () => {
    context.unconfigure()
  }

  return {
    device,
    context,
    format,
    resize,
    destroy
  }
}
