import type { GameModule } from '@/lib/platform/types'

// Registre central des jeux — ajouter un jeu ici pour le rendre disponible sur la plateforme
// Exemple : gameRegistry.set('image_quiz', imageQuizModule)
export const gameRegistry = new Map<string, GameModule>()
