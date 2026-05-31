/**
 * 주사위 프리뷰 컴포넌트
 * 드래그로 회전할 수 있는 3D 주사위 미리보기
 */

import { useRef, useState, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getDiceTypeForWorldView, getDiceConfig, type DiceType } from '../constants/diceTypes'
import { getWorldViewColors, type WorldView } from '../constants/worldViews'
import { createFaceTexture } from './Dice3D'

const DICE_SIZE = 0.5

// 주사위 회전 컴포넌트
function RotatingDice({ 
  diceConfig, 
  worldViewColors,
  isDragging,
  rotationRef 
}: { 
  diceConfig: ReturnType<typeof getDiceConfig>
  worldViewColors: ReturnType<typeof getWorldViewColors> | null
  isDragging: boolean
  rotationRef: React.MutableRefObject<{ x: number; y: number }>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  // 각 면에 숫자 텍스처를 적용한 materials 생성
  const faceMaterials = useMemo(() => {
    const materials: THREE.MeshStandardMaterial[] = []
    for (let i = 0; i < 6; i++) {
      const faceValue = diceConfig.values[i]
      const texture = createFaceTexture(i + 1, faceValue, diceConfig, worldViewColors)
      materials.push(
        new THREE.MeshStandardMaterial({
          map: texture,
          color: '#ffffff',
          metalness: 0.1,
          roughness: 0.8,
        })
      )
    }
    return materials
  }, [diceConfig, worldViewColors])
  
  const geometry = useMemo(() => new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE), [])
  
  // 회전 애니메이션
  useFrame(() => {
    if (meshRef.current) {
      if (isDragging) {
        // 드래그 중일 때는 rotationRef의 값 사용
        meshRef.current.rotation.y = rotationRef.current.y
        meshRef.current.rotation.x = rotationRef.current.x
      } else {
        // 드래그가 아닐 때는 자동 회전 (느리게)
        meshRef.current.rotation.y += 0.01
        meshRef.current.rotation.x += 0.005
      }
    }
  })
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1.0}
      material={faceMaterials}
    />
  )
}

interface DicePreviewProps {
  worldView: WorldView
  size?: number // 크기 (px)
  interactive?: boolean // 드래그 가능 여부
}

/**
 * 주사위 프리뷰 컴포넌트
 */
export default function DicePreview({ worldView, size = 80, interactive = true }: DicePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const rotationRef = useRef({ x: 0, y: 0 })
  const lastMousePos = useRef({ x: 0, y: 0 })
  
  const diceType = useMemo(() => getDiceTypeForWorldView(worldView), [worldView])
  const diceConfig = useMemo(() => getDiceConfig(diceType), [diceType])
  const worldViewColors = useMemo(() => getWorldViewColors(worldView), [worldView])
  
  // 마우스 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return
    setIsDragging(true)
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !isDragging) return
    
    const deltaX = e.clientX - lastMousePos.current.x
    const deltaY = e.clientY - lastMousePos.current.y
    
    rotationRef.current.y += deltaX * 0.01
    rotationRef.current.x += deltaY * 0.01
    
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  // 터치 드래그 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return
    setIsDragging(true)
    const touch = e.touches[0]
    lastMousePos.current = { x: touch.clientX, y: touch.clientY }
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!interactive || !isDragging) return
    e.preventDefault()
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - lastMousePos.current.x
    const deltaY = touch.clientY - lastMousePos.current.y
    
    rotationRef.current.y += deltaX * 0.01
    rotationRef.current.x += deltaY * 0.01
    
    lastMousePos.current = { x: touch.clientX, y: touch.clientY }
  }
  
  const handleTouchEnd = () => {
    setIsDragging(false)
  }
  
  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
        width: `${size}px`,
        height: `${size}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, -5, -5]} intensity={0.5} />
          <RotatingDice
            diceConfig={diceConfig}
            worldViewColors={worldViewColors}
            isDragging={isDragging}
            rotationRef={rotationRef}
          />
        </Suspense>
      </Canvas>
      {interactive && (
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className="text-[8px] text-white/60">드래그하여 회전</span>
        </div>
      )}
    </div>
  )
}

