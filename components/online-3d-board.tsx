'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'

type Online3DBoardProps = {
  gameSlug: string
  board: string[]
  canMove: boolean
  onMove: (cell: number) => void
}

function ConnectFourWorld({ board, canMove, onMove }: Omit<Online3DBoardProps, 'gameSlug'>) {
  const spacing = 0.88
  const openColumn = (column: number) => {
    if (canMove && !board[column]) onMove(column)
  }
  return <>
    <mesh position={[0, 0.08, 0]} receiveShadow castShadow><boxGeometry args={[7.5, 0.34, 6.35]} /><meshStandardMaterial color="#123c62" metalness={0.7} roughness={0.25} /></mesh>
    <mesh position={[0, 0.28, 0]}><boxGeometry args={[7.25, 0.12, 6.05]} /><meshStandardMaterial color="#0c2340" metalness={0.45} roughness={0.35} /></mesh>
    {board.map((mark, index) => {
      const row = Math.floor(index / 7)
      const column = index % 7
      const x = (column - 3) * spacing
      const z = (row - 2.5) * spacing
      return <group key={index} position={[x, 0.48, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.32, 0.06, 12, 28]} /><meshStandardMaterial color="#1e466a" metalness={0.35} roughness={0.38} /></mesh>
        {mark ? <mesh position={[0, 0.04, 0]} scale={[1, 0.35, 1]} castShadow><sphereGeometry args={[0.31, 24, 16]} /><meshStandardMaterial color={mark === 'X' ? '#22d3ee' : '#e879f9'} emissive={mark === 'X' ? '#0891b2' : '#c026d3'} emissiveIntensity={0.6} metalness={0.35} roughness={0.24} /></mesh> : null}
      </group>
    })}
    {Array.from({ length: 7 }, (_, column) => <mesh key={column} position={[(column - 3) * spacing, 2, 0]} onClick={(event) => { event.stopPropagation(); openColumn(column) }}>
      <boxGeometry args={[spacing * 0.95, 3.8, 0.8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>)}
  </>
}

function TacticalGridWorld({ board, canMove, onMove }: Omit<Online3DBoardProps, 'gameSlug'>) {
  const spacing = 1.55
  return <>
    <mesh position={[0, 0.06, 0]} receiveShadow castShadow><boxGeometry args={[5.4, 0.24, 5.4]} /><meshStandardMaterial color="#101d30" metalness={0.55} roughness={0.35} /></mesh>
    {board.map((mark, index) => {
      const x = (index % 3 - 1) * spacing
      const z = (Math.floor(index / 3) - 1) * spacing
      return <group key={index} position={[x, 0.25, z]} onClick={(event) => { event.stopPropagation(); if (canMove && !mark) onMove(index) }}>
        <mesh castShadow><boxGeometry args={[1.35, 0.18, 1.35]} /><meshStandardMaterial color="#14243a" metalness={0.35} roughness={0.4} /></mesh>
        {mark === 'X' ? <group position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 4]}><mesh><boxGeometry args={[0.16, 0.8, 0.16]} /><meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={0.65} /></mesh><mesh rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.16, 0.8, 0.16]} /><meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={0.65} /></mesh></group> : null}
        {mark === 'O' ? <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.36, 0.1, 12, 28]} /><meshStandardMaterial color="#f0abfc" emissive="#d946ef" emissiveIntensity={0.65} /></mesh> : null}
      </group>
    })}
  </>
}

function FiveInARowWorld({ board, canMove, onMove }: Omit<Online3DBoardProps, 'gameSlug'>) {
  const spacing = 0.48
  return <>
    <mesh position={[0, 0.04, 0]} receiveShadow castShadow><boxGeometry args={[7.7, 0.24, 7.7]} /><meshStandardMaterial color="#3a271e" metalness={0.25} roughness={0.78} /></mesh>
    <mesh position={[0, 0.19, 0]}><boxGeometry args={[7.45, 0.08, 7.45]} /><meshStandardMaterial color="#76503a" metalness={0.15} roughness={0.72} /></mesh>
    {board.map((mark, index) => {
      const row = Math.floor(index / 15)
      const column = index % 15
      const x = (column - 7) * spacing
      const z = (row - 7) * spacing
      return <group key={index} position={[x, 0.27, z]} onClick={(event) => { event.stopPropagation(); if (canMove && !mark) onMove(index) }}>
        <mesh><cylinderGeometry args={[0.16, 0.16, 0.06, 16]} /><meshStandardMaterial color={mark ? '#5c4030' : '#916c51'} roughness={0.72} /></mesh>
        {mark === 'X' ? <group position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 4]}><mesh><boxGeometry args={[0.065, 0.27, 0.065]} /><meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={0.55} metalness={0.4} /></mesh><mesh rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.065, 0.27, 0.065]} /><meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={0.55} metalness={0.4} /></mesh></group> : null}
        {mark === 'O' ? <mesh position={[0, 0.1, 0]}><torusGeometry args={[0.115, 0.045, 10, 20]} /><meshStandardMaterial color="#f0abfc" emissive="#d946ef" emissiveIntensity={0.6} metalness={0.4} /></mesh> : null}
      </group>
    })}
  </>
}

export function Online3DBoard({ gameSlug, board, canMove, onMove }: Online3DBoardProps) {
  const isConnectFour = gameSlug === 'connect-four'
  const isFiveInARow = gameSlug === 'five-in-a-row'
  const gameTitle = isConnectFour ? 'Connect Four' : isFiveInARow ? 'Five in a Row' : 'Grid Tactics'
  return (
    <div role="group" aria-label={`${gameTitle} three-dimensional live board`} className="mt-5 h-[min(64vh,680px)] min-h-[22rem] overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#050b17]">
      <Canvas shadows dpr={[1, 1.4]} camera={{ position: [0, 8.8, 10.5], fov: 43 }}>
        <color attach="background" args={['#050b17']} />
        <fog attach="fog" args={['#050b17', 14, 30]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[5, 9, 6]} intensity={2.2} castShadow />
        <pointLight position={[-4, 4, -3]} color="#22d3ee" intensity={18} distance={14} />
        <pointLight position={[4, 3, 4]} color="#e879f9" intensity={10} distance={12} />
        <Stars radius={45} depth={24} count={360} factor={2.4} saturation={0.45} fade speed={0.25} />
        {isConnectFour ? <ConnectFourWorld board={board} canMove={canMove} onMove={onMove} /> : isFiveInARow ? <FiveInARowWorld board={board} canMove={canMove} onMove={onMove} /> : <TacticalGridWorld board={board} canMove={canMove} onMove={onMove} />}
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.72} maxPolarAngle={1.22} minAzimuthAngle={-0.35} maxAzimuthAngle={0.35} target={[0, 0.2, 0]} />
      </Canvas>
    </div>
  )
}
