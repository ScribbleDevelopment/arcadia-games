import { passGames } from '@/lib/games'

export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
}

export const PRODUCTS: Product[] = [
  {
    id: 'arcadia-pass-monthly',
    name: 'Arcadia Pass',
    description: `Access to ${passGames.length} complete premium 3D campaigns: Rift Warden and Astral Archive. All 12 free games stay free.`,
    priceInCents: 200,
  },
]
