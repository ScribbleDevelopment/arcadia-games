'use client'

import { Canvas } from '@react-three/fiber'
import { Float, OrbitControls, Stars } from '@react-three/drei'
import type { ReactNode } from 'react'
import type { GameGenre } from '@/lib/games'

type StageMode = GameGenre
export type GameStageState = {
  activeIndex?: number
  board?: string[]
  openIndices?: number[]
  matchedIndices?: number[]
  symbols?: string[]
  growth?: number[]
  lane?: number
  hazard?: number
  meter?: number
  goal?: number
  hp?: number
  enemyHp?: number
  progress?: number
  score?: number
}

type StageProps = {
  mode: StageMode
  title: string
  state?: GameStageState
  onAction: (index: number) => void
}

function BaseWorld() {
  return (
    <>
      <color attach="background" args={['#050b17']} />
      <fog attach="fog" args={['#050b17', 13, 28]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 9, 6]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-5, 4, -4]} color="#22d3ee" intensity={22} distance={14} />
      <pointLight position={[5, 3, 3]} color="#e879f9" intensity={14} distance={13} />
      <Stars radius={55} depth={28} count={600} factor={3} saturation={0.5} fade speed={0.4} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#07101f" metalness={0.45} roughness={0.72} />
      </mesh>
      <gridHelper args={[20, 32, '#164e63', '#102033']} position={[0, -0.16, 0]} />
    </>
  )
}

function Pad({ position, color, onClick, children, scale = [1, 0.24, 1] }: { position: [number, number, number]; color: string; onClick: () => void; children?: ReactNode; scale?: [number, number, number] }) {
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onClick() }}>
      <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.58, 0.72, 0.2, 6]} />
        <meshStandardMaterial color="#0d1728" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.1, 0]} scale={scale} castShadow>
        <boxGeometry args={[1, 0.16, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.48} metalness={0.35} roughness={0.3} />
      </mesh>
      {children}
    </group>
  )
}

function TargetWorld({ state, onAction }: Pick<StageProps, 'state' | 'onAction'>) {
  const active = state?.activeIndex ?? 4
  return <>{Array.from({ length: 9 }, (_, index) => {
    const x = (index % 3 - 1) * 1.7
    const z = (Math.floor(index / 3) - 1) * 1.7
    const isActive = index === active
    return <group key={index} position={[x, 0, z]} onClick={(event) => { event.stopPropagation(); onAction(index) }}>
      <Pad position={[0, 0, 0]} color={isActive ? '#22d3ee' : '#16253a'} onClick={() => onAction(index)}>
        {isActive ? <Float speed={3} rotationIntensity={0.25} floatIntensity={0.3}><mesh position={[0, 0.75, 0]} castShadow><icosahedronGeometry args={[0.34, 1]} /><meshStandardMaterial color="#a5f3fc" emissive="#22d3ee" emissiveIntensity={1.6} metalness={0.25} roughness={0.15} /></mesh></Float> : null}
      </Pad>
    </group>
  })}</>
}

function BoardWorld({ state, onAction, memory = false }: Pick<StageProps, 'state' | 'onAction'> & { memory?: boolean }) {
  const count = memory ? 12 : 9
  const columns = memory ? 4 : 3
  return <>{Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns)
    const x = (index % columns - (columns - 1) / 2) * (memory ? 1.38 : 1.72)
    const z = (row - (Math.ceil(count / columns) - 1) / 2) * (memory ? 1.46 : 1.72)
    const mark = state?.board?.[index] ?? ''
    const visible = Boolean(mark) || state?.openIndices?.includes(index) || state?.matchedIndices?.includes(index)
    const symbol = state?.symbols?.[index] ?? ''
    const symbolColors = ['#22d3ee', '#e879f9', '#a78bfa', '#fbbf24', '#fb7185', '#34d399']
    const color = state?.matchedIndices?.includes(index) ? '#34d399' : memory && visible ? symbolColors[Math.max(0, ['◇', '○', '△', '✦', '□', '⬡'].indexOf(symbol))] : mark === 'X' ? '#22d3ee' : mark === 'O' ? '#e879f9' : '#14243a'
    return <group key={index} position={[x, 0, z]} onClick={(event) => { event.stopPropagation(); onAction(index) }}>
      <Pad position={[0, 0, 0]} color={color} scale={memory ? [0.9, 0.18, 1] : [1, 0.2, 1]} onClick={() => onAction(index)}>
        {visible && memory ? <mesh position={[0, 0.56, 0]} castShadow><dodecahedronGeometry args={[0.28, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} metalness={0.45} roughness={0.25} /></mesh> : null}
        {!memory && mark === 'X' ? <group position={[0, 0.47, 0]} rotation={[0, 0, Math.PI / 4]}><mesh castShadow><boxGeometry args={[0.12, 0.68, 0.12]} /><meshStandardMaterial color="#a5f3fc" emissive="#22d3ee" emissiveIntensity={0.7} /></mesh><mesh rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.12, 0.68, 0.12]} /><meshStandardMaterial color="#a5f3fc" emissive="#22d3ee" emissiveIntensity={0.7} /></mesh></group> : null}
        {!memory && mark === 'O' ? <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.28, 0.07, 12, 32]} /><meshStandardMaterial color="#f0abfc" emissive="#e879f9" emissiveIntensity={0.8} /></mesh> : null}
      </Pad>
    </group>
  })}</>
}

function RaceWorld({ state, onAction }: Pick<StageProps, 'state' | 'onAction'>) {
  return <>
    {[-1, 1].map((lane) => <group key={lane} position={[lane * 1.15, 0, 0]}>
      <mesh position={[0, 0, -0.4]} receiveShadow><boxGeometry args={[1.75, 0.12, 9]} /><meshStandardMaterial color="#111c2d" metalness={0.35} roughness={0.55} /></mesh>
      <mesh position={[0, 0.08, -2.2]}><boxGeometry args={[0.04, 0.03, 8]} /><meshStandardMaterial color="#64748b" emissive="#94a3b8" emissiveIntensity={0.2} /></mesh>
      <group position={[0, 0.52, state?.hazard === (lane === -1 ? 0 : 1) ? -1.35 : -3.2]}>
        <mesh castShadow><boxGeometry args={[0.72, 0.72, 0.7]} /><meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.6} metalness={0.25} roughness={0.25} /></mesh>
        <mesh position={[0, 0.12, 0.36]}><boxGeometry args={[0.38, 0.14, 0.04]} /><meshStandardMaterial color="#ffe4e6" emissive="#fecdd3" emissiveIntensity={0.8} /></mesh>
      </group>
      <Pad position={[0, 0, 2.1]} color={state?.lane === (lane === -1 ? 0 : 1) ? '#22d3ee' : '#163047'} onClick={() => onAction(lane === -1 ? 0 : 1)}>
        {state?.lane === (lane === -1 ? 0 : 1) ? <mesh position={[0, 0.72, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.32, 0.78, 5]} /><meshStandardMaterial color="#a5f3fc" emissive="#22d3ee" emissiveIntensity={1.1} /></mesh> : null}
      </Pad>
    </group>)}
  </>
}

function CombatWorld({ mode, state, onAction }: Pick<StageProps, 'mode' | 'state' | 'onAction'>) {
  const actions = mode === 'rpg' ? ['STRIKE', 'POTION', 'GUARD'] : ['QUICK', 'CHARGE', 'EVADE']
  const colors = ['#22d3ee', '#fbbf24', '#e879f9']
  return <>
    <mesh position={[0, 1.1, -1.5]} castShadow><icosahedronGeometry args={[0.9, 2]} /><meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.65} roughness={0.25} metalness={0.5} /></mesh>
    <mesh position={[-2.25, 0.75, 0]} castShadow><capsuleGeometry args={[0.38, 0.9, 6, 12]} /><meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.45} metalness={0.65} roughness={0.28} /></mesh>
    <mesh position={[-2.25, 1.42, 0]} castShadow><sphereGeometry args={[0.36, 20, 20]} /><meshStandardMaterial color="#a5f3fc" emissive="#22d3ee" emissiveIntensity={0.6} /></mesh>
    <mesh position={[0, 0.025, -1.5]}><ringGeometry args={[1.15, 1.32, 48]} /><meshBasicMaterial color="#f472b6" transparent opacity={0.55} /></mesh>
    {actions.map((label, index) => <group key={label} position={[(index - 1) * 1.95, 0, 2.5]}>
      <Pad position={[0, 0, 0]} color={colors[index]} onClick={() => onAction(index)}>
        <mesh position={[0, 0.52, 0]} castShadow><octahedronGeometry args={[0.22 + (index === 0 ? Math.min(state?.score ?? 0, 3) * 0.025 : 0)]} /><meshStandardMaterial color="#f8fafc" emissive={colors[index]} emissiveIntensity={1.15} /></mesh>
      </Pad>
    </group>)}
    <mesh position={[2.9, 1.1, -1.4]} castShadow><boxGeometry args={[0.22, 1.3, 0.15]} /><meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={0.45} /></mesh>
    <mesh position={[2.4, 1.85, -1.4]}><boxGeometry args={[1.05, 0.09, 0.16]} /><meshStandardMaterial color="#334155" /></mesh>
    <mesh position={[2.4 - (1 - Math.max(0, state?.enemyHp ?? 1)) * 0.45, 1.85, -1.29]}><boxGeometry args={[Math.max(0.04, (state?.enemyHp ?? 1) * 0.9), 0.07, 0.05]} /><meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.8} /></mesh>
    <mesh position={[-2.25, 1.95, 0]}><boxGeometry args={[1.25, 0.1, 0.1]} /><meshStandardMaterial color="#1e293b" /></mesh>
    <mesh position={[-2.25 - (1 - Math.max(0, state?.hp ?? 1)) * 0.55, 1.95, 0.08]}><boxGeometry args={[Math.max(0.04, (state?.hp ?? 1) * 1.1), 0.08, 0.04]} /><meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={0.8} /></mesh>
  </>
}

function SportsWorld({ state, onAction }: Pick<StageProps, 'state' | 'onAction'>) {
  return <>
    <mesh position={[0, 1.2, -3]}><torusGeometry args={[1.4, 0.08, 12, 48]} /><meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.7} /></mesh>
    <mesh position={[-1.45, 0.7, -3]}><boxGeometry args={[0.12, 1.6, 0.14]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
    <mesh position={[1.45, 0.7, -3]}><boxGeometry args={[0.12, 1.6, 0.14]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
    <mesh position={[0, 1.95, -3]}><boxGeometry args={[3, 0.12, 0.14]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
    <mesh position={[((state?.meter ?? 50) - 50) / 24, 0.35, 0.5]} castShadow onClick={(event) => { event.stopPropagation(); onAction(0) }}><sphereGeometry args={[0.42, 28, 20]} /><meshStandardMaterial color="#a5f3fc" emissive="#22d3ee" emissiveIntensity={0.7} metalness={0.3} roughness={0.2} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><circleGeometry args={[3, 48]} /><meshStandardMaterial color="#0f2a2c" metalness={0.2} roughness={0.65} /></mesh>
  </>
}

function AdventureWorld({ state, onAction }: Pick<StageProps, 'state' | 'onAction'>) {
  return <>{[0, 1, 2].map((index) => {
    const x = (index - 1) * 2.25
    const colors = ['#22d3ee', '#a78bfa', '#f472b6']
    return <group key={index} position={[x, 0, -0.4]} onClick={(event) => { event.stopPropagation(); onAction(index) }}>
      <mesh position={[0, 1.15, 0]} castShadow><torusGeometry args={[0.68, 0.12, 16, 40]} /><meshStandardMaterial color={colors[index]} emissive={colors[index]} emissiveIntensity={0.75} metalness={0.35} roughness={0.2} /></mesh>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.82, 1, 0.22, 6]} /><meshStandardMaterial color="#111c2d" metalness={0.55} roughness={0.4} /></mesh>
      <mesh position={[0, 1.15, -0.12]}><circleGeometry args={[0.48, 32]} /><meshBasicMaterial color={colors[index]} transparent opacity={0.27 + Math.min(state?.progress ?? 0, 4) * 0.05} /></mesh>
    </group>
  })}</>
}

function CardWorld({ onAction }: Pick<StageProps, 'onAction'>) {
  return <>{[-1, 1].map((side, index) => <group key={side} position={[side * 1.45, 0.8, 0]} rotation={[0, side * -0.18, side * -0.08]} onClick={(event) => { event.stopPropagation(); onAction(index) }}>
    <mesh castShadow><boxGeometry args={[1.55, 2.15, 0.13]} /><meshStandardMaterial color={index ? '#17243a' : '#0e2740'} metalness={0.45} roughness={0.25} emissive={index ? '#6d28d9' : '#0891b2'} emissiveIntensity={0.22} /></mesh>
    <mesh position={[0, 0, 0.08]}><torusGeometry args={[0.36, 0.06, 12, 32]} /><meshStandardMaterial color={index ? '#e879f9' : '#67e8f9'} emissive={index ? '#d946ef' : '#06b6d4'} emissiveIntensity={0.9} /></mesh>
  </group>)}</>
}

function GardenWorld({ state, onAction }: Pick<StageProps, 'state' | 'onAction'>) {
  return <>{[0, 1, 2].map((index) => {
    const height = 0.6 + Math.min(state?.growth?.[index] ?? 0, 4) * 0.18
    const x = (index - 1) * 1.9
    return <group key={index} position={[x, 0, 0]} onClick={(event) => { event.stopPropagation(); onAction(index) }}>
      <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.38, 0.56, 0.52, 8]} /><meshStandardMaterial color="#a34d38" roughness={0.8} /></mesh>
      <mesh position={[0, height / 2 + 0.42, 0]} castShadow><cylinderGeometry args={[0.045, 0.07, height, 8]} /><meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.25} /></mesh>
      <mesh position={[0.2, height * 0.65 + 0.38, 0]} rotation={[0, 0, -0.72]} castShadow><sphereGeometry args={[0.22 + Math.min(state?.growth?.[index] ?? 0, 4) * 0.018, 16, 12]} /><meshStandardMaterial color={['#a78bfa', '#f472b6', '#fbbf24'][index]} emissive={['#7c3aed', '#db2777', '#d97706'][index]} emissiveIntensity={0.55} /></mesh>
      <mesh position={[-0.18, height * 0.42 + 0.38, 0]} rotation={[0, 0, 0.72]}><sphereGeometry args={[0.16, 14, 10]} /><meshStandardMaterial color="#4ade80" emissive="#16a34a" emissiveIntensity={0.25} /></mesh>
      <Pad position={[0, 0, 0.8]} color="#10b981" onClick={() => onAction(index)} scale={[0.62, 0.14, 0.42]} />
    </group>
  })}</>
}

function Scene({ mode, state, onAction }: StageProps) {
  if (mode === 'arcade') return <TargetWorld state={state} onAction={onAction} />
  if (mode === 'puzzle') return <BoardWorld state={state} onAction={onAction} memory />
  if (mode === 'strategy') return <BoardWorld state={state} onAction={onAction} />
  if (mode === 'racing') return <RaceWorld state={state} onAction={onAction} />
  if (mode === 'action' || mode === 'rpg') return <CombatWorld mode={mode} state={state} onAction={onAction} />
  if (mode === 'sports') return <SportsWorld state={state} onAction={onAction} />
  if (mode === 'adventure') return <AdventureWorld state={state} onAction={onAction} />
  if (mode === 'card') return <CardWorld onAction={onAction} />
  return <GardenWorld state={state} onAction={onAction} />
}

export function GameStage({ mode, title, state, onAction }: StageProps) {
  return (
    <div role="group" aria-label={`${title} three-dimensional game board`} className="h-[min(68vh,760px)] min-h-[24rem] w-full overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-[#050b17] shadow-[inset_0_0_60px_rgba(8,145,178,.08)]">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 8.2, 10.2], fov: 43 }}>
        <BaseWorld />
        <Scene mode={mode} title={title} state={state} onAction={onAction} />
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.72} maxPolarAngle={1.22} minAzimuthAngle={-0.4} maxAzimuthAngle={0.4} target={[0, 0.3, 0]} />
      </Canvas>
    </div>
  )
}
