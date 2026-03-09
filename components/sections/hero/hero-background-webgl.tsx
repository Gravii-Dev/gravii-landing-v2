'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Texture,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  type InstancedMesh,
} from 'three'
import { loadGlbMesh } from '@/lib/webgpu/glb'
import type { MeshData } from '@/lib/webgpu/types'
import s from './hero.module.css'

type HeroBackgroundWebGLProps = {
  onReady?: () => void
  onError?: () => void
}

type HeroAssets = {
  geometry: BufferGeometry
  material: MeshStandardMaterial
}

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

type WebGLProfile = {
  instanceCount: number
  dprCap: number
  antialias: boolean
}

function getWebGLProfile(width: number): WebGLProfile {
  if (width < 640) {
    return {
      instanceCount: 8,
      dprCap: 1,
      antialias: false,
    }
  }

  if (width < 1024) {
    return {
      instanceCount: 10,
      dprCap: 1.15,
      antialias: false,
    }
  }

  return {
    instanceCount: 14,
    dprCap: 1.5,
    antialias: true,
  }
}

function createSeeds(instanceCount: number): InstanceSeed[] {
  const seeds: InstanceSeed[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < instanceCount; i += 1) {
    const t = (i + 0.5) / instanceCount
    const depthT = i / Math.max(1, instanceCount - 1)
    const angle = i * goldenAngle + (Math.random() - 0.5) * 0.3
    const radius = 0.48 + Math.sqrt(t) * 2.45 + (Math.random() - 0.5) * 0.18

    seeds.push({
      x: Math.cos(angle) * radius,
      y: (Math.random() - 0.5) * 1.8 + Math.sin(angle * 1.2) * 0.2,
      z: -1.1 - depthT * 4 + (Math.random() - 0.5) * 0.32,
      scale: 0.112 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.08 + Math.random() * 0.16,
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
    vz: 0,
  }))
}

function createGeometry(mesh: MeshData) {
  const geometry = new BufferGeometry()

  geometry.setAttribute('position', new Float32BufferAttribute(mesh.positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(mesh.normals, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(mesh.uvs, 2))

  const maxIndex = mesh.indices.reduce((highest, value) => Math.max(highest, value), 0)
  if (maxIndex <= 65_535) {
    geometry.setIndex(new Uint16BufferAttribute(Uint16Array.from(mesh.indices), 1))
  } else {
    geometry.setIndex(new Uint32BufferAttribute(mesh.indices, 1))
  }

  geometry.computeBoundingSphere()
  return geometry
}

async function createBaseColorTexture(mesh: MeshData) {
  if (!mesh.baseColorTexture) {
    return null
  }

  const bytes = new Uint8Array(mesh.baseColorTexture.bytes.byteLength)
  bytes.set(mesh.baseColorTexture.bytes)

  const blob = new Blob([bytes.buffer], { type: mesh.baseColorTexture.mimeType })
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.decoding = 'async'
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Failed to decode WebGL fallback texture'))
      element.src = objectUrl
    })

    const texture = new Texture(image)
    texture.colorSpace = SRGBColorSpace
    texture.flipY = false
    texture.needsUpdate = true
    return texture
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function loadHeroAssets() {
  const mesh = await loadGlbMesh('/models/moon.glb')
  const geometry = createGeometry(mesh)
  let texture: Texture | null = null

  try {
    texture = await createBaseColorTexture(mesh)
  } catch (error) {
    console.warn('[Hero WebGL] texture decode failed, using flat fallback material:', error)
  }

  const material = new MeshStandardMaterial({
    color: new Color(texture ? '#f4f1ea' : '#b8bfca'),
    map: texture,
    roughness: 0.95,
    metalness: 0.02,
  })

  return { geometry, material }
}

function disposeHeroAssets(assets: HeroAssets) {
  assets.geometry.dispose()
  assets.material.map?.dispose()
  assets.material.dispose()
}

function MoonField({
  assets,
  instanceCount,
  pointerRef,
}: {
  assets: HeroAssets
  instanceCount: number
  pointerRef: RefObject<{ x: number; y: number }>
}) {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const seeds = useMemo(() => createSeeds(instanceCount), [instanceCount])
  const statesRef = useRef(createInstanceStates(seeds))
  const matrix = useMemo(() => new Matrix4(), [])

  useEffect(() => {
    statesRef.current = createInstanceStates(seeds)
  }, [seeds])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) {
      return
    }

    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  }, [])

  useFrame((state, delta) => {
    const mesh = meshRef.current
    if (!mesh) {
      return
    }

    const timeSeconds = state.clock.getElapsedTime()
    const pointer = pointerRef.current
    const cursorWorldX = pointer.x * 3.05
    const cursorWorldY = pointer.y * 2.1
    const cursorInfluenceRadius = 2.55
    const clampedDelta = Math.min(0.05, Math.max(1 / 240, delta))
    const states = statesRef.current

    for (let i = 0; i < instanceCount; i += 1) {
      const seed = seeds[i]!
      const state = states[i]!

      const floatY = Math.sin(timeSeconds * 1.1 + seed.phase) * seed.amplitude
      const driftX = Math.sin(timeSeconds * 0.42 + seed.phase * 0.55) * 0.03
      const driftZ = Math.cos(timeSeconds * 0.38 + seed.phase) * 0.048

      const targetX = seed.x + driftX
      const targetY = seed.y + floatY
      const targetZ = seed.z + driftZ

      const spring = 7.6
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
      const depthCompensation = Math.max(1, Math.min(2, 0.95 + (-state.z - 0.75) * 0.28))
      const impulse = 18.5 * falloff * depthCompensation

      state.vx += nx * impulse * clampedDelta
      state.vy += ny * impulse * clampedDelta
      state.vz += falloff * 5.2 * clampedDelta * depthCompensation

      const damping = Math.exp(-4.4 * clampedDelta)
      state.vx *= damping
      state.vy *= damping
      state.vz *= damping

      state.x += state.vx * clampedDelta
      state.y += state.vy * clampedDelta
      state.z += state.vz * clampedDelta

      const spin = timeSeconds * (0.18 + seed.amplitude * 1.9) + seed.phase

      dummy.position.set(state.x, state.y, state.z)
      dummy.rotation.set(spin * 0.18, spin, spin * 0.1 + seed.phase * 0.25)
      dummy.scale.setScalar(seed.scale)
      dummy.updateMatrix()

      matrix.copy(dummy.matrix)
      mesh.setMatrixAt(i, matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[assets.geometry, assets.material, instanceCount]}
      frustumCulled={false}
    />
  )
}

export function HeroBackgroundWebGL({
  onReady,
  onError,
}: HeroBackgroundWebGLProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const assetsRef = useRef<HeroAssets | null>(null)
  const readyRef = useRef(false)
  const [assets, setAssets] = useState<HeroAssets | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth
  )
  const profile = useMemo(
    () => getWebGLProfile(viewportWidth),
    [viewportWidth]
  )

  useEffect(() => {
    let isDisposed = false

    const loadAssets = async () => {
      try {
        const nextAssets = await loadHeroAssets()
        if (isDisposed) {
          disposeHeroAssets(nextAssets)
          return
        }

        assetsRef.current = nextAssets
        setAssets(nextAssets)

        if (!readyRef.current) {
          readyRef.current = true
          onReady?.()
        }
      } catch (error) {
        console.error('[Hero WebGL] init failed:', error)
        if (!isDisposed) {
          onError?.()
        }
      }
    }

    void loadAssets()

    return () => {
      isDisposed = true
      if (assetsRef.current) {
        disposeHeroAssets(assetsRef.current)
        assetsRef.current = null
      }
    }
  }, [onError, onReady])

  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth)
    }

    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth, { passive: true })

    return () => {
      window.removeEventListener('resize', updateViewportWidth)
    }
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting ?? false)
      },
      { threshold: 0.05 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || rect.width < 1 || rect.height < 1) {
        return
      }

      const nx = (event.clientX - rect.left) / rect.width
      const ny = (event.clientY - rect.top) / rect.height

      pointerRef.current.x = Math.max(-1, Math.min(1, nx * 2 - 1))
      pointerRef.current.y = Math.max(-1, Math.min(1, -(ny * 2 - 1)))
    }

    const pointerListener: EventListener = (event) => {
      if (!(event instanceof PointerEvent)) {
        return
      }

      updatePointer(event)
    }

    const pointerEventName = 'onpointerrawupdate' in window
      ? 'pointerrawupdate'
      : 'pointermove'

    window.addEventListener(pointerEventName, pointerListener, { passive: true })
    window.addEventListener('pointerdown', pointerListener, { passive: true })

    return () => {
      window.removeEventListener(pointerEventName, pointerListener)
      window.removeEventListener('pointerdown', pointerListener)
    }
  }, [])

  return (
    <div ref={containerRef} className={s.backgroundWrap}>
      <Canvas
        className={`${s.canvas} ${assets ? s.canvasVisible : ''}`}
        camera={{ position: [0, 0.2, 4.2], fov: 47, near: 0.1, far: 40 }}
        dpr={[1, profile.dprCap]}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{
          alpha: true,
          antialias: profile.antialias && (window.devicePixelRatio || 1) < 1.75,
          powerPreference: 'high-performance',
        }}
        resize={{ scroll: false, debounce: 200 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <ambientLight intensity={1.05} color="#fff9f0" />
        <directionalLight position={[2.8, 4.6, 3.8]} intensity={2.1} color="#fff7ef" />
        <directionalLight position={[-2.1, -0.8, 1.6]} intensity={0.28} color="#93a2b5" />
        {assets ? (
          <MoonField
            assets={assets}
            instanceCount={profile.instanceCount}
            pointerRef={pointerRef}
          />
        ) : null}
      </Canvas>
    </div>
  )
}
