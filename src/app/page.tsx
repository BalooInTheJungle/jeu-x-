import Link from 'next/link'

const GAMES = [
  {
    id: 'undercover',
    name: 'Undercover',
    description: "Trouvez l'imposteur parmi vous",
    badge: '3–10 joueurs',
    href: '/rooms/new?game=undercover',
    gradient: 'linear-gradient(135deg, #6A1B9A 0%, #9C27B0 50%, #CE93D8 100%)',
    emoji: '🕵️',
    floatAnim: 'float 3s ease-in-out infinite',
  },
  {
    id: 'eldu',
    name: 'ELDU',
    description: 'Le quiz ultime du soir',
    badge: '2 joueurs + 1 arbitre',
    href: '/rooms/new?game=eldu',
    gradient: 'linear-gradient(135deg, #E65100 0%, #FF6035 50%, #FFAB76 100%)',
    emoji: '🏆',
    floatAnim: 'floatB 3s ease-in-out infinite',
  },
  {
    id: 'toktik',
    name: 'TokTik',
    description: 'Chrono, réfléchis vite !',
    badge: '2 joueurs · 1 téléphone',
    href: '/games/toktik',
    gradient: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #66BB6A 100%)',
    emoji: '⏱️',
    floatAnim: 'floatC 3s ease-in-out infinite',
  },
  {
    id: 'isam',
    name: 'ISAM',
    description: 'Tu crois le connaître ? Prouve-le.',
    badge: '2 joueurs · duel intime',
    href: '/rooms/new?game=isam',
    gradient: 'linear-gradient(135deg, #880E4F 0%, #C2185B 50%, #F48FB1 100%)',
    emoji: '🫀',
    floatAnim: 'floatB 3s ease-in-out infinite',
  },
]

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#FAFAF8',
      fontFamily: "'Nunito', sans-serif",
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '28px 20px 12px', maxWidth: 448, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 900, color: '#1A1A2E',
              lineHeight: 1.1, letterSpacing: -0.5, margin: 0,
            }}>
              Kclo Games
            </h1>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#FF6035', marginTop: 4, marginBottom: 0 }}>
              Soir de jeux 🎉
            </p>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #FF6035, #FF8C60)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 4px 14px rgba(255,96,53,0.4)',
          }}>🎮</div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: '16px 20px 8px', maxWidth: 448, margin: '0 auto' }}>
        <p style={{
          fontSize: 13, fontWeight: 900, color: '#1A1A2E',
          textTransform: 'uppercase', letterSpacing: 1, margin: 0,
        }}>
          Choisissez un jeu
        </p>
      </div>

      {/* Game cards */}
      <div style={{
        padding: '0 20px',
        display: 'flex', flexDirection: 'column', gap: 16,
        maxWidth: 448, margin: '0 auto',
      }}>
        {GAMES.map((game) => (
          <Link
            key={game.id}
            href={game.href}
            style={{
              display: 'block',
              background: game.gradient,
              borderRadius: 24,
              padding: '22px 20px 20px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              textDecoration: 'none',
            }}
          >
            {/* Decorative blobs */}
            <div style={{
              position: 'absolute', top: -30, right: -20,
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: -10,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            }} />

            {/* Floating emoji */}
            <div style={{
              position: 'absolute', top: -6, right: 16,
              fontSize: 58, lineHeight: 1,
              animation: game.floatAnim,
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))',
            }}>
              {game.emoji}
            </div>

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.25)',
              borderRadius: 100, padding: '4px 10px',
              fontSize: 11, fontWeight: 800, color: '#FFF',
              marginBottom: 10, backdropFilter: 'blur(4px)',
            }}>
              👥 {game.badge}
            </div>

            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', lineHeight: 1.1, marginBottom: 6 }}>
              {game.name}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 14 }}>
              {game.description}
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 100, padding: '8px 18px',
              fontSize: 13, fontWeight: 900, color: '#1A1A2E',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              Jouer →
            </div>
          </Link>
        ))}
      </div>

      {/* Join with code */}
      <div style={{ padding: '24px 20px 48px', maxWidth: 448, margin: '0 auto' }}>
        <Link
          href="/rooms/join"
          style={{
            display: 'block', textAlign: 'center',
            padding: 16, borderRadius: 18,
            border: '2.5px solid #FF6035',
            color: '#FF6035',
            fontSize: 15, fontWeight: 900,
            textDecoration: 'none',
          }}
        >
          🔑 Rejoindre avec un code
        </Link>
      </div>
    </main>
  )
}
