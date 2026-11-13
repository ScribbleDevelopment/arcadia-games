import { randomBytes, randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth, pool } from '@/lib/auth'
import { emptyRoomState, getRoomView, isRoomGameSlug, isTrustedOrigin } from '@/lib/room-service'

export const runtime = 'nodejs'

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function GET() {
  const result = await pool.query(
    `SELECT r.id, r.name, r.game_slug, r.players_count, r.max_players, r.created_at,
      host.display_name AS host_name
     FROM public.game_rooms r
     JOIN public.game_room_players host ON host.room_id = r.id AND host.user_id = r.host_user_id
     WHERE r.visibility = 'public' AND r.status = 'open' AND r.players_count < r.max_players
     ORDER BY r.created_at DESC LIMIT 40`,
  )
  return NextResponse.json({ rooms: result.rows.map((room) => ({
    id: room.id,
    name: room.name,
    gameSlug: room.game_slug,
    playersCount: Number(room.players_count),
    maxPlayers: Number(room.max_players),
    createdAt: room.created_at,
    hostName: room.host_name,
  })) })
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 })
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Sign in to create or join a room.' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (body.action === 'create') {
      const visibility = body.visibility === 'code' ? 'code' : body.visibility === 'public' ? 'public' : null
      const gameSlug = typeof body.gameSlug === 'string' ? body.gameSlug.trim().toLowerCase() : ''
      const roomName = typeof body.name === 'string' ? body.name.trim().slice(0, 48) : ''
      if (!visibility || !isRoomGameSlug(gameSlug) || !roomName) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Choose a valid game and room name.' }, { status: 400 })
      }
      const id = randomUUID()
      const joinCode = visibility === 'code' ? `ARC-${randomBytes(4).toString('hex').toUpperCase()}` : null
      const state = emptyRoomState(gameSlug)
      await client.query(
        `INSERT INTO public.game_rooms (id, game_slug, name, visibility, join_code, host_user_id, players_count, max_players, status, game_state)
         VALUES ($1, $2, $3, $4, $5, $6, 1, 2, 'open', $7::jsonb)`,
        [id, gameSlug, roomName, visibility, joinCode, user.id, JSON.stringify(state)],
      )
      await client.query(
        'INSERT INTO public.game_room_players (room_id, user_id, display_name) VALUES ($1, $2, $3)',
        [id, user.id, user.name?.trim().slice(0, 40) || 'Player'],
      )
      await client.query('COMMIT')
      return NextResponse.json({ room: await getRoomView(id, user.id) }, { status: 201 })
    }

    if (body.action === 'join') {
      const roomId = typeof body.roomId === 'string' ? body.roomId : ''
      const joinCode = typeof body.joinCode === 'string' ? body.joinCode.trim().toUpperCase() : ''
      if (!roomId && !/^ARC-[A-F0-9]{8}$/.test(joinCode)) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Enter a valid room code or choose a public room.' }, { status: 400 })
      }
      const roomResult = await client.query(
        `SELECT id, status, players_count, max_players FROM public.game_rooms
         WHERE (id = $1 AND visibility = 'public') OR (visibility = 'code' AND join_code = $2)
         FOR UPDATE`,
        [roomId, joinCode],
      )
      const room = roomResult.rows[0]
      if (!room) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'That room is unavailable. Check the code or try another room.' }, { status: 404 })
      }
      const existingPlayer = await client.query(
        'SELECT 1 FROM public.game_room_players WHERE room_id = $1 AND user_id = $2',
        [room.id, user.id],
      )
      if (existingPlayer.rowCount) {
        await client.query('COMMIT')
        return NextResponse.json({ room: await getRoomView(room.id, user.id) })
      }
      if (room.status !== 'open' || Number(room.players_count) >= Number(room.max_players)) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'This room is already full.' }, { status: 409 })
      }
      await client.query(
        'INSERT INTO public.game_room_players (room_id, user_id, display_name) VALUES ($1, $2, $3)',
        [room.id, user.id, user.name?.trim().slice(0, 40) || 'Player'],
      )
      await client.query(
        `UPDATE public.game_rooms SET players_count = players_count + 1,
         status = CASE WHEN players_count + 1 >= max_players THEN 'full' ELSE 'open' END,
         updated_at = now() WHERE id = $1`,
        [room.id],
      )
      await client.query('COMMIT')
      return NextResponse.json({ room: await getRoomView(room.id, user.id) })
    }

    await client.query('ROLLBACK')
    return NextResponse.json({ error: 'Unsupported room action.' }, { status: 400 })
  } catch {
    await client.query('ROLLBACK').catch(() => undefined)
    return NextResponse.json({ error: 'Room request failed. Please try again.' }, { status: 500 })
  } finally {
    client.release()
  }
}
