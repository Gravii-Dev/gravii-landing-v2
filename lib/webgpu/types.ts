export type WebGPUCanvasContext = {
  device: GPUDevice
  context: GPUCanvasContext
  format: GPUTextureFormat
  resize: () => void
  destroy: () => void
}

export type MeshData = {
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  indices: Uint32Array
  baseColorTexture: {
    bytes: Uint8Array
    mimeType: string
  } | null
}

export type HeroWebGPURenderer = {
  resize: () => void
  updateCursorFromClientPoint: (x: number, y: number) => void
  render: (timeMs: number) => void
  destroy: () => void
}
