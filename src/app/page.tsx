import Link from 'next/link'

interface GameCard {
  id: string
  name: string
  description: string
  players: string
  duration: string
  href: string
  tag: string
  tagColor: string
}

const GAMES: GameCard[] = [
  {
    id: 'undercover',
    name: 'Undercover',
    description: 'Trouve l\'espion parmi vous avant qu\'il ne vous découvre.',
    players: '3–10 joueurs',
    duration: '15–30 min',
    href: '/rooms/new?game=undercover',
    tag: 'Déduction sociale',
    tagColor: 'bg-purple-900 text-purple-300',
  },
  {
    id: 'image_quiz',
    name: 'Image Quiz',
    description: 'Reconnais le personnage avant ton adversaire. L\'arbitre valide à la voix.',
    players: '2 joueurs + 1 arbitre',
    duration: '5–15 min',
    href: '/rooms/new?game=image_quiz',
    tag: 'Brawl Stars',
    tagColor: 'bg-yellow-900 text-yellow-300',
  },
  {
    id: 'toktik',
    name: 'TokTik',
    description: 'Qui arrêtera le chrono le plus proche de la cible ? Duel de précision.',
    players: '2 joueurs · 1 téléphone',
    duration: '5–10 min',
    href: '/games/toktik',
    tag: 'Local · 1 téléphone',
    tagColor: 'bg-emerald-900 text-emerald-300',
  },
]

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-950 px-4 py-12 text-white">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Kclo Games</h1>
        <p className="mt-3 text-slate-400">Jeux de soirée — rejoins en 30 secondes</p>
      </div>

      {/* Cartes jeux */}
      <div className="w-full max-w-sm flex flex-col gap-4 mb-8">
        {GAMES.map(game => (
          <Link
            key={game.id}
            href={game.href}
            className="block bg-zinc-900 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-600 transition-colors active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-bold">{game.name}</h2>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${game.tagColor}`}>
                {game.tag}
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">{game.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>{game.players}</span>
              <span>·</span>
              <span>{game.duration}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Rejoindre */}
      <Link
        href="/rooms/join"
        className="w-full max-w-sm flex items-center justify-center rounded-xl border border-zinc-700 px-6 py-4 text-slate-300 hover:bg-zinc-800 hover:text-white transition-colors"
      >
        Rejoindre avec un code
      </Link>
    </main>
  )
}
