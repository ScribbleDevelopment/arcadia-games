'use client'

import { useState } from 'react'
import { GameStage } from '@/components/three-game-stage'

const encounters = ['Rift Scout', 'Crimson Lancer', 'The Gatekeeper', 'Hollow Regent', 'Astral Colossus', 'The Rift Warden']
const enemyMaxHealth = (encounter: number, seed: number) => 8 + encounter * 2 + (seed % 3)

type RiftPhase = 'battle' | 'upgrade' | 'victory' | 'defeat'

export function RiftWardenGame({ seed }: { seed: number }) {
  const [encounter, setEncounter] = useState(0)
  const [enemyHp, setEnemyHp] = useState(enemyMaxHealth(0, seed))
  const [health, setHealth] = useState(18)
  const [charge, setCharge] = useState(3)
  const [weapon, setWeapon] = useState(2)
  const [relics, setRelics] = useState(0)
  const [turn, setTurn] = useState(0)
  const [phase, setPhase] = useState<RiftPhase>('battle')
  const [message, setMessage] = useState('Strike, spend charge for a pulse, or brace to blunt the next hit. Boss patterns change after every encounter.')

  const act = (action: number) => {
    if (phase !== 'battle') return
    const damage = action === 0 ? weapon + 2 : action === 1 && charge > 0 ? weapon + 5 : 0
    if (action === 1 && charge === 0) {
      setMessage('The pulse cell is empty. Strike or brace to rebuild one charge.')
      return
    }
    const remainingEnemyHp = Math.max(0, enemyHp - damage)
    setTurn((value) => value + 1)
    if (action === 1) setCharge((value) => value - 1)
    if (remainingEnemyHp === 0) {
      if (encounter === encounters.length - 1) {
        setPhase('victory')
        setRelics((value) => value + 1)
        setMessage('The Rift Warden falls. The star-forged gate is sealed.')
      } else {
        setEnemyHp(0)
        setPhase('upgrade')
        if (encounter === 2 || encounter === 5) setRelics((value) => value + 1)
        setMessage(`Encounter ${encounter + 1} cleared. Choose one upgrade before the next rift opens.`)
      }
      return
    }
    setEnemyHp(remainingEnemyHp)
    const incoming = 1 + ((encounter + turn) % 3)
    const blocked = action === 2 ? 2 : 0
    if (action === 2) setCharge((value) => Math.min(4, value + 1))
    const nextHealth = Math.max(0, health - Math.max(0, incoming - blocked))
    setHealth(nextHealth)
    if (nextHealth === 0) {
      setPhase('defeat')
      setMessage(`The rift closes after ${encounter} encounters. Reforge your loadout and run it back.`)
    } else {
      setMessage(action === 2 ? `You braced through ${incoming} incoming damage and recovered a charge.` : `The ${encounters[encounter]} counterattacks for ${incoming}. Choose your next move.`)
    }
  }

  const upgrade = (choice: number) => {
    if (phase !== 'upgrade') return
    if (choice === 0) setHealth((value) => Math.min(18, value + 5))
    if (choice === 1) setWeapon((value) => value + 1)
    if (choice === 2) setCharge((value) => Math.min(4, value + 2))
    const nextEncounter = encounter + 1
    setEncounter(nextEncounter)
    setEnemyHp(enemyMaxHealth(nextEncounter, seed))
    setPhase('battle')
    setMessage(`Rift ${nextEncounter + 1}: ${encounters[nextEncounter]}. Read the tell, then commit to a move.`)
  }

  const restart = () => {
    setEncounter(0); setEnemyHp(enemyMaxHealth(0, seed)); setHealth(18); setCharge(3); setWeapon(2); setRelics(0); setTurn(0); setPhase('battle')
    setMessage('Strike, spend charge for a pulse, or brace to blunt the next hit. Boss patterns change after every encounter.')
  }

  const enemyMaximum = enemyMaxHealth(encounter, seed)
  const boss = encounter === 2 || encounter === 5

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-fuchsia-300/20 bg-[#0a1020]/95 shadow-2xl shadow-black/35">
      <header className="border-b border-white/[0.08] px-5 py-4 sm:px-7"><p className="text-[10px] font-black uppercase tracking-[0.23em] text-fuchsia-200">Premium campaign · Action roguelite</p><h2 className="mt-1 text-xl font-extrabold text-white">Rift Warden: The Breach</h2></header>
      <div className="space-y-5 p-4 sm:p-6">
        <GameStage mode="action" title="Rift Warden: The Breach" state={{ hp: health / 18, enemyHp: enemyHp / enemyMaximum, score: turn }} onAction={act} />
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><span className="block text-lg font-black text-cyan-200">{health}/18</span>Hull</div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><span className="block text-lg font-black text-amber-200">{charge}/4</span>Charge</div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><span className="block text-lg font-black text-fuchsia-200">{relics}</span>Relics</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{phase === 'battle' ? `Rift ${encounter + 1} of ${encounters.length}${boss ? ' · Boss' : ''}` : phase === 'upgrade' ? 'Loadout draft' : phase === 'victory' ? 'Campaign complete' : 'Run ended'}</p><p className="mt-1 text-lg font-black text-white">{phase === 'battle' ? encounters[encounter] : phase === 'upgrade' ? 'Choose your next upgrade' : phase === 'victory' ? 'The breach is sealed' : 'The rift claimed the run'}</p><p className="mt-2 text-sm leading-6 text-slate-400" role="status">{message}</p></div>
        {phase === 'battle' ? <div className="grid grid-cols-3 gap-2"><button onClick={() => act(0)} className="rounded-xl bg-cyan-300 px-2 py-3 text-xs font-black text-slate-950">Strike · {weapon + 2}</button><button onClick={() => act(1)} disabled={!charge} className="rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-2 py-3 text-xs font-bold text-amber-100 disabled:opacity-40">Pulse · {weapon + 5}</button><button onClick={() => act(2)} className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/[0.08] px-2 py-3 text-xs font-bold text-fuchsia-100">Brace · +1 charge</button></div> : null}
        {phase === 'upgrade' ? <div className="grid gap-2 sm:grid-cols-3">{['Reinforce hull · +5', 'Tune weapon · +1 damage', 'Recharge cells · +2'].map((label, index) => <button key={label} onClick={() => upgrade(index)} className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-300/15">{label}</button>)}</div> : null}
        {(phase === 'victory' || phase === 'defeat') ? <button onClick={restart} className="w-full rounded-xl bg-fuchsia-300 px-4 py-3 text-sm font-black text-slate-950">Begin a new campaign</button> : null}
      </div>
    </div>
  )
}

const chambers = [
  { clue: 'The brass arch carries a steady pulse; the silver one is silent.', safe: 0, names: ['Brass arch', 'Silver arch', 'Obsidian arch'] },
  { clue: 'Follow the colder star. The violet lens is warmer than it looks.', safe: 2, names: ['Violet lens', 'Amber lens', 'Blue lens'] },
  { clue: 'The oldest path is marked by a crescent, not a sun.', safe: 1, names: ['Sun stair', 'Crescent stair', 'Comet stair'] },
  { clue: 'A soft wind escapes from the middle seal.', safe: 1, names: ['North seal', 'Middle seal', 'South seal'] },
  { clue: 'The observatory map ends at the green beacon.', safe: 2, names: ['Red beacon', 'White beacon', 'Green beacon'] },
  { clue: 'Only one constellation has four points: the eastern one.', safe: 0, names: ['East constellation', 'West constellation', 'Crown constellation'] },
]

type ArchivePhase = 'exploring' | 'gate' | 'victory' | 'defeat'

export function AstralArchiveGame() {
  const [room, setRoom] = useState(0)
  const [shards, setShards] = useState(0)
  const [integrity, setIntegrity] = useState(3)
  const [supplies, setSupplies] = useState(2)
  const [phase, setPhase] = useState<ArchivePhase>('exploring')
  const [message, setMessage] = useState('Read the field clue before choosing a path. Four relic shards are needed to open the final gate.')
  const chamber = chambers[room]

  const choosePath = (choice: number) => {
    if (phase !== 'exploring') return
    const route = chamber.safe
    if (choice === route) {
      setShards((value) => value + 1)
      setSupplies((value) => Math.min(4, value + 1))
      setMessage('The clue was true. You recovered a relic shard and replenished one field supply.')
    } else {
      const nextIntegrity = integrity - 1
      setIntegrity(nextIntegrity)
      if (supplies > 0) setSupplies((value) => value - 1)
      if (nextIntegrity <= 0) {
        setPhase('defeat')
        setMessage('The archive seals its halls. Your expedition is over; try another route.')
        return
      }
      setMessage('The route was a trap. You lost one integrity and a supply, but the expedition continues.')
    }
    if (room === chambers.length - 1) {
      setPhase('gate')
      setMessage('The final gate repeats a three-mark pattern. Use your relic total to identify the matching constellation.')
    } else {
      setRoom((value) => value + 1)
    }
  }

  const openGate = (choice: number) => {
    if (phase !== 'gate') return
    const requiredGate = shards % 3
    if (shards >= 4 && choice === requiredGate) {
      setPhase('victory')
      setMessage(`The gate opens. You escaped with ${shards} relic shards and ${supplies} supplies.`)
    } else if (integrity > 1) {
      setIntegrity((value) => value - 1)
      setMessage(shards < 4 ? `The gate rejects you: ${shards} shards found, four required. One last chance remains.` : 'The constellation is wrong. The gate lashes back; one last choice remains.')
    } else {
      setPhase('defeat')
      setMessage('The final seal holds. The archive keeps its secrets for another expedition.')
    }
  }

  const restart = () => { setRoom(0); setShards(0); setIntegrity(3); setSupplies(2); setPhase('exploring'); setMessage('Read the field clue before choosing a path. Four relic shards are needed to open the final gate.') }
  const action = (choice: number) => phase === 'gate' ? openGate(choice) : choosePath(choice)

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-violet-300/20 bg-[#0a1020]/95 shadow-2xl shadow-black/35">
      <header className="border-b border-white/[0.08] px-5 py-4 sm:px-7"><p className="text-[10px] font-black uppercase tracking-[0.23em] text-violet-200">Premium campaign · 3D expedition</p><h2 className="mt-1 text-xl font-extrabold text-white">Astral Archive: The Last Observatory</h2></header>
      <div className="space-y-5 p-4 sm:p-6">
        <GameStage mode="adventure" title="Astral Archive: The Last Observatory" state={{ progress: room, score: shards }} onAction={action} />
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase tracking-widest text-slate-400"><div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><span className="block text-lg font-black text-violet-200">{shards}/4</span>Relics</div><div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><span className="block text-lg font-black text-rose-200">{integrity}/3</span>Integrity</div><div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><span className="block text-lg font-black text-cyan-200">{supplies}/4</span>Supplies</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{phase === 'exploring' ? `Chamber ${room + 1} of ${chambers.length}` : phase === 'gate' ? 'The final observatory' : phase === 'victory' ? 'Expedition complete' : 'Expedition ended'}</p><p className="mt-2 text-base font-semibold leading-7 text-white">{phase === 'exploring' ? chamber.clue : phase === 'gate' ? 'Match your shard count to the archive’s repeating three-mark constellation.' : phase === 'victory' ? 'The observatory opens onto a quiet sky.' : 'The archive closes around your trail.'}</p><p className="mt-2 text-sm leading-6 text-slate-400" role="status">{message}</p></div>
        {phase === 'exploring' || phase === 'gate' ? <div className="grid gap-2 sm:grid-cols-3">{(phase === 'exploring' ? chamber.names : ['Three-star mark', 'One-star mark', 'Two-star mark']).map((label, index) => <button key={label} onClick={() => action(index)} className="rounded-xl border border-violet-300/20 bg-violet-300/[0.06] px-3 py-3 text-sm font-bold text-violet-100 hover:bg-violet-300/15">{label}</button>)}</div> : null}
        {(phase === 'victory' || phase === 'defeat') ? <button onClick={restart} className="w-full rounded-xl bg-violet-300 px-4 py-3 text-sm font-black text-slate-950">Begin a new expedition</button> : null}
      </div>
    </div>
  )
}
