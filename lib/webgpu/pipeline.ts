import { createWebGPUContext } from './context'
import { loadGlbMesh } from './glb'
import type { HeroWebGPURenderer, MeshData } from './types'

const INSTANCE_COUNT = 18
const INSTANCE_STRIDE_FLOATS = 8
const CAMERA_UNIFORM_BYTES = 112

type InstanceSeed = {
  x: number
  y: number
  z: number
  scale: number
  phase: number
  amplitude: number
}

type InstanceState = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

function perspective(fovYRad: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovYRad * 0.5)
  const nf = 1 / (near - far)
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0
  ])
}

function lookAt(eye: [number, number, number], target: [number, number, number], up: [number, number, number]): Float32Array {
  const zx = eye[0] - target[0]
  const zy = eye[1] - target[1]
  const zz = eye[2] - target[2]
  const zLen = Math.hypot(zx, zy, zz) || 1
  const z0 = zx / zLen
  const z1 = zy / zLen
  const z2 = zz / zLen

  const xx = up[1] * z2 - up[2] * z1
  const xy = up[2] * z0 - up[0] * z2
  const xz = up[0] * z1 - up[1] * z0
  const xLen = Math.hypot(xx, xy, xz) || 1
  const x0 = xx / xLen
  const x1 = xy / xLen
  const x2 = xz / xLen

  const y0 = z1 * x2 - z2 * x1
  const y1 = z2 * x0 - z0 * x2
  const y2 = z0 * x1 - z1 * x0

  return new Float32Array([
    x0, y0, z0, 0,
    x1, y1, z1, 0,
    x2, y2, z2, 0,
    -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]),
    -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]),
    -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]),
    1
  ])
}

function multiplyMat4(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16)
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[col * 4 + row] =
        (a[0 * 4 + row] ?? 0) * (b[col * 4 + 0] ?? 0) +
        (a[1 * 4 + row] ?? 0) * (b[col * 4 + 1] ?? 0) +
        (a[2 * 4 + row] ?? 0) * (b[col * 4 + 2] ?? 0) +
        (a[3 * 4 + row] ?? 0) * (b[col * 4 + 3] ?? 0)
    }
  }
  return out
}

function createSeeds(instanceCount: number): InstanceSeed[] {
  const seeds: InstanceSeed[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < instanceCount; i += 1) {
    const t = (i + 0.5) / instanceCount
    const depthT = i / Math.max(1, instanceCount - 1)
    const angle = i * goldenAngle + (Math.random() - 0.5) * 0.35
    const radius = 0.5 + Math.sqrt(t) * 2.65 + (Math.random() - 0.5) * 0.2
    seeds.push({
      x: Math.cos(angle) * radius,
      y: (Math.random() - 0.5) * 1.95 + Math.sin(angle * 1.3) * 0.22,
      z: -1.0 - depthT * 4.2 + (Math.random() - 0.5) * 0.4,
      scale: 0.108 + Math.random() * 0.058,
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.08 + Math.random() * 0.18
    })
  }
  return seeds
}

function createInstanceStates(seeds: InstanceSeed[]): InstanceState[] {
  return seeds.map((seed) => ({
    x: seed.x,
    y: seed.y,
    z: seed.z,
    vx: 0,
    vy: 0,
    vz: 0
  }))
}

function createShaderModule(device: GPUDevice): GPUShaderModule {
  return device.createShaderModule({
    label: 'hero.shader',
    code: `
struct CameraUniform {
  view_proj: mat4x4<f32>,
  time: f32,
  _pad0: vec3<f32>,
  cursor: vec2<f32>,
  _pad1: vec2<f32>,
}

struct VSIn {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) instance_pos_scale: vec4<f32>,
  @location(4) instance_float: vec4<f32>,
}

struct VSOut {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) world_normal: vec3<f32>,
  @location(1) ndc_xy: vec2<f32>,
  @location(2) phase: f32,
  @location(3) uv: vec2<f32>,
}

@group(0) @binding(0) var<uniform> camera: CameraUniform;
@group(0) @binding(1) var model_sampler: sampler;
@group(0) @binding(2) var model_texture: texture_2d<f32>;

@vertex
fn vs_main(input: VSIn) -> VSOut {
  var out: VSOut;

  let spin = camera.time * (0.18 + input.instance_float.y * 0.8) + input.instance_float.x;
  let c = cos(spin);
  let s = sin(spin);

  let rotated_pos = vec3<f32>(
    input.position.x * c - input.position.z * s,
    input.position.y,
    input.position.x * s + input.position.z * c
  );
  let rotated_normal = normalize(vec3<f32>(
    input.normal.x * c - input.normal.z * s,
    input.normal.y,
    input.normal.x * s + input.normal.z * c
  ));

  let world_position = rotated_pos * input.instance_pos_scale.w + input.instance_pos_scale.xyz;
  let clip = camera.view_proj * vec4<f32>(world_position, 1.0);
  out.clip_position = clip;
  out.world_normal = rotated_normal;
  out.ndc_xy = clip.xy / clip.w;
  out.phase = input.instance_float.x;
  out.uv = vec2<f32>(input.uv.x, 1.0 - input.uv.y);
  return out;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
  let normal = normalize(input.world_normal);
  let light_dir = normalize(vec3<f32>(0.28, 0.82, 0.5));
  let lambert = max(dot(normal, light_dir), 0.0);
  let dist_to_cursor = distance(input.ndc_xy, camera.cursor);
  let cursor_glow = smoothstep(0.95, 0.0, dist_to_cursor) * 0.26;
  let view_dir = normalize(vec3<f32>(0.0, 0.0, 1.0));
  let half_vec = normalize(light_dir + view_dir);
  let specular = pow(max(dot(normal, half_vec), 0.0), 28.0);
  let fresnel = pow(1.0 - max(dot(normal, view_dir), 0.0), 3.2);

  let albedo = textureSample(model_texture, model_sampler, input.uv).rgb;
  let background_tint = vec3<f32>(236.0 / 255.0, 224.0 / 255.0, 203.0 / 255.0);
  let tinted_albedo = mix(albedo, background_tint, 0.6);
  let soft_lambert = 0.18 + lambert * 0.82;
  let light = 0.7 + soft_lambert * 0.48;
  let ambient = background_tint * 0.1;
  let sheen = background_tint * (specular * 0.1 + fresnel * 0.04);
  let color = tinted_albedo * light + ambient + sheen + vec3<f32>(cursor_glow * 0.15, cursor_glow * 0.15, cursor_glow * 0.15);
  return vec4<f32>(color, 1.0);
}
`
  })
}

function createFallbackTexture(device: GPUDevice): GPUTexture {
  const texture = device.createTexture({
    size: [1, 1, 1],
    format: 'rgba8unorm-srgb',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
  })

  device.queue.writeTexture(
    { texture },
    new Uint8Array([168, 173, 186, 255]),
    { bytesPerRow: 4 },
    { width: 1, height: 1, depthOrArrayLayers: 1 }
  )

  return texture
}

async function decodeBaseColorPixels(textureBytes: Uint8Array, mimeType: string) {
  const bytes = new Uint8Array(textureBytes.byteLength)
  bytes.set(textureBytes)

  const blob = new Blob([bytes.buffer], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.decoding = 'async'
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Failed to decode baseColor image'))
      element.src = objectUrl
    })

    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    if (width < 1 || height < 1) {
      throw new Error('Decoded baseColor image has invalid dimensions')
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      throw new Error('Failed to create 2D context for baseColor image')
    }

    context.globalCompositeOperation = 'copy'
    context.drawImage(image, 0, 0, width, height)

    const imageData = context.getImageData(0, 0, width, height)
    const rgba = new Uint8Array(imageData.data)

    // Chromium-based WebGPU paths can zero RGB in transparent PNG texels during
    // external-image upload. The GLB base color isn't using alpha in the shader,
    // so force the texture opaque before writing it to the GPU.
    for (let i = 3; i < rgba.length; i += 4) {
      rgba[i] = 255
    }

    return { width, height, rgba }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function createBaseColorTextureResources(device: GPUDevice, mesh: MeshData) {
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    // We upload only a single mip level for the embedded GLB texture.
    // Some WebGPU implementations sample near-black when trilinear mip filtering
    // is requested without a full mip chain, so clamp to the base level.
    mipmapFilter: 'nearest',
    lodMinClamp: 0,
    lodMaxClamp: 0,
    addressModeU: 'repeat',
    addressModeV: 'repeat'
  })

  if (!mesh.baseColorTexture) {
    const fallbackTexture = createFallbackTexture(device)
    return {
      sampler,
      texture: fallbackTexture,
      view: fallbackTexture.createView()
    }
  }

  try {
    const decoded = await decodeBaseColorPixels(
      mesh.baseColorTexture.bytes,
      mesh.baseColorTexture.mimeType
    )

    const texture = device.createTexture({
      size: [decoded.width, decoded.height, 1],
      format: 'rgba8unorm-srgb',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    })

    device.queue.writeTexture(
      { texture },
      decoded.rgba,
      { bytesPerRow: decoded.width * 4, rowsPerImage: decoded.height },
      { width: decoded.width, height: decoded.height, depthOrArrayLayers: 1 }
    )

    return {
      sampler,
      texture,
      view: texture.createView()
    }
  } catch (error) {
    console.warn('[Hero WebGPU] Failed to decode baseColor texture, using fallback texture.', error)
    const fallbackTexture = createFallbackTexture(device)
    return {
      sampler,
      texture: fallbackTexture,
      view: fallbackTexture.createView()
    }
  }
}

export async function createHeroWebGPURenderer(
  canvas: HTMLCanvasElement,
  modelUrl: string
): Promise<HeroWebGPURenderer | null> {
  const webgpu = await createWebGPUContext(canvas)
  if (!webgpu) {
    return null
  }

  const { device, context, format } = webgpu
  const mesh = await loadGlbMesh(modelUrl)
  const meshIndices = Uint32Array.from(mesh.indices)

  const vertexCount = mesh.positions.length / 3
  const interleaved = new Float32Array(vertexCount * 8)
  for (let i = 0; i < vertexCount; i += 1) {
    const posSrc = i * 3
    const uvSrc = i * 2
    const dst = i * 8

    interleaved[dst + 0] = mesh.positions[posSrc + 0] ?? 0
    interleaved[dst + 1] = mesh.positions[posSrc + 1] ?? 0
    interleaved[dst + 2] = mesh.positions[posSrc + 2] ?? 0

    interleaved[dst + 3] = mesh.normals[posSrc + 0] ?? 0
    interleaved[dst + 4] = mesh.normals[posSrc + 1] ?? 0
    interleaved[dst + 5] = mesh.normals[posSrc + 2] ?? 0

    interleaved[dst + 6] = mesh.uvs[uvSrc + 0] ?? 0
    interleaved[dst + 7] = mesh.uvs[uvSrc + 1] ?? 0
  }

  const vertexBuffer = device.createBuffer({
    label: 'hero.vertex',
    size: interleaved.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  })
  device.queue.writeBuffer(vertexBuffer, 0, interleaved)

  const indexBuffer = device.createBuffer({
    label: 'hero.index',
    size: meshIndices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  })
  device.queue.writeBuffer(indexBuffer, 0, meshIndices)

  const seeds = createSeeds(INSTANCE_COUNT)
  const states = createInstanceStates(seeds)
  const instanceData = new Float32Array(INSTANCE_COUNT * INSTANCE_STRIDE_FLOATS)
  const instanceBuffer = device.createBuffer({
    label: 'hero.instances',
    size: instanceData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  })

  const cameraBuffer = device.createBuffer({
    label: 'hero.camera',
    size: CAMERA_UNIFORM_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  const albedoResources = await createBaseColorTextureResources(device, mesh)

  const shaderModule = createShaderModule(device)
  const shaderInfo = await shaderModule.getCompilationInfo()
  const shaderErrors = shaderInfo.messages.filter((message) => message.type === 'error')
  if (shaderErrors.length > 0) {
    console.error(
      '[Hero WebGPU] Shader compile errors:\n',
      shaderErrors
        .map((message) => {
          const line = message.lineNum ?? 0
          const col = message.linePos ?? 0
          return `L${line}:${col} ${message.message}`
        })
        .join('\n')
    )
    throw new Error('Hero WebGPU shader compilation failed')
  }
  const vertexBuffers: GPUVertexBufferLayout[] = [
    {
      arrayStride: 32,
      stepMode: 'vertex',
      attributes: [
        { shaderLocation: 0, offset: 0, format: 'float32x3' },
        { shaderLocation: 1, offset: 12, format: 'float32x3' },
        { shaderLocation: 2, offset: 24, format: 'float32x2' }
      ]
    },
    {
      arrayStride: INSTANCE_STRIDE_FLOATS * 4,
      stepMode: 'instance',
      attributes: [
        { shaderLocation: 3, offset: 0, format: 'float32x4' },
        { shaderLocation: 4, offset: 16, format: 'float32x4' }
      ]
    }
  ]

  const pipeline = device.createRenderPipeline({
    label: 'hero.pipeline',
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
      buffers: vertexBuffers
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format }]
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back'
    },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less'
    }
  })

  const bindGroup = device.createBindGroup({
    label: 'hero.bind-group',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: cameraBuffer } },
      { binding: 1, resource: albedoResources.sampler },
      { binding: 2, resource: albedoResources.view }
    ]
  })

  let depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  })

  let pointerX = 0
  let pointerY = 0
  const mat4Data = new Float32Array(16)
  const scalarData = new Float32Array(1)
  const padVec2Data = new Float32Array(2)
  const vec2Data = new Float32Array(2)
  const vec3Data = new Float32Array(3)

  const updateProjection = (timeSeconds: number) => {
    const aspect = canvas.width / canvas.height
    const proj = perspective(0.82, aspect, 0.1, 40)
    const view = lookAt([0, 0.2, 4.2], [0, 0, -2.6], [0, 1, 0])
    const viewProj = multiplyMat4(proj, view)

    mat4Data.set(viewProj)
    scalarData[0] = timeSeconds
    vec3Data[0] = 0
    vec3Data[1] = 0
    vec3Data[2] = 0
    vec2Data[0] = pointerX
    vec2Data[1] = pointerY

    device.queue.writeBuffer(cameraBuffer, 0, mat4Data)
    device.queue.writeBuffer(cameraBuffer, 64, scalarData)
    device.queue.writeBuffer(cameraBuffer, 80, vec3Data)
    device.queue.writeBuffer(cameraBuffer, 96, vec2Data)
    device.queue.writeBuffer(cameraBuffer, 104, padVec2Data)
  }

  const updateInstances = (timeSeconds: number, deltaSeconds: number) => {
    const cursorWorldX = pointerX * 3.2
    const cursorWorldY = pointerY * 2.2
    const cursorInfluenceRadius = 2.65
    const clampedDelta = Math.min(0.05, Math.max(1 / 240, deltaSeconds))

    for (let i = 0; i < INSTANCE_COUNT; i += 1) {
      const seed = seeds[i]!
      const state = states[i]!

      const floatY = Math.sin(timeSeconds * 1.15 + seed.phase) * seed.amplitude
      const driftX = Math.sin(timeSeconds * 0.45 + seed.phase * 0.5) * 0.03
      const driftZ = Math.cos(timeSeconds * 0.4 + seed.phase) * 0.05

      const targetX = seed.x + driftX
      const targetY = seed.y + floatY
      const targetZ = seed.z + driftZ

      const spring = 7.8
      state.vx += (targetX - state.x) * spring * clampedDelta
      state.vy += (targetY - state.y) * spring * clampedDelta
      state.vz += (targetZ - state.z) * spring * clampedDelta

      const dx = state.x - cursorWorldX
      const dy = state.y - cursorWorldY
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001
      const nx = dx / dist
      const ny = dy / dist

      const normalizedDistance = Math.min(1, dist / cursorInfluenceRadius)
      const rawFalloff = 1 - normalizedDistance
      const falloff = rawFalloff * rawFalloff * (3 - 2 * rawFalloff)

      // Farther instances appear to move less on screen, so compensate by depth.
      const depthCompensation = Math.max(1, Math.min(2.2, 0.95 + (-state.z - 0.8) * 0.32))
      const impulse = 23.5 * falloff * depthCompensation

      state.vx += nx * impulse * clampedDelta
      state.vy += ny * impulse * clampedDelta
      state.vz += falloff * 6.4 * clampedDelta * depthCompensation
    }

    // Keep instances from collapsing into each other.
    for (let i = 0; i < INSTANCE_COUNT; i += 1) {
      const a = states[i]!
      const aSeed = seeds[i]!
      for (let j = i + 1; j < INSTANCE_COUNT; j += 1) {
        const b = states[j]!
        const bSeed = seeds[j]!

        const dx = b.x - a.x
        const dy = b.y - a.y
        const dz = (b.z - a.z) * 0.72
        const distSq = dx * dx + dy * dy + dz * dz

        const minDist = 0.42 + (aSeed.scale + bSeed.scale) * 2.05
        const minDistSq = minDist * minDist
        if (distSq >= minDistSq) {
          continue
        }

        const dist = Math.sqrt(distSq) || 0.0001
        const nx = dx / dist
        const ny = dy / dist
        const nz = dz / dist
        const overlap = minDist - dist
        const separation = overlap * 16.5 * clampedDelta

        a.vx -= nx * separation
        a.vy -= ny * separation
        a.vz -= nz * separation * 0.78

        b.vx += nx * separation
        b.vy += ny * separation
        b.vz += nz * separation * 0.78
      }
    }

    for (let i = 0; i < INSTANCE_COUNT; i += 1) {
      const seed = seeds[i]!
      const state = states[i]!
      const base = i * INSTANCE_STRIDE_FLOATS
      const damping = Math.exp(-4.2 * clampedDelta)
      state.vx *= damping
      state.vy *= damping
      state.vz *= damping

      state.x += state.vx * clampedDelta
      state.y += state.vy * clampedDelta
      state.z += state.vz * clampedDelta

      instanceData[base + 0] = state.x
      instanceData[base + 1] = state.y
      instanceData[base + 2] = state.z
      instanceData[base + 3] = seed.scale

      instanceData[base + 4] = seed.phase
      instanceData[base + 5] = seed.amplitude
      instanceData[base + 6] = seed.x
      instanceData[base + 7] = seed.y
    }

    device.queue.writeBuffer(instanceBuffer, 0, instanceData)
  }

  const resize = () => {
    webgpu.resize()
    depthTexture.destroy()
    depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    })
  }

  const updateCursorFromClientPoint = (x: number, y: number) => {
    const rect = canvas.getBoundingClientRect()
    const nx = (x - rect.left) / Math.max(1, rect.width)
    const ny = (y - rect.top) / Math.max(1, rect.height)
    pointerX = Math.max(-1, Math.min(1, nx * 2 - 1))
    pointerY = Math.max(-1, Math.min(1, -(ny * 2 - 1)))
  }

  let hasResizedOnce = false
  let lastTimeSeconds = 0
  let hasPreviousFrame = false

  const render = (timeMs: number) => {
    if (!hasResizedOnce) {
      resize()
      hasResizedOnce = true
    }

    const timeSeconds = timeMs * 0.001
    const deltaSeconds = hasPreviousFrame ? timeSeconds - lastTimeSeconds : 1 / 60
    lastTimeSeconds = timeSeconds
    hasPreviousFrame = true

    updateProjection(timeSeconds)
    updateInstances(timeSeconds, deltaSeconds)

    const encoder = device.createCommandEncoder({ label: 'hero.encoder' })
    const textureView = context.getCurrentTexture().createView()
    const depthView = depthTexture.createView()

    const colorAttachments: GPURenderPassColorAttachment[] = [
      {
        view: textureView,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 0 }
      }
    ]

    const pass = encoder.beginRenderPass({
      colorAttachments,
      depthStencilAttachment: {
        view: depthView,
        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    })

    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.setVertexBuffer(0, vertexBuffer)
    pass.setVertexBuffer(1, instanceBuffer)
    pass.setIndexBuffer(indexBuffer, 'uint32')
    pass.drawIndexed(meshIndices.length, INSTANCE_COUNT)
    pass.end()

    device.queue.submit([encoder.finish()])
  }

  const destroy = () => {
    depthTexture.destroy()
    albedoResources.texture.destroy()
    vertexBuffer.destroy()
    indexBuffer.destroy()
    instanceBuffer.destroy()
    cameraBuffer.destroy()
    webgpu.destroy()
  }

  resize()

  return {
    resize,
    updateCursorFromClientPoint,
    render,
    destroy
  }
}
