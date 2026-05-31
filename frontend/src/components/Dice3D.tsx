/**
 * 3D 주사위 컴포넌트
 * Three.js와 Cannon.js를 사용하여 실제 물리 시뮬레이션 구현
 */

import { useRef, useState, Suspense, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, useBox, usePlane } from '@react-three/cannon'
import * as THREE from 'three'

// 주사위 타입별 설정 (d6만 사용)
const DICE_SIZE = 0.5 // 주사위 크기 (작게)
const diceGeometry = () => new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE)

// 경계 벽 컴포넌트
function Walls({ cardAspectRatio = 63/88, containerWidth, containerHeight }: { cardAspectRatio?: number; containerWidth?: number; containerHeight?: number }) {
  // 컨테이너 크기가 제공되면 정확한 비율 계산, 아니면 cardAspectRatio 사용
  let actualAspectRatio = cardAspectRatio
  if (containerWidth && containerHeight && containerWidth > 0 && containerHeight > 0) {
    actualAspectRatio = containerWidth / containerHeight
  }
  
  // 카메라 설정: position [0, 5, 0], rotation [-90deg, 0, 0], fov 40
  // 카메라 높이 5, FOV 40도일 때 바닥에 보이는 영역 계산
  const cameraHeight = 5
  const fovRad = (40 * Math.PI) / 180
  const halfFov = fovRad / 2
  const visibleRadius = Math.tan(halfFov) * cameraHeight
  
  // 경계를 약간 더 크게 (1.2배) 설정하여 이미지 영역을 완전히 덮음
  const wallSizeZ = visibleRadius * 1.2 // 세로 (Z축)
  const wallSizeX = wallSizeZ * actualAspectRatio // 가로 (X축) - 실제 비율 적용
  const wallHeight = 2
  
  return (
    <>
      <Wall position={[0, wallHeight / 2, wallSizeZ]} size={[wallSizeX * 2, wallHeight, 0.1]} />
      <Wall position={[0, wallHeight / 2, -wallSizeZ]} size={[wallSizeX * 2, wallHeight, 0.1]} />
      <Wall position={[-wallSizeX, wallHeight / 2, 0]} size={[0.1, wallHeight, wallSizeZ * 2]} />
      <Wall position={[wallSizeX, wallHeight / 2, 0]} size={[0.1, wallHeight, wallSizeZ * 2]} />
      <BoundaryLines wallSizeX={wallSizeX} wallSizeZ={wallSizeZ} />
    </>
  )
}

// 경계선 시각화 컴포넌트 (3D 박스 형태)
function BoundaryLines({ wallSizeX, wallSizeZ }: { wallSizeX: number; wallSizeZ: number }) {
  const height = 0.3 // 경계선 높이
  
  // 바닥 경계선
  const bottomPoints = useMemo(() => {
    const pts: [number, number, number][] = [
      [-wallSizeX, 0.01, -wallSizeZ],
      [wallSizeX, 0.01, -wallSizeZ],
      [wallSizeX, 0.01, wallSizeZ],
      [-wallSizeX, 0.01, wallSizeZ],
    ]
    return pts.flat()
  }, [wallSizeX, wallSizeZ])
  
  // 위쪽 경계선
  const topPoints = useMemo(() => {
    const pts: [number, number, number][] = [
      [-wallSizeX, height, -wallSizeZ],
      [wallSizeX, height, -wallSizeZ],
      [wallSizeX, height, wallSizeZ],
      [-wallSizeX, height, wallSizeZ],
    ]
    return pts.flat()
  }, [wallSizeX, wallSizeZ, height])
  
  // 모서리 연결선 (세로선)
  const cornerPoints = useMemo(() => {
    const corners: [number, number, number][] = [
      [-wallSizeX, 0.01, -wallSizeZ], [-wallSizeX, height, -wallSizeZ], // 왼쪽 앞
      [wallSizeX, 0.01, -wallSizeZ], [wallSizeX, height, -wallSizeZ],   // 오른쪽 앞
      [wallSizeX, 0.01, wallSizeZ], [wallSizeX, height, wallSizeZ],     // 오른쪽 뒤
      [-wallSizeX, 0.01, wallSizeZ], [-wallSizeX, height, wallSizeZ],  // 왼쪽 뒤
    ]
    return corners.flat()
  }, [wallSizeX, wallSizeZ, height])
  
  const bottomGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(bottomPoints, 3))
    return geom
  }, [bottomPoints])
  
  const topGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(topPoints, 3))
    return geom
  }, [topPoints])
  
  const cornerGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(cornerPoints, 3))
    return geom
  }, [cornerPoints])
  
  return (
    <group>
      <lineLoop geometry={bottomGeometry}>
        <lineBasicMaterial color="#4488ff" linewidth={2} />
      </lineLoop>
      <lineLoop geometry={topGeometry}>
        <lineBasicMaterial color="#66aaff" linewidth={2} />
      </lineLoop>
      <lineSegments geometry={cornerGeometry}>
        <lineBasicMaterial color="#4488ff" linewidth={2} />
      </lineSegments>
    </group>
  )
}

function Wall({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  const [ref] = useBox<THREE.Mesh>(() => ({
    type: 'Static',
    position,
    args: size,
    material: {
      friction: 0.3,
      restitution: 0.2,
    },
  }))

  return (
    <mesh ref={ref} visible={false}>
      <boxGeometry args={size} />
      <meshStandardMaterial transparent opacity={0} />
    </mesh>
  )
}

// 바닥 컴포넌트 (투명 바닥)
function Floor() {
  const [ref] = usePlane<THREE.Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.5, 0],
    type: 'Static',
    material: {
      friction: 0.3,
      restitution: 0.2,
    },
  }))


  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial 
        transparent
        opacity={0}
      />
    </mesh>
  )
}

// Canvas로 면 텍스처 생성 (세계관 컨셉 디자인)
export function createFaceTexture(
  faceIndex: number, // 1-6 (면 인덱스)
  faceValue: number, // 주사위 타입의 실제 값
  diceConfig: ReturnType<typeof getDiceConfig>,
  worldViewColors: ReturnType<typeof getWorldViewColors> | null
): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // 밝기 조정 헬퍼 함수
  const adjustBrightness = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + percent))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + percent))
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + percent))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }
  
  // 세계관 색상 팔레트 사용 (없으면 주사위 타입의 기본 색상 사용)
  const baseColor = worldViewColors?.primary || diceConfig.theme.baseColor
  const textColor = worldViewColors?.text || diceConfig.theme.dotColor
  const glowColor = worldViewColors?.indicator || diceConfig.theme.glowColor
  
  // 배경색 (면 인덱스에 따라 약간 변동)
  const bgColorVariation = (faceIndex % 3) * 10 // 0, 10, 20
  const bgColor = adjustBrightness(baseColor, -bgColorVariation)
  
  // 배경색 채우기 (그라데이션 효과)
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, bgColor)
  gradient.addColorStop(1, adjustBrightness(bgColor, -20))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  
  // 간단한 점 무늬 (세계관 색상 사용)
  ctx.globalAlpha = 0.2
  ctx.fillStyle = adjustBrightness(textColor, 30)
  const dotSize = 4
  const dotSpacing = 32
  for (let y = dotSpacing; y < size; y += dotSpacing) {
    for (let x = dotSpacing; x < size; x += dotSpacing) {
      ctx.beginPath()
      ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  ctx.globalAlpha = 1.0
  
  // 면 값에 따라 표시할 내용 결정
  // 특수 값 (-1)은 이모티콘으로 표시
  if (faceValue === -1) {
    // 특수 값: 이모티콘 표시 (아르칸드리아는 마법 주사위이므로 ✨ 또는 🔮)
    const centerX = size / 2
    const centerY = size / 2
    
    ctx.fillStyle = textColor
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 12
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // 이모티콘 텍스트 표시
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✨', centerX, centerY)
    
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  } else if (faceValue >= 10) {
    // 특수 값 (10 이상): 별 아이콘으로 표시
    const centerX = size / 2
    const centerY = size / 2
    const starRadius = size / 3
    
    ctx.fillStyle = textColor
    ctx.strokeStyle = adjustBrightness(textColor, -30)
    ctx.lineWidth = 4
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // 별 그리기
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
      const px = centerX + starRadius * Math.cos(angle)
      const py = centerY + starRadius * Math.sin(angle)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // 중앙에 숫자 표시 (10 이상인 경우)
    if (faceValue > 10) {
      ctx.fillStyle = textColor
      ctx.shadowColor = adjustBrightness(textColor, -50)
      ctx.shadowBlur = 6
      ctx.font = 'bold 80px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(faceValue), centerX, centerY)
    }
    
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  } else {
    // 숫자 표시
    const displayText = String(faceValue)
    
    ctx.fillStyle = textColor
    ctx.shadowColor = adjustBrightness(textColor, -50)
    ctx.shadowBlur = 6
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    
    ctx.font = 'bold 160px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(displayText, size / 2, size / 2)
    
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// Dice 컴포넌트의 ref 타입
export interface DiceRef {
  roll: () => void
}

// 물리 엔진을 사용하는 Dice 컴포넌트
const Dice = forwardRef<DiceRef, {
  diceType: DiceType
  diceConfig: ReturnType<typeof getDiceConfig>
  worldViewColors: ReturnType<typeof getWorldViewColors> | null
  position?: [number, number, number]
  onRoll?: (result: number) => void
  specialDiceValue?: number // 특수 주사위 값 (모든 면이 이 값)
}>(({ 
  diceConfig,
  worldViewColors,
  position = [0, 2, 0],
  onRoll,
  specialDiceValue
}, ref) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [isHeld, setIsHeld] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  
  const geometry = useMemo(() => diceGeometry(), [])
  
  // 각 면에 숫자 텍스처를 적용한 materials 생성
  const faceMaterials = useMemo(() => {
    const materials: THREE.MeshStandardMaterial[] = []
    // 특수 주사위인 경우 모든 면이 같은 값, 아니면 주사위 타입의 values 사용
    for (let i = 0; i < 6; i++) {
      const faceValue = specialDiceValue !== undefined ? specialDiceValue : diceConfig.values[i]
      const texture = createFaceTexture(i + 1, faceValue, diceConfig, worldViewColors)
      materials.push(
        new THREE.MeshStandardMaterial({
          map: texture,
          color: '#ffffff',
          metalness: 0.1,
          roughness: 0.8,
          emissive: isHeld ? '#4488ff' : '#000000', // 홀드 상태일 때 파란 빛
          emissiveIntensity: isHeld ? 0.5 : 0,
          // 굴리는 중에도 불투명하게 유지
          transparent: false,
          opacity: 1.0,
        })
      )
    }
    return materials
  }, [diceConfig, worldViewColors, isHeld, isRolling, specialDiceValue])
  
  // 각 면을 별도 geometry로 분리
  const faceGeometries = useMemo(() => {
    if (!(geometry instanceof THREE.BufferGeometry)) {
      return []
    }
    
    const positions = geometry.attributes.position
    const normals = geometry.attributes.normal
    const indices = geometry.index
    
    if (!positions || !normals) {
      return []
    }
    
    // 같은 normal을 가진 삼각형들을 그룹화하여 각 면 생성
    const faceMap = new Map<string, {
      triangles: number[]
      normal: THREE.Vector3
    }>()
    
    const normalKey = (n: THREE.Vector3): string => {
      return `${Math.round(n.x * 1000)},${Math.round(n.y * 1000)},${Math.round(n.z * 1000)}`
    }
    
    const faceCount = indices ? indices.count / 3 : positions.count / 3
    
    for (let i = 0; i < faceCount; i++) {
      // 삼각형의 첫 번째 정점 인덱스로 normal 읽기
      let firstVertexIdx: number
      if (indices) {
        firstVertexIdx = indices.getX(i * 3)
      } else {
        firstVertexIdx = i * 3
      }
      
      const normal = new THREE.Vector3(
        normals.getX(firstVertexIdx),
        normals.getY(firstVertexIdx),
        normals.getZ(firstVertexIdx)
      )
      
      const key = normalKey(normal)
      
      if (!faceMap.has(key)) {
        faceMap.set(key, {
          triangles: [],
          normal: normal.clone()
        })
      }
      
      faceMap.get(key)!.triangles.push(i)
    }
    
    // 각 면의 geometry 생성
    const geometries: THREE.BufferGeometry[] = []
    faceMap.forEach((face) => {
      // 먼저 모든 정점을 수집하여 면의 bounding box 계산
      const allVertices: THREE.Vector3[] = []
      face.triangles.forEach((triIdx) => {
        for (let j = 0; j < 3; j++) {
          let vertexIdx: number
          if (indices) {
            vertexIdx = indices.getX(triIdx * 3 + j)
          } else {
            vertexIdx = triIdx * 3 + j
          }
          
          if (vertexIdx >= 0 && vertexIdx < positions.count) {
            allVertices.push(new THREE.Vector3(
              positions.getX(vertexIdx),
              positions.getY(vertexIdx),
              positions.getZ(vertexIdx)
            ))
          }
        }
      })
      
      if (allVertices.length === 0) {
        return
      }
      
      // 면의 중심과 크기 계산 (normal 방향을 제외한 평면에서)
      const faceNormal = face.normal.clone().normalize()
      const center = new THREE.Vector3()
      allVertices.forEach(v => center.add(v))
      center.divideScalar(allVertices.length)
      
      // 평면상의 좌표계 생성 (normal에 수직인 평면)
      const up = new THREE.Vector3(0, 1, 0)
      const right = new THREE.Vector3().crossVectors(up, faceNormal).normalize()
      if (right.length() < 0.1) {
        // normal이 up과 거의 평행한 경우
        const forward = new THREE.Vector3(1, 0, 0)
        right.crossVectors(forward, faceNormal).normalize()
      }
      const forward = new THREE.Vector3().crossVectors(faceNormal, right).normalize()
      
      // 각 정점을 평면 좌표로 변환하여 bounding box 계산
      let minU = Infinity, maxU = -Infinity
      let minV = Infinity, maxV = -Infinity
      
      allVertices.forEach(v => {
        const offset = v.clone().sub(center)
        const u = offset.dot(right)
        const vCoord = offset.dot(forward)
        minU = Math.min(minU, u)
        maxU = Math.max(maxU, u)
        minV = Math.min(minV, vCoord)
        maxV = Math.max(maxV, vCoord)
      })
      
      const rangeU = maxU - minU || 1
      const rangeV = maxV - minV || 1
      
      // 이제 geometry 생성
      const positionArray: number[] = []
      const normalArray: number[] = []
      const uvArray: number[] = []
      const indexArray: number[] = []
      
      const vertexMap = new Map<string, number>()
      let vertexIndex = 0
      
      face.triangles.forEach((triIdx) => {
        const triVertexIndices: number[] = []
        
        for (let j = 0; j < 3; j++) {
          let vertexIdx: number
          if (indices) {
            vertexIdx = indices.getX(triIdx * 3 + j)
          } else {
            vertexIdx = triIdx * 3 + j
          }
          
          if (vertexIdx >= 0 && vertexIdx < positions.count) {
            const pos = new THREE.Vector3(
              positions.getX(vertexIdx),
              positions.getY(vertexIdx),
              positions.getZ(vertexIdx)
            )
            
            // 정점 키 생성 (중복 제거)
            const key = `${pos.x.toFixed(3)},${pos.y.toFixed(3)},${pos.z.toFixed(3)}`
            
            let idx: number
            if (vertexMap.has(key)) {
              idx = vertexMap.get(key)!
            } else {
              idx = vertexIndex++
              vertexMap.set(key, idx)
              
              positionArray.push(pos.x, pos.y, pos.z)
              normalArray.push(
                normals.getX(vertexIdx),
                normals.getY(vertexIdx),
                normals.getZ(vertexIdx)
              )
              
              // UV 좌표 계산 (평면 좌표를 0-1 범위로 정규화)
              const offset = pos.clone().sub(center)
              const u = (offset.dot(right) - minU) / rangeU
              const v = (offset.dot(forward) - minV) / rangeV
              uvArray.push(u, v)
            }
            
            triVertexIndices.push(idx)
          }
        }
        
        // 삼각형 인덱스 추가
        if (triVertexIndices.length === 3) {
          indexArray.push(triVertexIndices[0], triVertexIndices[1], triVertexIndices[2])
        }
      })
      
      if (positionArray.length === 0) {
        return
      }
      
      const faceGeometry = new THREE.BufferGeometry()
      faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3))
      faceGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalArray, 3))
      faceGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2))
      faceGeometry.setIndex(indexArray)
      geometries.push(faceGeometry)
    })
    
    return geometries
  }, [geometry])
  
  // 물리 바디 생성 (항상 d6이므로 useBox만 사용)
  const [, boxApi] = useBox<THREE.Mesh>(
    () => ({
      mass: 1,
      position,
      args: [DICE_SIZE, DICE_SIZE, DICE_SIZE],
      material: {
        friction: 0.3, // 마찰력 감소 (버벅임 감소)
        restitution: 0.2, // 반발계수 감소 (충돌 시 튕김 감소)
      },
      allowSleep: true, // 정지 상태일 때 물리 계산 생략
      sleepSpeedLimit: 0.5, // 이 속도 이하면 잠들 수 있음
      sleepTimeLimit: 0.1, // 이 시간 동안 정지하면 잠듦
      collisionFilterGroup: 1, // 충돌 그룹 설정
      collisionFilterMask: -1, // 모든 그룹과 충돌
    }),
    meshRef
  )

  const api = boxApi // 항상 boxApi 사용 (d6)
  
  // ref를 통해 외부에서 rollDice 함수 호출 가능하도록 설정
  useImperativeHandle(ref, () => ({
    roll: rollDice
  }))
  
  // 주사위 면의 normal vector를 계산하여 위를 향하는 면 찾기
  const getTopFace = (mesh: THREE.Mesh | null): number => {
    if (!mesh) return 1
    
    // mesh의 현재 rotation 사용
    const rotation = mesh.rotation
    
    const rotationMatrix = new THREE.Matrix4()
    rotationMatrix.makeRotationFromEuler(rotation)
    
    let maxY = -Infinity
    let topFaceIndex = 0
    
    // faceGeometries를 사용하는 경우 (각 면이 별도 geometry)
    if (faceGeometries.length > 0 && faceMeshRefs.current.length > 0) {
      for (let faceIndex = 0; faceIndex < faceGeometries.length; faceIndex++) {
        const faceMesh = faceMeshRefs.current[faceIndex]
        if (!faceMesh || !faceMesh.geometry) continue
        
        const geom = faceMesh.geometry
        if (!(geom instanceof THREE.BufferGeometry)) continue
        
        const normals = geom.attributes.normal
        const positions = geom.attributes.position
        
        if (!normals || !positions || normals.count === 0) continue
        
        // 첫 번째 정점의 normal 사용 (local space)
        const localNormal = new THREE.Vector3(
          normals.getX(0),
          normals.getY(0),
          normals.getZ(0)
        )
        
        // 면의 중심 계산 (local space)
        let centerX = 0, centerY = 0, centerZ = 0
        for (let i = 0; i < positions.count; i++) {
          centerX += positions.getX(i)
          centerY += positions.getY(i)
          centerZ += positions.getZ(i)
        }
        const localCenter = new THREE.Vector3(
          centerX / positions.count,
          centerY / positions.count,
          centerZ / positions.count
        )
        
        // faceMesh의 rotation을 사용하여 world space로 변환
        const faceRotationMatrix = new THREE.Matrix4()
        faceRotationMatrix.makeRotationFromEuler(faceMesh.rotation)
        
        const worldNormal = localNormal.clone().applyMatrix4(faceRotationMatrix)
        const worldCenter = localCenter.clone().applyMatrix4(faceRotationMatrix)
        
        // 위를 향하는 정도 계산 (normal의 y 성분이 중요)
        // 중심의 y 위치도 고려하여 더 정확하게
        const upwardness = worldNormal.y * 0.8 + worldCenter.y * 0.2
        
        if (upwardness > maxY) {
          maxY = upwardness
          topFaceIndex = faceIndex
        }
      }
    } else {
      // 원본 geometry 사용 (fallback)
      const geom = mesh.geometry
      if (geom instanceof THREE.BufferGeometry) {
        const normals = geom.attributes.normal
        const positions = geom.attributes.position
        
        if (normals && positions) {
          const faceCount = normals.count / 3
          
          for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
            const i = faceIndex * 3
            
            const normal = new THREE.Vector3(
              normals.getX(i),
              normals.getY(i),
              normals.getZ(i)
            )
            
            const center = new THREE.Vector3(
              (positions.getX(i) + positions.getX(i + 1) + positions.getX(i + 2)) / 3,
              (positions.getY(i) + positions.getY(i + 1) + positions.getY(i + 2)) / 3,
              (positions.getZ(i) + positions.getZ(i + 1) + positions.getZ(i + 2)) / 3
            )
            
            normal.applyMatrix4(rotationMatrix)
            center.applyMatrix4(rotationMatrix)
            
            const upwardness = normal.y
            
            if (upwardness > maxY) {
              maxY = upwardness
              topFaceIndex = faceIndex
            }
          }
        }
      }
    }
    
    // 면 인덱스는 0부터 시작 (6면)
    return topFaceIndex % 6
  }
  
  // 주사위 굴리기
  const rollDice = () => {
    if (isRolling || isHeld || !api) {
      // 디버깅용 경고는 주석 처리 (너무 많이 출력됨)
      // console.warn('Cannot roll dice:', { isRolling, isHeld, hasApi: !!api })
      return
    }
    
    setIsRolling(true)
    setResult(null)
    
    // 본래 위치로 이동
    api.position.set(...position)
    api.velocity.set(0, 0, 0)
    api.angularVelocity.set(0, 0, 0)
    
    // 랜덤 각속도
    const initialAngularVelocity: [number, number, number] = [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    ]
    
    // 가운데(0, 0, 0)를 향하는 방향 벡터 계산 (본래 위치 기준)
    const centerX = 0
    const centerY = 0 // 바닥 높이
    const centerZ = 0
    const dx = centerX - position[0]
    const dy = centerY - position[1]
    const dz = centerZ - position[2]
    
    // 방향 벡터 정규화
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const normalizedDx = distance > 0.1 ? dx / distance : 0
    const normalizedDy = distance > 0.1 ? dy / distance : 0
    const normalizedDz = distance > 0.1 ? dz / distance : 0
    
    // 가운데를 향하는 힘 (약간의 랜덤성 추가)
    const baseSpeed = 5 + Math.random() * 5
    const randomVariation = 0.15 // 15% 랜덤 변동
    const forceX = normalizedDx * baseSpeed * (1 + (Math.random() - 0.5) * randomVariation)
    const forceY = normalizedDy * baseSpeed * (1 + (Math.random() - 0.5) * randomVariation) + 3 // 위로 던지기
    const forceZ = normalizedDz * baseSpeed * (1 + (Math.random() - 0.5) * randomVariation)
    
    api.velocity.set(forceX, forceY, forceZ)
    api.angularVelocity.set(...initialAngularVelocity)
  }
  
  // 속도 모니터링 (정지 감지)
  useEffect(() => {
    if (!isRolling || !api) return
    
    let angularVelocityCache: [number, number, number] = [0, 0, 0]
    
    // 각속도 구독
    const angularUnsubscribe = api.angularVelocity.subscribe((angularVel: [number, number, number]) => {
      angularVelocityCache = angularVel
    })
    
    const unsubscribe = api.velocity.subscribe((velocity: [number, number, number]) => {
      const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2)
      const angularSpeed = Math.sqrt(
        angularVelocityCache[0] ** 2 +
        angularVelocityCache[1] ** 2 +
        angularVelocityCache[2] ** 2
      )
      
      // 완전히 정지했을 때
      if (speed < 0.1 && angularSpeed < 0.5) {
        setTimeout(() => {
          if (meshRef.current && api) {
            const topFaceIndex = getTopFace(meshRef.current)
            // 특수 주사위인 경우 특수 주사위 값 사용, 아니면 주사위 타입의 values에서 실제 값 가져오기
            const topFaceValue = specialDiceValue !== undefined ? specialDiceValue : diceConfig.values[topFaceIndex]
            
            setResult(topFaceValue)
            setIsRolling(false)
            
            // 정지 상태로 만들기 (위치는 그대로 유지)
            api.velocity.set(0, 0, 0)
            api.angularVelocity.set(0, 0, 0)
            
            if (onRoll) {
              onRoll(topFaceValue)
            }
          }
        }, 300)
      }
    })
    
    return () => {
      unsubscribe()
      angularUnsubscribe()
    }
  }, [isRolling, api, position, onRoll, specialDiceValue, diceConfig])
  
  // 경계 제한
  useEffect(() => {
    if (!api) return
    
    let velocityCache = [0, 0, 0]
    const velocityUnsub = api.velocity.subscribe((v: [number, number, number]) => {
      velocityCache = v
    })
    
    const positionUnsub = api.position.subscribe((position: [number, number, number]) => {
      // 카드 비율에 맞춘 경계 크기 (63:88 비율)
      const wallSizeZ = 3 // 세로 (Z축)
      const wallSizeX = wallSizeZ * (63/88) // 가로 (X축) - 카드 비율 적용
      const [x, y, z] = position
      
      if (x > wallSizeX || x < -wallSizeX || z > wallSizeZ || z < -wallSizeZ) {
        api.position.set(
          Math.max(-wallSizeX, Math.min(wallSizeX, x)),
          y,
          Math.max(-wallSizeZ, Math.min(wallSizeZ, z))
        )
        api.velocity.set(
          velocityCache[0] * 0.5,
          velocityCache[1],
          velocityCache[2] * 0.5
        )
      }
    })
    
    return () => {
      velocityUnsub()
      positionUnsub()
    }
  }, [api])
  
  // 각 면 mesh의 refs (물리 바디 동기화용)
  const faceMeshRefs = useRef<Array<THREE.Mesh | null>>([])
  
  // emissive 효과 실시간 업데이트 (홀드 상태일 때만 파란 빛)
  useEffect(() => {
    faceMaterials.forEach((material) => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.emissive.set(isHeld ? '#4488ff' : '#000000')
        material.emissiveIntensity = isHeld ? 0.5 : 0
        material.transparent = false
        material.opacity = 1.0
        material.needsUpdate = true
      }
    })
  }, [isHeld, faceMaterials])
  
  // 물리 바디와 모든 면 mesh 동기화
  useEffect(() => {
    if (!meshRef.current || !api) return
    
    const positionUnsub = api.position.subscribe((position: [number, number, number]) => {
      if (meshRef.current) {
        meshRef.current.position.set(position[0], position[1], position[2])
      }
      faceMeshRefs.current.forEach((faceMesh) => {
        if (faceMesh) {
          faceMesh.position.set(position[0], position[1], position[2])
        }
      })
    })
    
    const rotationUnsub = api.rotation.subscribe((rotation: [number, number, number]) => {
      if (meshRef.current) {
        meshRef.current.rotation.set(rotation[0], rotation[1], rotation[2])
      }
      faceMeshRefs.current.forEach((faceMesh) => {
        if (faceMesh) {
          faceMesh.rotation.set(rotation[0], rotation[1], rotation[2])
        }
      })
    })
    
    return () => {
      positionUnsub()
      rotationUnsub()
    }
  }, [api])
  
  // 주사위 위치 추적 (빛 효과용)
  const [dicePosition, setDicePosition] = useState<[number, number, number]>(position)
  
  useEffect(() => {
    if (!api) return
    
    const positionUnsub = api.position.subscribe((pos: [number, number, number]) => {
      setDicePosition(pos)
    })
    
    return () => {
      positionUnsub()
    }
  }, [api])
  
  // 홀드 토글 함수
  const toggleHold = () => {
    if (isRolling) return // 굴리는 중에는 홀드 불가
    setIsHeld(prev => !prev)
  }
  
  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        if (isHeld) {
          toggleHold() // 홀드 해제
        } else if (!isRolling) {
          toggleHold() // 홀드 설정
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {isHeld && (
        <pointLight
          position={[dicePosition[0], dicePosition[1] + 0.5, dicePosition[2]]}
          intensity={2}
          distance={3}
          color="#4488ff"
          decay={2}
        />
      )}
      
      {faceGeometries.length > 0 ? (
        faceGeometries.map((faceGeometry, index) => (
          <mesh
            key={`face-${index}`}
            ref={(el) => {
              faceMeshRefs.current[index] = el
              if (index === 0 && el) {
                ;(meshRef as React.MutableRefObject<THREE.Mesh | null>).current = el
              }
            }}
            geometry={faceGeometry}
            material={faceMaterials[index % faceMaterials.length]}
            castShadow
          />
        ))
      ) : (
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={faceMaterials[0]}
          castShadow
        />
      )}
      
      {!isRolling && result && (
        <mesh position={[0, DICE_SIZE * 2.5, 0]}>
          <planeGeometry args={[DICE_SIZE * 1.5, DICE_SIZE * 0.75]} />
          <meshBasicMaterial color="#000000" opacity={0.8} transparent />
        </mesh>
      )}
    </group>
  )
})

Dice.displayName = 'Dice'

import { getDiceTypeForWorldView, getDiceConfig, type DiceType } from '../constants/diceTypes'
import { getWorldViewColors, type WorldView } from '../constants/worldViews'

interface Dice3DSceneProps {
  diceList: Array<{ id: string; theme: 'fantasy' | 'cyberpunk' | 'steampunk' | 'apocalypse' | 'futuristic'; position: [number, number, number] }>
  onDiceRoll?: (id: string, result: number) => void
  onRollAllReady?: (rollAll: () => void) => void
  attackerChar?: { imageUrl?: string | null; imageData?: string | null; name: string; worldView?: WorldView }
  overlayMode?: boolean // 오버레이 모드 (캐릭터 이미지 위에 표시)
  specialDiceValue?: number // 특수 주사위 값 (모든 면이 이 값)
}

export default function Dice3DScene({ diceList, onDiceRoll, onRollAllReady, attackerChar, overlayMode = false, specialDiceValue }: Dice3DSceneProps) {
  const diceRefs = useRef<Map<string, DiceRef>>(new Map())
  const [diceResults, setDiceResults] = useState<Map<string, number>>(new Map())
  const [rollingDice, setRollingDice] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
  
  // 공격자의 세계관에 따른 주사위 타입 결정
  const diceType: DiceType = useMemo(() => {
    if (attackerChar?.worldView) {
      return getDiceTypeForWorldView(attackerChar.worldView)
    }
    return 'arcane' // 기본값
  }, [attackerChar?.worldView])
  
  // 주사위 설정 가져오기
  const diceConfig = useMemo(() => getDiceConfig(diceType), [diceType])
  
  // 세계관 색상 팔레트 가져오기
  const worldViewColors = useMemo(() => {
    if (attackerChar?.worldView) {
      return getWorldViewColors(attackerChar.worldView)
    }
    return null
  }, [attackerChar?.worldView])
  
  // 모든 주사위 굴리기 함수
  const rollAllDice = () => {
    setDiceResults(new Map()) // 결과 초기화
    
    // 모든 주사위를 굴립니다
    setRollingDice(new Set(diceList.map(d => d.id))) // 모든 주사위를 굴리는 중으로 표시
    diceRefs.current.forEach((ref) => {
      // ref가 존재하고 roll 함수가 있는 경우에만 호출
      if (ref && typeof ref.roll === 'function') {
        try {
          ref.roll()
        } catch (error) {
          console.warn('Failed to roll dice:', error)
        }
      }
    })
  }
  
  // 주사위 굴리기 결과 처리
  const handleDiceResult = (diceId: string, result: number) => {
    setDiceResults(prev => {
      const newResults = new Map(prev)
      newResults.set(diceId, result)
      return newResults
    })
    setRollingDice(prev => {
      const newRolling = new Set(prev)
      newRolling.delete(diceId)
      return newRolling
    })
    onDiceRoll?.(diceId, result)
  }
  
  // 모든 주사위가 정지했는지 확인
  const allDiceStopped = diceList.length > 0 && 
    rollingDice.size === 0 && 
    diceResults.size === diceList.length
  
  // 합계 계산
  const totalSum = useMemo(() => {
    let sum = 0
    diceResults.forEach((result) => {
      sum += result
    })
    return sum
  }, [diceResults])
  
  // rollAllDice 함수를 부모 컴포넌트에 전달
  useEffect(() => {
    if (onRollAllReady) {
      onRollAllReady(rollAllDice)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRollAllReady, diceList.length])
  
  // 주사위 목록이 변경되면 결과 초기화
  useEffect(() => {
    setDiceResults(new Map())
    setRollingDice(new Set())
  }, [diceList.length])

  // 컨테이너 크기 측정 (오버레이 모드일 때)
  useEffect(() => {
    if (!overlayMode || !containerRef.current) return

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [overlayMode])
  
  // 오버레이 모드일 때는 부모 컨테이너 크기에 맞춤, 아닐 때는 카드 비율 사용
  const cardAspectRatio = 63 / 88
  const trayHeight = overlayMode ? undefined : 600
  const trayWidth = overlayMode ? undefined : trayHeight! * cardAspectRatio

  return (
    <div 
      ref={containerRef}
      className={`${overlayMode ? 'absolute inset-0' : 'w-full relative mx-auto'} rounded-lg overflow-hidden`}
      style={overlayMode ? {} : {
        height: `${trayHeight}px`,
        maxWidth: `${trayWidth}px`,
        aspectRatio: `${cardAspectRatio}`,
      }}
    >
      {/* 캐릭터 이미지 배경 - base64 우선 사용 (CORS 문제 방지) */}
      {attackerChar && (
        <div className="absolute inset-0 z-0">
          {attackerChar.imageData ? (
            <img
              src={`data:image/png;base64,${attackerChar.imageData}`}
              alt={attackerChar.name}
              className="w-full h-full object-cover"
            />
          ) : attackerChar.imageUrl ? (
            <img
              src={attackerChar.imageUrl}
              alt={attackerChar.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // CORS 오류 시 이미지 숨김
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : null}
        </div>
      )}
      <Canvas camera={{ position: [0, 5, 0], rotation: [-Math.PI / 2, 0, 0], fov: 40 }} gl={{ antialias: true, alpha: overlayMode }} shadows>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
          <directionalLight position={[-5, 10, -5]} intensity={0.5} />
          <Physics gravity={[0, -20, 0]} defaultContactMaterial={{ friction: 0.3, restitution: 0.2, contactEquationStiffness: 1e8, contactEquationRelaxation: 3 }} iterations={10} tolerance={0.001} allowSleep={true} broadphase="Naive">
            <Floor />
            <Walls cardAspectRatio={overlayMode ? (containerSize ? containerSize.width / containerSize.height : 0.8) : 63/88} containerWidth={overlayMode ? containerSize?.width : undefined} containerHeight={overlayMode ? containerSize?.height : undefined} />
            {diceList.map((dice) => (
              <Dice key={dice.id} ref={(ref) => { if (ref) { diceRefs.current.set(dice.id, ref) } else { diceRefs.current.delete(dice.id) } }} diceType={diceType} diceConfig={diceConfig} worldViewColors={worldViewColors} position={dice.position} onRoll={(result) => handleDiceResult(dice.id, result)} specialDiceValue={specialDiceValue} />
            ))}
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  )
}
