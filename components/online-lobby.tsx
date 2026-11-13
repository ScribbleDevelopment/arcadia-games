'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { games, multiplayerGames } from '@/lib/games'
import { Online3DBoard } from '@/components/online-3d-board'

const getGameTitle = (slug: string) => games.find((game) => game.slug === slug)?.title ?? 'Unknown game'

type RoomSummary = { id: string; name: string; gameSlug: string; playersCount: number; maxPlayers: number; hostName: string; createdAt: string }
type Room = RoomSummary & {
  visibility: 'public' | 'code'
  status: 'open' | 'full' | 'closed'
  gameState: { board: string[]; turn: 'X' | 'O'; winner: string }
  players: { userId: string; displayName: string; mark: string }[]
  myMark: string
  inviteCode: string | null
  revision: number
}
type RoomResult = { room: Room }
type RoomListResult = { rooms: RoomSummary[] }

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Unable to load rooms.')
  return data as T
}

async function sendRoomRequest<T>(url: string, method: 'POST' | 'DELETE', body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Room request failed.')
  return data as T
}

function Board({ room, onMove, busy }: { room: Room; onMove: (cell: number) => void; busy: boolean }) {
  const winner = room.gameState.winner
  const isMyTurn = room.gameState.turn === room.myMark
  const turnName = room.players.find((player) => player.mark === room.gameState.turn)?.displayName ?? 'Waiting for player'
  const ended = Boolean(winner)
  const isConnectFour = room.gameSlug === 'connect-four'
  const isFiveInARow = room.gameSlug === 'five-in-a-row'
  const gameTitle = getGameTitle(room.gameSlug)
  const canMove = !busy && !ended && isMyTurn && room.players.length === 2
  const status = ended ? winner === 'draw' ? 'Board full — it is a draw.' : `${winner === room.myMark ? 'You win' : `${turnName} wins`}!` : room.players.length < 2 ? 'Waiting for a second player…' : isMyTurn ? 'Your turn — make it count.' : `${turnName} is thinking…`
  const discStyle = (mark: string) => mark === 'X' ? 'border-cyan-200/70 bg-cyan-300 text-slate-950 shadow-[0_0_12px_rgba(103,232,249,.28)]' : mark === 'O' ? 'border-fuchsia-200/70 bg-fuchsia-300 text-slate-950 shadow-[0_0_12px_rgba(232,121,249,.24)]' : 'border-slate-700 bg-slate-900/80 text-transparent'

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090f1d] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">{gameTitle} · live match</p><p className="mt-1 text-sm font-bold text-white" role="status">{status}</p></div><span className="rounded-full bg-white/[0.06] px-3 py-1.5 font-mono text-xs font-bold text-slate-300">You are {room.myMark}</span></div>
      <Online3DBoard gameSlug={room.gameSlug} board={room.gameState.board} canMove={canMove} onMove={onMove} />
      <p className="mt-2 text-center text-xs text-slate-500">Click an empty 3D column or intersection to make your move.</p>
      <details className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-3">
        <summary className="cursor-pointer text-xs font-bold text-cyan-200">Show keyboard-accessible move controls</summary>
        <div className="mt-4">
      {isConnectFour ? <div className="mx-auto max-w-sm rounded-2xl border border-cyan-300/15 bg-blue-950/60 p-2 sm:p-3">
        <div className="mb-2 grid grid-cols-7 gap-1.5">{Array.from({ length: 7 }, (_, column) => <button key={column} type="button" onClick={() => onMove(column)} disabled={!canMove || Boolean(room.gameState.board[column])} aria-label={`Drop a disc in column ${column + 1}`} className="rounded-lg border border-white/10 bg-white/[0.06] py-2 text-xs font-black text-cyan-100 transition enabled:hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50">↓</button>)}</div>
        <div className="grid grid-cols-7 gap-1.5" aria-label="Connect Four board">{room.gameState.board.map((mark, index) => <div key={index} aria-label={`Row ${Math.floor(index / 7) + 1}, column ${index % 7 + 1}${mark ? `: ${mark === 'X' ? 'cyan' : 'pink'} disc` : ': empty'}`} className={`grid aspect-square place-items-center rounded-full border ${discStyle(mark)}`}>{mark ? '●' : '·'}</div>)}</div>
      </div> : <div className={`mx-auto grid ${isFiveInARow ? 'max-w-[30rem] grid-cols-[repeat(15,minmax(0,1fr))] gap-0.5' : 'max-w-xs grid-cols-3 gap-2.5'}`} aria-label={`${gameTitle} board`}>
        {room.gameState.board.map((mark, index) => <button key={index} type="button" onClick={() => onMove(index)} disabled={!canMove || Boolean(mark)} aria-label={`${isFiveInARow ? 'Intersection' : 'Square'} ${index + 1}${mark ? `: ${mark}` : ''}`} className={`${isFiveInARow ? 'aspect-square rounded-sm text-[10px] sm:text-base' : 'aspect-square rounded-2xl text-4xl'} border font-black transition disabled:cursor-not-allowed ${mark === 'X' ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200' : mark === 'O' ? 'border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-200' : 'border-white/10 bg-white/[0.035] text-slate-700 enabled:hover:border-cyan-300/40'}`}>{mark || '·'}</button>)}
      </div>}
        </div>
      </details>
      <p className="mt-3 text-center text-xs text-slate-500">{isConnectFour ? 'Drop a disc in any open column. Connect four in any direction.' : isFiveInARow ? 'Place a mark on an empty intersection. First to five wins.' : 'Take turns placing a mark. First to connect three wins.'}</p>
      {ended && <button type="button" onClick={() => onMove(-1)} disabled={busy} className="mx-auto mt-4 block rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">Rematch</button>}
    </div>
  )
}

export function OnlineLobby() {
  const [visibility, setVisibility] = useState<'public' | 'code'>('public')
  const [joinCode, setJoinCode] = useState('')
  const [roomName, setRoomName] = useState('Arcadia Live Match')
  const [gameSlug, setGameSlug] = useState('grid-tactics')
  const [activeRoomId, setActiveRoomId] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyRoomId, setBusyRoomId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const { data: listData, error: listError, mutate: refreshRooms } = useSWR<RoomListResult>('/api/rooms', fetcher, { refreshInterval: 8000, revalidateOnFocus: true })
  const { data: roomData, error: roomError, mutate: refreshRoom } = useSWR<RoomResult>(activeRoomId ? `/api/rooms/${activeRoomId}` : null, fetcher, { refreshInterval: 1200, revalidateOnFocus: true })
  const room = roomData?.room

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const roomId = searchParams.get('room')
    const requestedGame = searchParams.get('game')
    if (roomId) setActiveRoomId(roomId)
    if (requestedGame && multiplayerGames.some((game) => game.slug === requestedGame)) setGameSlug(requestedGame)
  }, [])

  function openRoom(roomId: string) {
    setActiveRoomId(roomId)
    const url = new URL(window.location.href)
    url.searchParams.set('room', roomId)
    window.history.replaceState(null, '', url)
    setErrorMessage('')
    setNotice('')
    setCopied(false)
  }

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setErrorMessage('')
    try {
      const result = await sendRoomRequest<RoomResult>('/api/rooms', 'POST', { action: 'create', visibility, name: roomName, gameSlug })
      openRoom(result.room.id)
      await refreshRooms()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create this room.')
    } finally { setBusy(false) }
  }

  async function joinByCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setErrorMessage('')
    try {
      const result = await sendRoomRequest<RoomResult>('/api/rooms', 'POST', { action: 'join', joinCode: joinCode.trim().toUpperCase() })
      openRoom(result.room.id)
      await refreshRooms()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to join this room.')
    } finally { setBusy(false) }
  }

  async function joinPublic(roomId: string) {
    setBusyRoomId(roomId)
    setErrorMessage('')
    try {
      const result = await sendRoomRequest<RoomResult>('/api/rooms', 'POST', { action: 'join', roomId })
      openRoom(result.room.id)
      await refreshRooms()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to join this room.')
      await refreshRooms()
    } finally { setBusyRoomId('') }
  }

  async function moveOrRematch(cell: number) {
    if (!room) return
    setBusy(true)
    setErrorMessage('')
    try {
      const body = cell < 0 ? { action: 'reset' } : room.gameSlug === 'connect-four' ? { action: 'move', column: cell } : { action: 'move', cell }
      await sendRoomRequest(`/api/rooms/${room.id}`, 'POST', body)
      await refreshRoom()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save the move.')
      await refreshRoom()
    } finally { setBusy(false) }
  }

  async function leaveRoom() {
    if (!room) return
    setBusy(true)
    try {
      await sendRoomRequest(`/api/rooms/${room.id}`, 'DELETE')
      setActiveRoomId('')
      const url = new URL(window.location.href)
      url.searchParams.delete('room')
      window.history.replaceState(null, '', url)
      setNotice('You left the room.')
      await refreshRooms()
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Unable to leave this room.') }
    finally { setBusy(false) }
  }

  async function copyInvite() {
    if (!room?.inviteCode) return
    try {
      await navigator.clipboard.writeText(room.inviteCode)
      setCopied(true)
    } catch { setErrorMessage('Clipboard access is unavailable. You can select and copy the room code.') }
  }

  if (activeRoomId && room) return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]" aria-label="Live multiplayer room">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.23em] text-cyan-300">{room.visibility === 'public' ? 'Public room' : 'Private room'}</p><h2 className="mt-2 text-2xl font-black text-white">{room.name}</h2><p className="mt-2 text-sm text-slate-400">{getGameTitle(room.gameSlug)} · two-player live match</p></div><span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-300">{room.playersCount}/{room.maxPlayers} players</span></div>
        {room.inviteCode && <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">Share this code with a friend</p><div className="mt-2 flex items-center justify-between gap-3"><p className="font-mono text-xl font-black tracking-[0.18em] text-white">{room.inviteCode}</p><button type="button" onClick={copyInvite} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white hover:border-cyan-300/40">{copied ? 'Copied' : 'Copy code'}</button></div></div>}
        <div className="mt-5 space-y-2">{room.players.map((player) => <div key={player.userId} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/10 px-3 py-3"><div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-lg text-xs font-black ${player.mark === 'X' ? 'bg-cyan-300/15 text-cyan-200' : 'bg-fuchsia-300/15 text-fuchsia-200'}`}>{player.mark}</span><span className="text-sm font-semibold text-white">{player.displayName}{player.userId === room.players.find((item) => item.mark === 'X')?.userId ? ' · host' : ''}</span></div><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{player.userId === room.players.find((item) => item.mark === room.myMark)?.userId ? 'You' : 'Player'}</span></div>)}</div>
        {room.playersCount < 2 && <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-3 text-xs leading-5 text-amber-100">Waiting for a second player. Share the code or wait for someone to join the public list.</p>}
        <button type="button" onClick={leaveRoom} disabled={busy} className="mt-5 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-rose-300/40 hover:text-rose-200 disabled:opacity-50">Leave room</button>
      </div>
      <div><Board room={room} onMove={moveOrRematch} busy={busy} /><p className="mt-3 text-center text-[11px] text-slate-500">Room state syncs between signed-in players automatically.</p></div>
      {(errorMessage || roomError) && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[0.08] px-4 py-3 text-sm text-rose-100 lg:col-span-2">{errorMessage || roomError?.message}</p>}
    </section>
  )

  return (
    <section className="space-y-6" aria-label="Public and private game rooms">
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={createRoom} className="rounded-[1.75rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.08] to-white/[0.025] p-5 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.23em] text-cyan-300">Start a live match</p><h2 className="mt-2 text-2xl font-black text-white">Create a room</h2><p className="mt-2 text-sm leading-6 text-slate-400">Choose a game and invite a friend. Every move syncs between two real players.</p>
          <label htmlFor="room-game" className="mt-5 block text-xs font-bold text-slate-300">Game mode<select id="room-game" value={gameSlug} onChange={(event) => setGameSlug(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50">{multiplayerGames.map((game) => <option key={game.slug} value={game.slug}>{game.title}</option>)}</select></label>
          <p className="mt-2 text-xs leading-5 text-slate-500">{multiplayerGames.find((game) => game.slug === gameSlug)?.description}</p>
          <label htmlFor="room-name" className="mt-4 block text-xs font-bold text-slate-300">Room name<input id="room-name" value={roomName} onChange={(event) => setRoomName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }} maxLength={48} required className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50" /></label>
          <fieldset className="mt-4"><legend className="text-xs font-bold text-slate-300">Who can join?</legend><div className="mt-2 grid grid-cols-2 gap-2"><label className={`cursor-pointer rounded-xl border p-3 text-sm transition ${visibility === 'public' ? 'border-cyan-300/40 bg-cyan-300/[0.08] text-cyan-100' : 'border-white/10 text-slate-400'}`}><input type="radio" name="visibility" value="public" checked={visibility === 'public'} onChange={() => setVisibility('public')} className="sr-only" /><span className="font-bold">Public</span><span className="mt-1 block text-[11px] opacity-70">Listed for anyone</span></label><label className={`cursor-pointer rounded-xl border p-3 text-sm transition ${visibility === 'code' ? 'border-fuchsia-300/40 bg-fuchsia-300/[0.08] text-fuchsia-100' : 'border-white/10 text-slate-400'}`}><input type="radio" name="visibility" value="code" checked={visibility === 'code'} onChange={() => setVisibility('code')} className="sr-only" /><span className="font-bold">Private</span><span className="mt-1 block text-[11px] opacity-70">Code required</span></label></div></fieldset>
          <button type="submit" disabled={busy || !roomName.trim()} className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{busy ? 'Creating room…' : visibility === 'public' ? 'Create public room' : 'Create private room'}</button>
        </form>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.23em] text-fuchsia-200">Have an invite?</p><h2 className="mt-2 text-2xl font-black text-white">Join by code</h2><p className="mt-2 text-sm leading-6 text-slate-400">Enter the ARC code your friend shared by call or text.</p>
          <form onSubmit={joinByCode} className="mt-5 flex gap-2"><label className="sr-only" htmlFor="join-room-code">Private room code</label><input id="join-room-code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }} maxLength={12} required placeholder="ARC-1A2B3C4D" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 font-mono text-sm tracking-widest text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-300/50" /><button type="submit" disabled={busy || !joinCode.trim()} className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/10 px-4 py-3 text-sm font-bold text-fuchsia-100 transition hover:bg-fuchsia-300/20 disabled:opacity-50">Join</button></form>
          <div className="mt-6 rounded-xl border border-white/[0.07] bg-black/10 p-4"><p className="text-xs font-bold text-white">Real players, shared board</p><p className="mt-1 text-xs leading-5 text-slate-500">Both players sign in, take alternating turns, and see the same match state. Solo games never use rooms.</p></div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.23em] text-cyan-300">Open lobby</p><h2 className="mt-2 text-2xl font-black text-white">Public rooms</h2><p className="mt-2 text-sm text-slate-400">Join an open match—no invite code needed.</p></div><button type="button" onClick={() => refreshRooms()} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-cyan-300/40 hover:text-white">Refresh list</button></div>
        {errorMessage && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] px-4 py-3 text-sm text-rose-100" role="alert">{errorMessage}</p>}
        {listError && <p className="mt-4 text-sm text-rose-200" role="alert">{listError.message}</p>}
        {roomError && <p className="mt-4 text-sm text-rose-200" role="alert">{roomError.message}</p>}
        {notice && <p className="mt-4 text-sm text-emerald-200" role="status">{notice}</p>}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(listData?.rooms ?? []).map((publicRoom) => <article key={publicRoom.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0a1020]/80 p-4"><div className="min-w-0"><h3 className="truncate text-sm font-bold text-white">{publicRoom.name}</h3><p className="mt-1 truncate text-xs text-slate-400">{getGameTitle(publicRoom.gameSlug)} · hosted by {publicRoom.hostName} · {publicRoom.playersCount}/{publicRoom.maxPlayers}</p></div><button type="button" onClick={() => joinPublic(publicRoom.id)} disabled={Boolean(busyRoomId)} className="shrink-0 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{busyRoomId === publicRoom.id ? 'Joining…' : 'Join room'}</button></article>)}
        </div>
        {!listData?.rooms?.length && !listError && <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center"><p className="text-sm font-bold text-white">No public rooms yet</p><p className="mt-1 text-xs text-slate-500">Create one and it will show up here for other players.</p></div>}
      </div>
      {(errorMessage || notice) && <div className="sr-only" role="status">{errorMessage || notice}</div>}
    </section>
  )
}
