import 'server-only'
import { pool } from '@/lib/auth'

export type RoomGameSlug = 'grid-tactics' | 'connect-four' | 'five-in-a-row'
export type RoomGameState = { board: string[]; turn: 'X' | 'O'; winner: string }

const gameBoards: Record<RoomGameSlug, { width: number; height: number; line: number }> = {
  'grid-tactics': { width: 3, height: 3, line: 3 },
  'connect-four': { width: 7, height: 6, line: 4 },
  'five-in-a-row': { width: 15, height: 15, line: 5 },
}

export function isRoomGameSlug(value: string): value is RoomGameSlug {
  return value in gameBoards
}

export const emptyRoomState = (gameSlug: RoomGameSlug = 'grid-tactics'): RoomGameState => ({
  board: Array(gameBoards[gameSlug].width * gameBoards[gameSlug].height).fill(''),
  turn: 'X',
  winner: '',
})

export function dropConnectFourDisc(board: string[], column: number, mark: 'X' | 'O') {
  const next = [...board]
  for (let row = 5; row >= 0; row -= 1) {
    const index = row * 7 + column
    if (!next[index]) {
      next[index] = mark
      return next
    }
  }
  return null
}

export function getBoardWinner(board: string[], gameSlug: RoomGameSlug = 'grid-tactics') {
  const { width, height, line } = gameBoards[gameSlug]
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const mark = board[row * width + column]
      if (!mark) continue
      for (const [rowStep, columnStep] of directions) {
        let count = 1
        for (let step = 1; step < line; step += 1) {
          const nextRow = row + rowStep * step
          const nextColumn = column + columnStep * step
          if (nextRow < 0 || nextRow >= height || nextColumn < 0 || nextColumn >= width || board[nextRow * width + nextColumn] !== mark) break
          count += 1
        }
        if (count === line) return mark
      }
    }
  }
  return board.every(Boolean) ? 'draw' : ''
}

export async function getRoomView(roomId: string, userId: string) {
  const roomResult = await pool.query('SELECT * FROM public.game_rooms WHERE id = $1', [roomId])
  const room = roomResult.rows[0]
  if (!room) return null

  const playerResult = await pool.query(
    'SELECT user_id, display_name, joined_at FROM public.game_room_players WHERE room_id = $1 ORDER BY joined_at, user_id',
    [roomId],
  )
  const players = playerResult.rows
  if (!players.some((player) => player.user_id === userId)) return null

  const state = typeof room.game_state === 'string' ? JSON.parse(room.game_state) : room.game_state
  return {
    id: room.id as string,
    name: room.name as string,
    gameSlug: room.game_slug as string,
    visibility: room.visibility as 'public' | 'code',
    status: room.status as 'open' | 'full' | 'closed',
    playersCount: Number(room.players_count),
    maxPlayers: Number(room.max_players),
    hostName: players.find((player) => player.user_id === room.host_user_id)?.display_name ?? 'Player',
    gameState: (state ?? (isRoomGameSlug(room.game_slug) ? emptyRoomState(room.game_slug) : emptyRoomState())) as RoomGameState,
    myMark: players.findIndex((player) => player.user_id === userId) === 0 ? 'X' : 'O',
    players: players.map((player, index) => ({
      userId: player.user_id as string,
      displayName: player.display_name as string,
      mark: index === 0 ? 'X' : 'O',
    })),
    inviteCode: room.host_user_id === userId ? (room.join_code as string | null) : null,
    revision: Number(room.revision),
  }
}

export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const trusted = [
    new URL(request.url).origin,
    process.env.BETTER_AUTH_URL,
    process.env.V0_RUNTIME_URL,
    process.env.V0_DEV_APP_URL,
    process.env.V0_BUILD_URL,
    process.env.V0_SANDBOX_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  ].filter((value): value is string => Boolean(value)).map((value) => {
    try { return new URL(value).origin } catch { return '' }
  })
  return trusted.includes(origin)
}
