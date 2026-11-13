import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth, pool } from '@/lib/auth'
import { dropConnectFourDisc, emptyRoomState, getBoardWinner, getRoomView, isRoomGameSlug, isTrustedOrigin, type RoomGameSlug, type RoomGameState } from '@/lib/room-service'

export const runtime = 'nodejs'
type RouteContext = { params: Promise<{ roomId: string }> }

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Sign in to view this room.' }, { status: 401 })
  const { roomId } = await params
  const room = await getRoomView(roomId, user.id)
  if (!room) return NextResponse.json({ error: 'Room not found or you are not a member.' }, { status: 404 })
  return NextResponse.json({ room })
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 })
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Sign in to play.' }, { status: 401 })
  const { roomId } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const roomResult = await client.query('SELECT * FROM public.game_rooms WHERE id = $1 FOR UPDATE', [roomId])
    const room = roomResult.rows[0]
    if (!room || room.status === 'closed') {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Room is closed or no longer available.' }, { status: 404 })
    }
    const playersResult = await client.query(
      'SELECT user_id FROM public.game_room_players WHERE room_id = $1 ORDER BY joined_at, user_id',
      [roomId],
    )
    const markIndex = playersResult.rows.findIndex((player) => player.user_id === user.id)
    if (markIndex < 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Join this room before making a move.' }, { status: 403 })
    }

    const state = (typeof room.game_state === 'string' ? JSON.parse(room.game_state) : room.game_state) as RoomGameState
    const gameSlug = typeof room.game_slug === 'string' && isRoomGameSlug(room.game_slug) ? room.game_slug : null
    if (!gameSlug) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'This room uses an unsupported game.' }, { status: 409 })
    }
    let nextState: RoomGameState
    if (body.action === 'move') {
      if (playersResult.rows.length !== 2 || room.status !== 'full') {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Waiting for another player to join.' }, { status: 409 })
      }
      const mark = markIndex === 0 ? 'X' : 'O'
      if (state.winner || state.turn !== mark) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'It is not your turn or the match is over.' }, { status: 409 })
      }
      let board: string[] | null = null
      if (gameSlug === 'connect-four') {
        const column = body.column
        if (!Number.isInteger(column) || Number(column) < 0 || Number(column) > 6) {
          await client.query('ROLLBACK')
          return NextResponse.json({ error: 'Choose a valid column.' }, { status: 400 })
        }
        board = dropConnectFourDisc(state.board, Number(column), mark)
        if (!board) {
          await client.query('ROLLBACK')
          return NextResponse.json({ error: 'That column is full. Choose another.' }, { status: 409 })
        }
      } else {
        const cell = body.cell
        const boardSize = gameSlug === 'grid-tactics' ? 9 : 225
        if (!Number.isInteger(cell) || Number(cell) < 0 || Number(cell) >= boardSize) {
          await client.query('ROLLBACK')
          return NextResponse.json({ error: 'Choose a valid square.' }, { status: 400 })
        }
        if (state.board[Number(cell)]) {
          await client.query('ROLLBACK')
          return NextResponse.json({ error: 'That square is taken.' }, { status: 409 })
        }
        board = [...state.board]
        board[Number(cell)] = mark
      }
      const winner = getBoardWinner(board, gameSlug)
      nextState = { board, turn: mark === 'X' ? 'O' : 'X', winner }
    } else if (body.action === 'reset') {
      if (!state.winner) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Finish the current match before starting a rematch.' }, { status: 409 })
      }
      nextState = emptyRoomState(gameSlug)
    } else {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Unsupported game action.' }, { status: 400 })
    }

    await client.query(
      'UPDATE public.game_rooms SET game_state = $2::jsonb, revision = revision + 1, updated_at = now() WHERE id = $1',
      [roomId, JSON.stringify(nextState)],
    )
    await client.query('COMMIT')
    return NextResponse.json({ room: await getRoomView(roomId, user.id) })
  } catch {
    await client.query('ROLLBACK').catch(() => undefined)
    return NextResponse.json({ error: 'Move could not be saved. Please retry.' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 })
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Sign in to leave a room.' }, { status: 401 })
  const { roomId } = await params
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const roomResult = await client.query('SELECT host_user_id, game_slug FROM public.game_rooms WHERE id = $1 FOR UPDATE', [roomId])
    const room = roomResult.rows[0]
    if (!room) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
    }
    const removed = await client.query('DELETE FROM public.game_room_players WHERE room_id = $1 AND user_id = $2', [roomId, user.id])
    if (!removed.rowCount) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'You are not a member of this room.' }, { status: 403 })
    }
    if (room.host_user_id === user.id) {
      await client.query('DELETE FROM public.game_room_players WHERE room_id = $1', [roomId])
      await client.query("UPDATE public.game_rooms SET status = 'closed', players_count = 0, updated_at = now() WHERE id = $1", [roomId])
    } else {
      await client.query(
        `UPDATE public.game_rooms SET players_count = GREATEST(players_count - 1, 0),
         status = 'open', game_state = $2::jsonb, revision = revision + 1, updated_at = now() WHERE id = $1`,
        [roomId, JSON.stringify(isRoomGameSlug(room.game_slug) ? emptyRoomState(room.game_slug) : emptyRoomState())],
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true })
  } catch {
    await client.query('ROLLBACK').catch(() => undefined)
    return NextResponse.json({ error: 'Unable to leave this room.' }, { status: 500 })
  } finally {
    client.release()
  }
}
