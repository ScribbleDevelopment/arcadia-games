'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { GameStage, type GameStageState } from '@/components/three-game-stage'
import { AstralArchiveGame, RiftWardenGame } from '@/components/premium-games'
import type { GameGenre } from '@/lib/games'

type GameProps = { title: string; seed: number; slug: string }

const marks = ['◇', '○', '△', '✦', '□', '⬡']
const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const getWinner = (board: string[]) => lines.reduce((winner, [a, b, c]) => winner || (board[a] && board[a] === board[b] && board[b] === board[c] ? board[a] : ''), '') || (board.every(Boolean) ? 'draw' : '')

function bestTicTacToeMoves(board: string[]) {
  function evaluate(position: string[], player: 'X' | 'O', depth: number): number {
    const winner = getWinner(position)
    if (winner === 'O') return 10 - depth
    if (winner === 'X') return depth - 10
    if (winner === 'draw') return 0
    const scores = position.flatMap((cell, index) => {
      if (cell) return []
      const next = [...position]
      next[index] = player
      return [evaluate(next, player === 'O' ? 'X' : 'O', depth + 1)]
    })
    return player === 'O' ? Math.max(...scores) : Math.min(...scores)
  }

  const scores = board.map((cell, index) => {
    if (cell) return Number.NEGATIVE_INFINITY
    const next = [...board]
    next[index] = 'O'
    return evaluate(next, 'X', 1)
  })
  const bestScore = Math.max(...scores)
  return scores.flatMap((score, index) => score === bestScore ? [index] : [])
}

const shuffledMarks = () => {
  const deck = [...marks, ...marks]
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]]
  }
  return deck
}

function GameFrame({ eyebrow, title, children, status, stageState, onStageAction }: { eyebrow: string; title: string; children: ReactNode; status: string; stageState?: GameStageState; onStageAction?: (index: number) => void }) {
  const label = eyebrow.split(' · ')[0].toLowerCase()
  const mode = (label === 'cards' ? 'card' : label) as GameGenre
  return <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a1020]/95 shadow-2xl shadow-black/35"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4 sm:px-7"><div><p className="text-[10px] font-black uppercase tracking-[0.23em] text-cyan-300">{eyebrow}</p><h2 className="mt-1 text-xl font-extrabold text-white">{title}</h2></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-200">3D · Playable now</span></header><div className="space-y-5 p-4 sm:p-6"><GameStage mode={mode} title={title} state={stageState} onAction={onStageAction ?? (() => undefined)} /><div>{children}<p className="mt-5 min-h-5 text-xs leading-5 text-slate-400" role="status">{status}</p></div></div></div>
}

function ArcadeGame({ title, seed }: GameProps) {
  const [score, setScore] = useState(0)
  const [seconds, setSeconds] = useState(25)
  const [running, setRunning] = useState(false)
  const [target, setTarget] = useState(seed % 9)
  useEffect(() => {
    if (!running || seconds <= 0) return
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [running, seconds])
  useEffect(() => { if (seconds === 0) setRunning(false) }, [seconds])
  const start = () => { setScore(0); setSeconds(25); setTarget(seed % 9); setRunning(true) }
  const hit = (index: number) => { if (!running) return; if (index === target) { setScore((value) => value + 1); setTarget((value) => (value + 1 + Math.floor(Math.random() * 7)) % 9) } else setScore((value) => Math.max(0, value - 1)) }
  return <GameFrame eyebrow="Arcade · Reflex" title={`${title}: Reflex Run`} stageState={{ activeIndex: target, score }} onStageAction={hit} status={running ? 'Tap the bright signal before it moves. Misses cost one point.' : seconds === 0 ? `Round over — you scored ${score}.` : 'Start a 25-second reflex run and chase the moving signal.'}><div className="mb-4 flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400"><span>Score <strong className="ml-2 text-white">{score}</strong></span><span>Time <strong className="ml-2 text-white">{seconds}s</strong></span></div><div className="grid grid-cols-3 gap-2.5">{Array.from({ length: 9 }, (_, index) => <button key={index} disabled={!running} onClick={() => hit(index)} aria-label={running && index === target ? 'Hit signal target' : `Signal lane ${index + 1}`} className={`aspect-square rounded-2xl border text-3xl font-black transition active:scale-95 ${running && index === target ? 'border-cyan-200 bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950 shadow-lg shadow-cyan-400/25' : 'border-white/10 bg-white/[0.035] text-slate-600 hover:bg-white/[0.08]'}`}>{running && index === target ? '✦' : '·'}</button>)}</div><button onClick={start} className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">{running ? 'Restart run' : 'Start signal rush'}</button></GameFrame>
}

function PuzzleGame({ title }: GameProps) {
  const [cards, setCards] = useState(shuffledMarks)
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const restart = () => { setCards(shuffledMarks()); setOpen([]); setMatched([]); setMoves(0); setLocked(false) }
  const flip = (index: number) => {
    if (locked || open.includes(index) || matched.includes(index)) return
    const next = [...open, index]
    setOpen(next)
    if (next.length === 2) {
      setMoves((value) => value + 1)
      if (cards[next[0]] === cards[next[1]]) { setMatched((value) => [...value, ...next]); setOpen([]) }
      else { setLocked(true); window.setTimeout(() => { setOpen([]); setLocked(false) }, 650) }
    }
  }
  const done = matched.length === cards.length
  return <GameFrame eyebrow="Puzzle · Pattern memory" title={`${title}: Pair Finder`} stageState={{ openIndices: open, matchedIndices: matched, symbols: cards }} onStageAction={flip} status={done ? `Solved in ${moves} turns. ${moves <= 12 ? 'Excellent memory.' : 'Try to beat your score.'}` : 'Reveal two tiles per turn and clear the board in as few moves as possible.'}><div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400"><span>Pairs <strong className="ml-2 text-white">{matched.length / 2}/6</strong></span><span>Moves <strong className="ml-2 text-white">{moves}</strong></span></div><div className="grid grid-cols-4 gap-2.5">{cards.map((mark, index) => <button key={`${index}-${mark}`} onClick={() => flip(index)} aria-label={matched.includes(index) ? `Matched tile ${index + 1}` : open.includes(index) ? `Tile ${index + 1} revealed` : `Reveal tile ${index + 1}`} className={`aspect-square rounded-2xl border text-2xl font-black transition active:scale-95 ${matched.includes(index) ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-200' : open.includes(index) ? 'border-fuchsia-300/50 bg-fuchsia-300/15 text-fuchsia-100' : 'border-white/10 bg-white/[0.035] text-transparent hover:border-cyan-300/40'}`}>{matched.includes(index) || open.includes(index) ? mark : '?'}</button>)}</div><button onClick={restart} className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-300/40">Shuffle puzzle</button></GameFrame>
}

function StrategyGame({ title, seed }: GameProps) {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''))
  const [turn, setTurn] = useState<'X' | 'O'>('X')
  const winner = getWinner(board)
  useEffect(() => {
    if (turn !== 'O' || winner) return
    const timer = window.setTimeout(() => {
      const choices = bestTicTacToeMoves(board)
      if (!choices.length) return
      const choice = choices[(seed + board.filter(Boolean).length) % choices.length]
      setBoard((current) => current.map((cell, index) => index === choice ? 'O' : cell))
      setTurn('X')
    }, 450)
    return () => window.clearTimeout(timer)
  }, [board, seed, turn, winner])
  const play = (index: number) => { if (board[index] || winner || turn !== 'X') return; setBoard((current) => current.map((cell, i) => i === index ? 'X' : cell)); setTurn('O') }
  const reset = () => { setBoard(Array(9).fill('')); setTurn('X') }
  return <GameFrame eyebrow="Strategy · Tactical grid" title={`${title}: Threefold`} stageState={{ board }} onStageAction={play} status={winner ? winner === 'draw' ? 'The board is locked. This round is a draw.' : winner === 'X' ? 'Victory — you controlled the grid.' : 'The CPU took this round. Change your opening and try again.' : turn === 'O' ? 'Opponent is choosing a move…' : 'You are cyan. Take turns and make a line of three.'}><div className="mx-auto grid max-w-xs grid-cols-3 gap-2.5">{board.map((cell, index) => <button key={index} onClick={() => play(index)} disabled={Boolean(cell || winner || turn !== 'X')} aria-label={`Grid cell ${index + 1}${cell ? `: ${cell}` : ''}`} className={`aspect-square rounded-2xl border text-4xl font-black transition ${cell === 'X' ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200' : cell === 'O' ? 'border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-200' : 'border-white/10 bg-white/[0.035] text-slate-500 hover:border-cyan-300/40'}`}>{cell || '·'}</button>)}</div><button onClick={reset} className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-300/40">Reset tactical grid</button></GameFrame>
}

function RacingGame({ title, seed }: GameProps) {
  const [lane, setLane] = useState(seed % 2)
  const [hazard, setHazard] = useState(1 - (seed % 2))
  const [distance, setDistance] = useState(0)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setDistance((value) => value + 1)
      setHazard((value) => { const next = value === 0 ? 1 : 0; if (next === lane) setRunning(false); return next })
    }, Math.max(380, 900 - Math.min(distance * 16, 500)))
    return () => window.clearInterval(timer)
  }, [distance, lane, running])
  const start = () => { setLane(seed % 2); setHazard(1 - (seed % 2)); setDistance(0); setRunning(true) }
  const steer = (next: number) => setLane(next)
  return <GameFrame eyebrow="Racing · Lane runner" title={`${title}: Splitline`} stageState={{ lane, hazard, progress: distance }} onStageAction={steer} status={!running && distance ? `Crash at ${distance} sectors. Switch lanes before the next barrier.` : 'Dodge every barrier and survive as long as you can. Use the lane buttons or arrow keys.'}><div className="relative mx-auto grid h-64 max-w-sm grid-cols-2 gap-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-4" tabIndex={0} aria-label="Racing track. Use left and right arrow keys to switch lanes." onKeyDown={(event) => { if (event.key === 'ArrowLeft') steer(0); if (event.key === 'ArrowRight') steer(1) }}><div className="absolute left-1/2 top-0 h-full border-l border-dashed border-white/20" />{[0, 1].map((index) => <button key={index} onClick={() => steer(index)} aria-label={`Switch to ${index === 0 ? 'left' : 'right'} lane`} className="relative flex flex-col items-center justify-between rounded-xl bg-white/[0.035] py-4 text-xs font-bold text-slate-500"><span>{hazard === index && running ? 'BARRIER' : 'CLEAR'}</span><span className={`text-3xl transition ${lane === index ? 'text-cyan-300' : 'text-transparent'}`}>▲</span>{lane === index && <span className="text-[9px] uppercase tracking-widest text-cyan-200">Racer</span>}</button>)}</div><div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400"><span>Sectors <strong className="ml-1 text-white">{distance}</strong></span><button onClick={start} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950">{running ? 'Restart race' : 'Race again'}</button></div></GameFrame>
}

function ActionGame({ title, seed }: GameProps) {
  const [hp, setHp] = useState(5)
  const [enemyHp, setEnemyHp] = useState(4 + (seed % 2))
  const [defeated, setDefeated] = useState(0)
  const [evades, setEvades] = useState(2)
  const [moves, setMoves] = useState(0)
  const [ended, setEnded] = useState(false)
  const enemyMaxHp = 4 + (seed % 2) + Math.min(defeated, 4)
  const incomingDamage = 1 + ((seed + moves + 1) % 2)

  const act = (action: 'quick' | 'charged' | 'evade') => {
    if (ended || (action === 'evade' && evades === 0)) return
    const nextMoves = moves + 1
    const damage = action === 'quick' ? 2 : action === 'charged' ? 4 : 0
    const nextEnemyHp = Math.max(0, enemyHp - damage)
    setMoves(nextMoves)
    if (action === 'evade') setEvades((value) => value - 1)

    if (nextEnemyHp === 0) {
      const nextWave = defeated + 1
      setDefeated(nextWave)
      setEnemyHp(4 + (seed % 2) + Math.min(nextWave, 4))
      setEvades((value) => Math.min(2, value + 1))
      return
    }

    setEnemyHp(nextEnemyHp)
    if (action !== 'evade') {
      const hit = incomingDamage + (action === 'charged' ? 1 : 0)
      const remainingHp = Math.max(0, hp - hit)
      setHp(remainingHp)
      if (remainingHp === 0) setEnded(true)
    }
  }

  const restart = () => { setHp(5); setEnemyHp(4 + (seed % 2)); setDefeated(0); setEvades(2); setMoves(0); setEnded(false) }
  return <GameFrame eyebrow="Action · Wave survival" title={`${title}: Last Stand`} stageState={{ hp: hp / 5, enemyHp: enemyHp / enemyMaxHp, score: defeated }} onStageAction={(index) => act(index === 0 ? 'quick' : index === 1 ? 'charged' : 'evade')} status={ended ? `Run over — ${defeated} waves cleared. The next wave hits harder.` : `Wave ${defeated + 1} · Incoming hit: ${incomingDamage}. Quick shots deal 2; charged shots deal 4 but add a counter hit. Evades avoid damage (${evades} left).`}><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Raid bot · wave {defeated + 1}</p><p className="mt-1 text-lg font-black text-fuchsia-200">{enemyHp} <span className="text-sm text-slate-500">/ {enemyMaxHp} armor</span></p></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Shields</p><p className="mt-1 text-xl font-black text-cyan-200">{'◆ '.repeat(hp)}<span className="text-slate-700">{'◇ '.repeat(5 - hp)}</span></p></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900"><div className="h-full rounded-full bg-fuchsia-400 transition-all" style={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }} /></div></div><div className="mt-4 grid grid-cols-3 gap-2"><button disabled={ended} onClick={() => act('quick')} className="rounded-xl bg-fuchsia-400 px-2 py-3 text-xs font-black text-slate-950 transition hover:bg-fuchsia-300 disabled:opacity-50">Quick shot · 2</button><button disabled={ended} onClick={() => act('charged')} className="rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-2 py-3 text-xs font-bold text-amber-100 transition hover:bg-amber-300/15 disabled:opacity-50">Charge · 4</button><button disabled={ended || evades === 0} onClick={() => act('evade')} className="rounded-xl border border-cyan-300/30 bg-cyan-300/[0.08] px-2 py-3 text-xs font-bold text-cyan-100 disabled:opacity-50">Evade · {evades}</button></div>{ended && <button onClick={restart} className="mt-3 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white hover:border-cyan-300/40">Run it back</button>}<p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Waves cleared: {defeated} · Moves: {moves}</p></GameFrame>
}

function RPGGame({ title, seed }: GameProps) {
  const [heroHp, setHeroHp] = useState(10)
  const [bossHp, setBossHp] = useState(12 + (seed % 5))
  const [potions, setPotions] = useState(2)
  const [round, setRound] = useState(0)
  const bossName = ['Ash Warden', 'Frost Colossus', 'Void Knight', 'Cinder Drake'][seed % 4]
  const incomingDamage = 1 + ((seed + round + 1) % 3)
  const act = (action: 'attack' | 'heal' | 'guard') => {
    if (heroHp <= 0 || bossHp <= 0) return
    const nextRound = round + 1
    const damage = 1 + ((seed + nextRound) % 3)
    setRound(nextRound)
    if (action === 'attack') setBossHp((value) => Math.max(0, value - 2 - ((seed + nextRound) % 3)))
    if (action === 'heal' && potions > 0) setPotions((value) => value - 1)
    const blockedDamage = action === 'guard' ? Math.max(0, damage - 2) : damage
    setHeroHp((value) => Math.max(0, Math.min(10, value + (action === 'heal' ? 4 : 0) - blockedDamage)))
  }
  const ended = heroHp <= 0 || bossHp <= 0
  return <GameFrame eyebrow="RPG · Turn-based boss fight" title={`${title}: Warden's Trial`} stageState={{ hp: heroHp / 10, enemyHp: bossHp / (12 + (seed % 5)) }} onStageAction={(index) => act(index === 0 ? 'attack' : index === 1 ? 'heal' : 'guard')} status={bossHp <= 0 ? `${bossName} is defeated. The relic is yours.` : heroHp <= 0 ? 'Your party fell in battle. Start a new expedition.' : 'Choose a turn: strike, use a potion, or guard against the next attack.'}><div className="rounded-2xl border border-fuchsia-300/15 bg-gradient-to-br from-fuchsia-300/10 to-transparent p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Boss · round {round + 1} · {incomingDamage} incoming</p><p className="mt-1 text-xl font-black text-fuchsia-100">{bossName}</p></div><p className="text-sm font-black text-white">{bossHp} HP</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900"><div className="h-full rounded-full bg-fuchsia-400 transition-all" style={{ width: `${Math.max(0, (bossHp / (12 + (seed % 5))) * 100)}%` }} /></div></div><div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-sm"><span className="font-bold text-cyan-100">Your party</span><span className="font-black text-white">{heroHp} / 10 HP <span className="ml-2 text-amber-200">{potions} potions</span></span></div><div className="mt-4 grid grid-cols-3 gap-2"><button disabled={ended} onClick={() => act('attack')} className="rounded-xl bg-cyan-300 px-2 py-3 text-xs font-black text-slate-950 disabled:opacity-45">Strike</button><button disabled={ended || !potions} onClick={() => act('heal')} className="rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-2 py-3 text-xs font-bold text-amber-100 disabled:opacity-45">Potion</button><button disabled={ended} onClick={() => act('guard')} className="rounded-xl border border-white/15 px-2 py-3 text-xs font-bold text-white disabled:opacity-45">Guard</button></div>{ended && <button onClick={() => { setHeroHp(10); setBossHp(12 + (seed % 5)); setPotions(2); setRound(0) }} className="mt-3 w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white">Start a new expedition</button>}</GameFrame>
}

function SportsGame({ title, seed }: GameProps) {
  const [meter, setMeter] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [goals, setGoals] = useState(0)
  const [started, setStarted] = useState(false)
  useEffect(() => { if (!started) return; const timer = window.setInterval(() => setMeter((value) => value >= 100 ? 0 : value + 3), 35); return () => window.clearInterval(timer) }, [started])
  const target = 35 + (seed % 20)
  const takeShot = () => { if (!started || attempts >= 5) return; if (meter >= target && meter <= target + 16) setGoals((value) => value + 1); setAttempts((value) => value + 1) }
  const reset = () => { setAttempts(0); setGoals(0); setMeter(0); setStarted(true) }
  return <GameFrame eyebrow="Sports · Precision challenge" title={`${title}: Perfect Series`} stageState={{ meter, goal: target }} onStageAction={takeShot} status={attempts === 5 ? `${goals} of 5 shots on target. ${goals >= 4 ? 'Clinical finishing.' : 'Take another five-shot series.'}` : 'Time each shot while the power bar crosses the highlighted zone.'}><div className="mb-5 flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400"><span>Shots <strong className="ml-1 text-white">{attempts}/5</strong></span><span>On target <strong className="ml-1 text-emerald-200">{goals}</strong></span></div><div className="relative h-8 overflow-hidden rounded-full border border-white/10 bg-slate-950"><div className="absolute inset-y-0 bg-emerald-300/20" style={{ left: `${target}%`, width: '16%' }} /><div className="absolute inset-y-0 w-1 bg-cyan-200 shadow-[0_0_15px_3px_rgba(103,232,249,.75)] transition-[left]" style={{ left: `${meter}%` }} /></div><button disabled={!started || attempts >= 5} onClick={takeShot} className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-4 text-sm font-black text-slate-950 disabled:opacity-45">Shoot</button>{(!started || attempts === 5) && <button onClick={reset} className="mt-3 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white">{attempts === 5 ? 'New five-shot series' : 'Start practice'}</button>}</GameFrame>
}

function AdventureGame({ title, seed }: GameProps) {
  const [step, setStep] = useState(0)
  const [supplies, setSupplies] = useState(2)
  const [ending, setEnding] = useState('')
  const scenes = ['A weathered map points toward a sealed observatory.', 'A bridge spans a field of glowing mist.', 'The observatory door hums with a strange signal.', 'A final passage opens onto the signal source.']
  const choose = (choice: number) => {
    const nextSupplies = supplies + (choice === (seed + step) % 3 ? 1 : -1)
    setSupplies(nextSupplies)
    if (step >= scenes.length - 1) setEnding(nextSupplies >= 1 ? 'You found the hidden signal and made it home.' : 'You reached the source, but ran out of supplies on the return.')
    else setStep((value) => value + 1)
  }
  const restart = () => { setStep(0); setSupplies(2); setEnding('') }
  return <GameFrame eyebrow="Adventure · Choice-driven story" title={`${title}: Last Transmission`} stageState={{ progress: step }} onStageAction={(choice) => { if (!ending) choose(choice) }} status={ending || `Chapter ${step + 1} of ${scenes.length} · Supplies ${supplies}. Your decisions shape the ending.`}><div className="rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.08] to-transparent p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">Field notes · chapter {step + 1}</p><p className="mt-3 text-lg font-semibold leading-7 text-white">{ending ? 'The journey is complete.' : scenes[step]}</p></div>{ending ? <button onClick={restart} className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">Begin another journey</button> : <div className="mt-3 grid gap-2">{['Scout the route', 'Push forward quickly', 'Search the surroundings'].map((label, index) => <button key={label} onClick={() => choose(index)} className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.06]">{label}</button>)}</div>}</GameFrame>
}

function CardGame({ title, seed }: GameProps) {
  const [current, setCurrent] = useState(1 + (seed % 13))
  const [streak, setStreak] = useState(0)
  const [banked, setBanked] = useState(0)
  const [round, setRound] = useState(0)
  const [finished, setFinished] = useState(false)
  const [message, setMessage] = useState('Call the next card, then cash out your streak or risk it on another draw.')
  const ended = finished || round === 8

  const draw = (guess: 'higher' | 'lower') => {
    if (ended) return
    const next = 1 + Math.floor(Math.random() * 13)
    const correct = next !== current && (guess === 'higher' ? next > current : next < current)
    const nextStreak = correct ? streak + 1 : 0
    const nextRound = round + 1
    setStreak(nextStreak)
    setCurrent(next)
    setRound(nextRound)

    if (nextRound === 8) {
      setBanked((value) => value + nextStreak)
      setFinished(true)
      setMessage(`Round complete. Your final streak of ${nextStreak} points is banked.`)
    } else if (next === current) setMessage(`Both cards were ${current}. Your unbanked streak is gone; the round continues.`)
    else if (correct) setMessage(`${next} was ${guess}. Cash out now or risk the streak on another draw.`)
    else setMessage(`${next} was not ${guess}. Your unbanked streak is gone, but banked points are safe.`)
  }

  const cashOut = () => {
    if (streak === 0 || ended) return
    setBanked((value) => value + streak)
    setFinished(true)
    setMessage(`You cashed out ${streak} points. Your banked score is safe.`)
  }

  const restart = () => {
    setCurrent(1 + (seed % 13))
    setStreak(0)
    setBanked(0)
    setRound(0)
    setFinished(false)
    setMessage('Call the next card, then cash out your streak or risk it on another draw.')
  }

  return <GameFrame eyebrow="Cards · Risk versus reward" title={`${title}: Cash-Out Run`} stageState={{ activeIndex: current, score: streak }} onStageAction={(index) => draw(index === 0 ? 'higher' : 'lower')} status={ended ? `${message} Total banked: ${banked}.` : `${message} Banked ${banked} · at risk ${streak}.`}><div className="flex items-center justify-center gap-4"><div className="grid size-32 place-items-center rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/15 to-slate-900 text-5xl font-black text-white shadow-xl">{['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][current - 1]}</div><span className="text-xs font-black uppercase tracking-widest text-slate-500">Next?</span><div className="grid size-32 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] text-3xl font-black text-slate-600">?</div></div><div className="mt-4 flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400"><span>Draw <strong className="ml-1 text-white">{round}/8</strong></span><span>Banked <strong className="ml-1 text-emerald-200">{banked}</strong> · Streak <strong className="ml-1 text-cyan-200">{streak}</strong></span></div><div className="mt-4 grid grid-cols-2 gap-2"><button disabled={ended} onClick={() => draw('higher')} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-45">Higher</button><button disabled={ended} onClick={() => draw('lower')} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-black text-white disabled:opacity-45">Lower</button></div>{!ended && streak > 0 && <button onClick={cashOut} className="mt-3 w-full rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200">Cash out {streak} points</button>}{ended && <button onClick={restart} className="mt-3 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white">Deal a new run</button>}</GameFrame>
}

function SimulationGame({ title, seed }: GameProps) {
  const names = [['Moon fern', 'Glass moss', 'Star bloom'], ['Cinder vine', 'Ash orchid', 'Emberleaf'], ['Tide lily', 'Coral grass', 'Pearl reed']][seed % 3]
  const [growth, setGrowth] = useState([0, 0, 0])
  const [turns, setTurns] = useState(0)
  const complete = growth.every((value) => value >= 4)
  const water = (index: number) => { if (complete || turns >= 12 || growth[index] >= 4) return; setGrowth((values) => values.map((value, i) => i === index ? Math.min(4, value + 1) : value)); setTurns((value) => value + 1) }
  const reset = () => { setGrowth([0, 0, 0]); setTurns(0) }
  return <GameFrame eyebrow="Simulation · Garden management" title={`${title}: Bloom Plan`} stageState={{ growth }} onStageAction={water} status={complete ? `All plants flourished in ${turns} watering turns. Habitat restored.` : turns >= 12 ? 'Water budget spent. Rebalance the plants and try again.' : 'Grow every plant to stage four with only twelve watering turns.'}><div className="mb-4 flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400"><span>Water turns <strong className="ml-1 text-white">{turns}/12</strong></span><span>Garden <strong className="ml-1 text-emerald-200">{growth.filter((value) => value === 4).length}/3 thriving</strong></span></div><div className="grid gap-3">{names.map((name, index) => <div key={name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-xs"><span className="font-bold text-white">{name}</span><span className="text-emerald-200">{growth[index]}/4</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900"><div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${growth[index] * 25}%` }} /></div></div><button disabled={complete || turns >= 12 || growth[index] >= 4} onClick={() => water(index)} className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-40">Water</button></div>)}</div><button onClick={reset} className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white">Reset greenhouse</button></GameFrame>
}

const engines: Record<GameGenre, (props: GameProps) => ReactNode> = { arcade: (props) => <ArcadeGame {...props} />, puzzle: (props) => <PuzzleGame {...props} />, strategy: (props) => <StrategyGame {...props} />, racing: (props) => <RacingGame {...props} />, action: (props) => <ActionGame {...props} />, rpg: (props) => <RPGGame {...props} />, sports: (props) => <SportsGame {...props} />, adventure: (props) => <AdventureGame {...props} />, card: (props) => <CardGame {...props} />, simulation: (props) => <SimulationGame {...props} /> }

export function GenreGame({ title, genre, seed, slug }: GameProps & { genre: GameGenre }) {
  if (slug === 'rift-warden') return <RiftWardenGame seed={seed} />
  if (slug === 'astral-archive') return <AstralArchiveGame />
  const Engine = engines[genre]
  return <Engine title={title} seed={seed} slug={slug} />
}
