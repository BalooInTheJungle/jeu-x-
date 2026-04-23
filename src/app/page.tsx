import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 p-8 text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">Kclo Games</h1>
        <p className="mt-3 text-lg text-slate-400">Jeux de soirée multijoueurs — rejoins en 30 secondes</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/rooms/new"
          className="flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold hover:bg-indigo-500 transition-colors"
        >
          Créer une partie
        </Link>
        <Link
          href="/rooms/join"
          className="flex items-center justify-center rounded-xl border border-slate-700 px-6 py-4 text-lg font-semibold hover:bg-slate-800 transition-colors"
        >
          Rejoindre une partie
        </Link>
      </div>
    </main>
  )
}
