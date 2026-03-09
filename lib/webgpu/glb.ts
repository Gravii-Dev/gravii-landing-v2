import type { MeshData } from './types'

const GLB_MAGIC = 0x46546c67
const CHUNK_TYPE_JSON = 0x4e4f534a
const CHUNK_TYPE_BIN = 0x004e4942

type GlTF = {
  accessors: Array<{
    bufferView?: number
    byteOffset?: number
    componentType: number
    count: number
    type: string
  }>
  bufferViews: Array<{
    buffer: number
    byteOffset?: number
    byteLength: number
    byteStride?: number
  }>
  meshes: Array<{
    primitives: Array<{
      attributes: Record<string, number>
      indices?: number
      material?: number
    }>
  }>
  materials?: Array<{
    pbrMetallicRoughness?: {
      baseColorTexture?: {
        index: number
      }
    }
  }>
  textures?: Array<{
    source?: number
    extensions?: {
      EXT_texture_webp?: {
        source: number
      }
    }
  }>
  images?: Array<{
    uri?: string
    mimeType?: string
    bufferView?: number
  }>
}

const COMPONENTS_PER_TYPE: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
}

const COMPONENT_SIZE: Record<number, number> = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4
}

function getAccessor(gltf: GlTF, binChunk: Uint8Array, accessorIndex: number): ArrayBufferView {
  const accessor = gltf.accessors[accessorIndex]
  if (!accessor) {
    throw new Error(`Missing accessor at index ${accessorIndex}`)
  }
  if (accessor.bufferView === undefined) {
    throw new Error(`Accessor ${accessorIndex} has no bufferView`)
  }

  const bufferView = gltf.bufferViews[accessor.bufferView]
  if (!bufferView) {
    throw new Error(`Missing bufferView at index ${accessor.bufferView}`)
  }

  const componentCount = COMPONENTS_PER_TYPE[accessor.type]
  const componentByteSize = COMPONENT_SIZE[accessor.componentType]
  if (!(componentCount && componentByteSize)) {
    throw new Error(`Unsupported accessor type/componentType (${accessor.type}, ${accessor.componentType})`)
  }

  const elementByteSize = componentCount * componentByteSize
  const stride = bufferView.byteStride ?? elementByteSize
  const accessorByteOffset = accessor.byteOffset ?? 0
  const viewByteOffset = bufferView.byteOffset ?? 0
  const start = viewByteOffset + accessorByteOffset
  const length = accessor.count * componentCount
  const full = new Uint8Array(binChunk.buffer, binChunk.byteOffset, binChunk.byteLength)

  if (stride === elementByteSize) {
    const byteLength = accessor.count * elementByteSize
    const slice = full.slice(start, start + byteLength)
    const buffer = slice.buffer
    const byteOffset = slice.byteOffset

    switch (accessor.componentType) {
      case 5121:
        return new Uint8Array(buffer, byteOffset, length)
      case 5123:
        return new Uint16Array(buffer, byteOffset, length)
      case 5125:
        return new Uint32Array(buffer, byteOffset, length)
      case 5126:
        return new Float32Array(buffer, byteOffset, length)
      default:
        throw new Error(`Unsupported tightly packed componentType ${accessor.componentType}`)
    }
  }

  if (accessor.componentType === 5126) {
    const out = new Float32Array(length)
    const dataView = new DataView(binChunk.buffer, binChunk.byteOffset, binChunk.byteLength)
    for (let i = 0; i < accessor.count; i += 1) {
      const srcBase = start + i * stride
      const dstBase = i * componentCount
      for (let c = 0; c < componentCount; c += 1) {
        out[dstBase + c] = dataView.getFloat32(srcBase + c * 4, true)
      }
    }
    return out
  }

  if (accessor.componentType === 5123 || accessor.componentType === 5125 || accessor.componentType === 5121) {
    const out = new Uint32Array(length)
    const dataView = new DataView(binChunk.buffer, binChunk.byteOffset, binChunk.byteLength)
    for (let i = 0; i < accessor.count; i += 1) {
      const srcBase = start + i * stride
      const dstBase = i * componentCount
      for (let c = 0; c < componentCount; c += 1) {
        const offset = srcBase + c * componentByteSize
        if (accessor.componentType === 5121) {
          out[dstBase + c] = dataView.getUint8(offset)
        } else if (accessor.componentType === 5123) {
          out[dstBase + c] = dataView.getUint16(offset, true)
        } else {
          out[dstBase + c] = dataView.getUint32(offset, true)
        }
      }
    }
    return out
  }

  throw new Error(`Unsupported interleaved componentType ${accessor.componentType}`)
}

function parseGlb(buffer: ArrayBuffer): { gltf: GlTF; binChunk: Uint8Array } {
  const view = new DataView(buffer)
  const magic = view.getUint32(0, true)
  const version = view.getUint32(4, true)
  const length = view.getUint32(8, true)

  if (magic !== GLB_MAGIC || version !== 2 || length !== buffer.byteLength) {
    throw new Error('Invalid GLB header')
  }

  let offset = 12
  let jsonChunk: Uint8Array | null = null
  let binChunk: Uint8Array | null = null

  while (offset < buffer.byteLength) {
    const chunkLength = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    offset += 8

    const chunkData = new Uint8Array(buffer, offset, chunkLength)
    offset += chunkLength

    if (chunkType === CHUNK_TYPE_JSON) {
      jsonChunk = chunkData
    } else if (chunkType === CHUNK_TYPE_BIN) {
      binChunk = chunkData
    }
  }

  if (!(jsonChunk && binChunk)) {
    throw new Error('GLB is missing JSON or BIN chunk')
  }

  const jsonText = new TextDecoder().decode(jsonChunk).trim()
  const gltf = JSON.parse(jsonText) as GlTF
  return { gltf, binChunk }
}

function parseDataUri(uri: string): { bytes: Uint8Array; mimeType: string } | null {
  const match = /^data:(.+?);base64,(.+)$/.exec(uri)
  if (!match) {
    return null
  }
  const mimeType = match[1] ?? 'application/octet-stream'
  const base64 = match[2] ?? ''
  const decoded = atob(base64)
  const bytes = new Uint8Array(decoded.length)
  for (let i = 0; i < decoded.length; i += 1) {
    bytes[i] = decoded.charCodeAt(i)
  }
  return { bytes, mimeType }
}

function extractBaseColorTexture(
  gltf: GlTF,
  primitive: GlTF['meshes'][number]['primitives'][number],
  binChunk: Uint8Array
) {
  const material = primitive.material !== undefined ? gltf.materials?.[primitive.material] : gltf.materials?.[0]
  const textureIndex = material?.pbrMetallicRoughness?.baseColorTexture?.index
  if (textureIndex === undefined) {
    return null
  }

  const texture = gltf.textures?.[textureIndex]
  const source = texture?.source ?? texture?.extensions?.EXT_texture_webp?.source
  if (source === undefined) {
    return null
  }

  const image = gltf.images?.[source]
  if (!image) {
    return null
  }

  if (image.uri) {
    if (image.uri.startsWith('data:')) {
      return parseDataUri(image.uri)
    }
    return null
  }

  if (image.bufferView === undefined || !image.mimeType) {
    return null
  }

  const bufferView = gltf.bufferViews[image.bufferView]
  if (!bufferView) {
    return null
  }

  const start = bufferView.byteOffset ?? 0
  const end = start + bufferView.byteLength
  return {
    bytes: binChunk.slice(start, end),
    mimeType: image.mimeType
  }
}

export async function loadGlbMesh(url: string): Promise<MeshData> {
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) {
    throw new Error(`Failed to load model: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const { gltf, binChunk } = parseGlb(arrayBuffer)
  const mesh = gltf.meshes[0]
  const primitive = mesh?.primitives[0]
  if (!primitive) {
    throw new Error('No mesh primitive found in GLB')
  }

  const positionAccessor = primitive.attributes.POSITION
  const normalAccessor = primitive.attributes.NORMAL
  const uvAccessor = primitive.attributes.TEXCOORD_0
  const indexAccessor = primitive.indices

  if (
    positionAccessor === undefined ||
    normalAccessor === undefined ||
    indexAccessor === undefined
  ) {
    throw new Error('GLB primitive is missing POSITION, NORMAL, or indices')
  }

  const positions = getAccessor(gltf, binChunk, positionAccessor)
  const normals = getAccessor(gltf, binChunk, normalAccessor)
  const texcoords = uvAccessor === undefined ? null : getAccessor(gltf, binChunk, uvAccessor)
  const indices = getAccessor(gltf, binChunk, indexAccessor)

  if (!((positions instanceof Float32Array) && (normals instanceof Float32Array))) {
    throw new Error('POSITION and NORMAL accessors must be Float32Array')
  }

  if (texcoords !== null && !(texcoords instanceof Float32Array)) {
    throw new Error('TEXCOORD_0 accessor must be Float32Array')
  }

  let uint32Indices: Uint32Array
  if (indices instanceof Uint32Array) {
    uint32Indices = indices
  } else if (indices instanceof Uint16Array || indices instanceof Uint8Array) {
    uint32Indices = Uint32Array.from(indices)
  } else {
    throw new Error('Unsupported index accessor type')
  }

  const uvs = new Float32Array((positions.length / 3) * 2)
  if (texcoords) {
    uvs.set(texcoords)
  }

  const baseColorTexture = extractBaseColorTexture(gltf, primitive, binChunk)

  return {
    positions,
    normals,
    uvs,
    indices: uint32Indices,
    baseColorTexture
  }
}
