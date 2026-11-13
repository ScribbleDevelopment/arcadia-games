export type GameGenre = 'arcade' | 'action' | 'puzzle' | 'rpg' | 'strategy' | 'racing' | 'sports' | 'adventure' | 'card' | 'simulation'
export type GameMode = 'solo' | 'solo-online' | 'online'
export type GameTier = 'free' | 'pass'

export type ArcadiaGame = {
  slug: string
  title: string
  genre: GameGenre
  mood: string
  mode: GameMode
  tier: GameTier
  description: string
}

export const games: ArcadiaGame[] = [
  { slug: 'neon-drift', title: 'Neon Drift', genre: 'racing', mood: 'Fast', mode: 'solo', tier: 'free', description: 'Switch lanes at the last second, dodge a faster stream of barriers, and beat your longest run.' },
  { slug: 'pixel-raiders', title: 'Pixel Raiders', genre: 'action', mood: 'Arcade', mode: 'solo', tier: 'free', description: 'Survive escalating enemy waves with quick shots, charged attacks, and limited evades.' },
  { slug: 'garden-grid', title: 'Garden Grid', genre: 'puzzle', mood: 'Cozy', mode: 'solo', tier: 'free', description: 'Flip garden tiles, remember their locations, and clear every seed pair in as few turns as you can.' },
  { slug: 'grid-tactics', title: 'Grid Tactics', genre: 'strategy', mood: 'Competitive', mode: 'solo-online', tier: 'free', description: 'Outthink an adaptive rival in a quick tactical duel, or challenge a real player in a live room.' },
  { slug: 'relic-run', title: 'Relic Run', genre: 'rpg', mood: 'Adventure', mode: 'solo', tier: 'free', description: 'Read the boss, manage a tiny potion supply, and choose when to attack or guard.' },
  { slug: 'lost-signal', title: 'Lost Signal', genre: 'adventure', mood: 'Story', mode: 'solo', tier: 'free', description: 'Explore a four-chapter mystery. Your choices change your supplies and decide the ending.' },
  { slug: 'target-practice', title: 'Target Practice', genre: 'sports', mood: 'Precision', mode: 'solo', tier: 'free', description: 'Time five shots through a moving power window and chase a perfect score.' },
  { slug: 'high-stakes', title: 'High Stakes', genre: 'card', mood: 'Risky', mode: 'solo', tier: 'free', description: 'Call higher or lower, protect a streak by cashing out, or risk your unbanked points on another draw.' },
  { slug: 'signal-rush', title: 'Signal Rush', genre: 'arcade', mood: 'Reflex', mode: 'solo', tier: 'free', description: 'Hit the changing signal before it jumps. Every second gets tighter; every miss costs points.' },
  { slug: 'pocket-greenhouse', title: 'Pocket Greenhouse', genre: 'simulation', mood: 'Cozy', mode: 'solo', tier: 'free', description: 'Balance a limited water supply to bring three unusual plants to full bloom.' },
  { slug: 'connect-four', title: 'Connect Four', genre: 'strategy', mood: 'Head-to-head', mode: 'online', tier: 'free', description: 'Drop discs into a shared live board. Connect four before your opponent blocks the line.' },
  { slug: 'five-in-a-row', title: 'Five in a Row', genre: 'strategy', mood: 'Head-to-head', mode: 'online', tier: 'free', description: 'Claim open intersections on a 15×15 board and make an unbroken line of five.' },
  { slug: 'rift-warden', title: 'Rift Warden', genre: 'action', mood: 'Campaign', mode: 'solo', tier: 'pass', description: 'Fight through a six-encounter 3D campaign, read boss tells, and draft upgrades between waves.' },
  { slug: 'astral-archive', title: 'Astral Archive', genre: 'adventure', mood: 'Expedition', mode: 'solo', tier: 'pass', description: 'Decode a branching observatory expedition, manage supplies, and recover four relics before the final gate.' },
]

export const getGame = (slug: string) => games.find((game) => game.slug === slug)
export const freeGames = games.filter((game) => game.tier === 'free')
export const passGames = games.filter((game) => game.tier === 'pass')
export const soloGames = games.filter((game) => game.mode !== 'online')
export const multiplayerGames = games.filter((game) => game.mode !== 'solo')
