import type { GameModule } from '@/lib/platform/types'
import { undercoverModule } from './undercover'

// Registre central des jeux — ajouter un jeu ici pour le rendre disponible sur la plateforme
export const gameRegistry = new Map<string, GameModule>([
  ['undercover', undercoverModule],
])
