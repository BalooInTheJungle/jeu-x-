import type { GameModule } from '@/lib/platform/types'
import { undercoverModule } from './undercover'
import { elduModule } from './eldu'

// Registre central des jeux — ajouter un jeu ici pour le rendre disponible sur la plateforme
export const gameRegistry = new Map<string, GameModule>([
  ['undercover', undercoverModule],
  ['eldu', elduModule],
])
