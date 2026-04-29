'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import UndercoverGameView from '@/components/games/undercover/GameView'
import ElduGameView from '@/components/games/eldu/GameView'
import IsamGameView from '@/components/games/isam/GameView'
import type { RoomPlayerRow, RoomRow } from '@/lib/platform/types'
import { GAME_THEMES, DEFAULT_THEME } from '@/lib/games/theme'
import { getAvatarColor, getAvatarEmoji } from '@/lib/utils/avatar'

interface Props {
  initialRoom: RoomRow & { room_players: RoomPlayerRow[] }
  currentPlayerId: string
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#FAFAF8',
    fontFamily: "'Nunito', sans-serif",
    color: '#1A1A2E',
  },
  btn: {
    width: '100%', padding: 18,
    borderRadius: 20, border: 'none',
    background: 'linear-gradient(90deg, #FF6035, #FF8C60)',
    color: '#FFF', fontSize: 17, fontWeight: 900,
    fontFamily: "'Nunito', sans-serif",
    boxShadow: '0 8px 28px rgba(255,96,53,0.45)',
    cursor: 'pointer',
  },
  btnGhost: {
    width: '100%', padding: 16,
    borderRadius: 18, border: '2.5px solid rgba(26,26,46,0.2)',
    background: 'transparent',
    color: '#1A1A2E', fontSize: 15, fontWeight: 900,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    marginTop: 10,
  },
  input: {
    width: '100%', boxSizing: 'border-box' as const,
    borderRadius: 16, border: '2px solid #E8E8E8',
    background: '#FFF',
    padding: '12px 16px',
    fontSize: 15, fontWeight: 700, color: '#1A1A2E',
    fontFamily: "'Nunito', sans-serif",
    outline: 'none',
  },
  label: {
    fontSize: 13, fontWeight: 800, color: '#1A1A2E',
    display: 'block', marginBottom: 6,
  },
}

export default function RoomLobby({ initialRoom, currentPlayerId }: Props) {
  const [players, setPlayers] = useState<RoomPlayerRow[]>(initialRoom.room_players)
  const [status, setStatus] = useState(initialRoom.status)
  const [room, setRoom] = useState(initialRoom)
  const [starting, setStarting] = useState(false)

  const isHost = initialRoom.host_id === currentPlayerId
  const code = initialRoom.code
  const theme = GAME_THEMES[room.game_type] ?? DEFAULT_THEME

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`room-${initialRoom.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${initialRoom.id}` },
        (payload) => {
          console.log('[RoomLobby] player change:', payload.eventType)
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as RoomPlayerRow])
          }
          if (payload.eventType === 'UPDATE') {
            setPlayers((prev) => prev.map((p) => (p.id === payload.new.id ? (payload.new as RoomPlayerRow) : p)))
          }
          if (payload.eventType === 'DELETE') {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${initialRoom.id}` },
        (payload) => {
          console.log('[RoomLobby] room update:', payload.new.status)
          setStatus(payload.new.status as RoomRow['status'])
          setRoom(prev => ({ ...prev, ...(payload.new as RoomRow) }))
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [initialRoom.id])

  if (status === 'playing' || status === 'finished') {
    const liveRoom = { ...room, room_players: players }

    if (room.game_type === 'undercover') {
      return <UndercoverGameView room={liveRoom} roomCode={code} currentPlayerId={currentPlayerId} />
    }

    if (room.game_type === 'eldu') {
      return <ElduGameView room={liveRoom} roomCode={code} currentPlayerId={currentPlayerId} />
    }

    if (room.game_type === 'isam') {
      return <IsamGameView room={liveRoom} roomCode={code} currentPlayerId={currentPlayerId} />
    }

    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#FF6035' }}>La partie commence !</p>
      </div>
    )
  }

  // ─── Waiting state ────────────────────────────────────────────────────
  const slotCount = Math.max(players.length + 3, 6)

  return (
    <div style={S.page}>
      {/* Header band with game gradient */}
      <div style={{
        background: theme.gradient,
        padding: '28px 20px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }}/>
        <div style={{ position:'absolute', bottom:-40, left:20, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>

        <p style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>
          {theme.name} {theme.emoji}
        </p>
        <p style={{ fontSize:17, fontWeight:900, color:'#FFF', marginBottom:20 }}>
          Salle d&apos;attente
        </p>

        {/* Room code */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <p style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>
            Code de la salle
          </p>
          <div style={{
            background:'rgba(255,255,255,0.95)', borderRadius:20,
            padding:'14px 32px', display:'flex', gap:10, alignItems:'center',
          }}>
            {code.split('').map((c, i) => (
              <span key={i} style={{
                fontSize:32, fontWeight:900, color: theme.primary,
                letterSpacing:4,
                animation:`popIn 0.4s ${i * 0.08}s both`,
              }}>{c}</span>
            ))}
          </div>
          <p style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', marginTop:10 }}>
            Partagez ce code avec vos amis
          </p>
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        margin: '0 20px', marginTop: -1,
        background: 'linear-gradient(90deg, #FF6035, #FF8C60)',
        borderRadius: '0 0 20px 20px',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 6px 20px rgba(255,96,53,0.35)',
        animation: 'pulse-coral 2s infinite',
      }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'#FFF' }}/>
        <span style={{ fontSize:13, fontWeight:900, color:'#FFF' }}>
          {players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''} ✓
        </span>
      </div>

      {/* Player grid */}
      <div style={{ padding:'24px 20px 12px' }}>
        <p style={{ fontSize:13, fontWeight:900, color:'#1A1A2E', textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>
          Joueurs ({players.length})
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
          {Array.from({ length: slotCount }).map((_, i) => {
            const player = players[i]
            if (player) {
              return (
                <div key={player.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, animation:`popIn 0.4s ${i * 0.08}s both` }}>
                  <div style={{
                    width:64, height:64, borderRadius:'50%',
                    background: getAvatarColor(i),
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:30,
                    boxShadow:`0 6px 20px ${getAvatarColor(i)}66`,
                    border:'3px solid rgba(255,255,255,0.8)',
                    position:'relative',
                  }}>
                    {getAvatarEmoji(player.username)}
                    <div style={{
                      position:'absolute', bottom:2, right:2,
                      width:14, height:14, borderRadius:'50%',
                      background:'#00E676', border:'2px solid #FFF',
                    }}/>
                  </div>
                  <span style={{ fontSize:12, fontWeight:800, color:'#1A1A2E', textAlign:'center' }}>
                    {player.username}{player.is_host ? ' 👑' : ''}{player.id === currentPlayerId ? ' (toi)' : ''}
                  </span>
                </div>
              )
            }
            return (
              <div key={`empty-${i}`} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:0.35 }}>
                <div style={{
                  width:64, height:64, borderRadius:'50%', background:'#DDD',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:24, color:'#999', border:'3px solid #DDD',
                }}>?</div>
                <span style={{ fontSize:12, fontWeight:800, color:'#999' }}>—</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Config or waiting message */}
      <div style={{ padding:'8px 20px 40px' }}>
        {isHost ? (
          room.game_type === 'undercover' ? (
            <UndercoverConfig code={code} playerId={currentPlayerId} players={players} />
          ) : room.game_type === 'eldu' ? (
            <ElduConfig code={code} playerId={currentPlayerId} players={players} />
          ) : room.game_type === 'isam' ? (
            <IsamConfig code={code} playerId={currentPlayerId} players={players} />
          ) : (
            <button
              style={{ ...S.btn, opacity: starting || players.length < 1 ? 0.5 : 1 }}
              disabled={starting || players.length < 1}
              onClick={async () => {
                setStarting(true)
                try {
                  const res = await fetch(`/api/rooms/${code}/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerId: currentPlayerId }),
                  })
                  if (!res.ok) {
                    const data = await res.json() as { error?: string }
                    alert(data.error ?? 'Impossible de démarrer')
                  }
                } finally {
                  setStarting(false)
                }
              }}
            >
              {starting ? 'Démarrage...' : '🚀 Démarrer la partie'}
            </button>
          )
        ) : (
          <div style={{
            background: '#F0EDFF', borderRadius: 16,
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize:22, animation:'bounce-gentle 1.5s infinite' }}>⏳</div>
            <div>
              <p style={{ fontSize:13, fontWeight:900, color:'#6A1B9A', margin:0 }}>En attente du host…</p>
              <p style={{ fontSize:12, fontWeight:600, color:'#9C27B0', opacity:0.8, margin:0 }}>La partie va bientôt commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Config Undercover ─────────────────────────────────────────────────

interface ConfigProps {
  code: string
  playerId: string
  players: RoomPlayerRow[]
}

type UndercoverTheme = 'general' | 'one_piece' | 'brawl_stars' | 'custom'

const UNDERCOVER_THEMES: { value: UndercoverTheme; label: string }[] = [
  { value: 'general', label: 'Général' },
  { value: 'one_piece', label: 'One Piece' },
  { value: 'brawl_stars', label: 'Brawl Stars' },
  { value: 'custom', label: 'Mots perso' },
]

function UndercoverConfig({ code, playerId, players }: ConfigProps) {
  const [theme, setTheme] = useState<UndercoverTheme>('general')
  const [mrWhite, setMrWhite] = useState(true)
  const [hostSpectator, setHostSpectator] = useState(false)
  const [civilWord, setCivilWord] = useState('')
  const [undercoverWord, setUndercoverWord] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (players.length < 3) { setError('Il faut au moins 3 joueurs'); return }
    setStarting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { playerId, theme, mrWhiteEnabled: mrWhite, hostIsSpectator: hostSpectator }
      if (theme === 'custom') {
        if (!civilWord.trim() || !undercoverWord.trim()) {
          setError('Les deux mots sont requis en mode personnalisé')
          setStarting(false)
          return
        }
        body.customWords = { civil: civilWord.trim(), undercover: undercoverWord.trim() }
      }
      const res = await fetch(`/api/rooms/${code}/undercover/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) setError(data.error ?? 'Erreur de démarrage')
    } catch {
      setError('Erreur réseau')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Thème */}
      <div>
        <p style={S.label}>Thème</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
          {UNDERCOVER_THEMES.map(t => (
            <button key={t.value} onClick={() => setTheme(t.value)} style={{
              padding:'10px 12px', borderRadius:14, border:'none',
              fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:800,
              cursor:'pointer',
              background: theme === t.value ? 'linear-gradient(90deg,#FF6035,#FF8C60)' : '#FFF',
              color: theme === t.value ? '#FFF' : '#1A1A2E',
              boxShadow: theme === t.value ? '0 4px 14px rgba(255,96,53,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Mots personnalisés */}
      {theme === 'custom' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <input type="text" value={civilWord} onChange={e => setCivilWord(e.target.value)}
            placeholder="Mot des civils" style={S.input} />
          <input type="text" value={undercoverWord} onChange={e => setUndercoverWord(e.target.value)}
            placeholder="Mot de l'undercover" style={S.input} />
        </div>
      )}

      {/* Toggles */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <ToggleRow
          label="Mr. White" desc="Un joueur sans mot qui doit bluffer"
          value={mrWhite} onChange={setMrWhite} />
        <ToggleRow
          label="Je suis spectateur" desc="Tu animes la partie sans jouer"
          value={hostSpectator} onChange={setHostSpectator} />
      </div>

      {error && <p style={{ fontSize:13, fontWeight:700, color:'#E53935', margin:0, textAlign:'center' }}>{error}</p>}

      <button
        onClick={handleStart}
        disabled={starting || players.length < 3}
        style={{ ...S.btn, opacity: starting || players.length < 3 ? 0.5 : 1, marginTop:4 }}
      >
        {starting ? 'Génération des mots...' : '🚀 Lancer Undercover'}
      </button>

      {players.length < 3 && (
        <p style={{ textAlign:'center', fontSize:13, fontWeight:700, color:'#999', margin:0 }}>
          Encore {3 - players.length} joueur{3 - players.length > 1 ? 's' : ''} pour démarrer
        </p>
      )}
    </div>
  )
}

// ─── Config ELDU ───────────────────────────────────────────────────────

const ELDU_THEMES = [
  { value: 'brawl_stars', label: '🎮 Brawl Stars' },
  { value: 'flags', label: '🌍 Drapeaux' },
  { value: 'rappers_fr', label: '🎤 Rappeurs FR' },
] as const

type ElduThemeKey = 'brawl_stars' | 'flags' | 'rappers_fr'

function ElduConfig({ code, playerId, players }: ConfigProps) {
  const nonHostPlayers = players.filter(p => !p.is_host)
  const [theme, setTheme] = useState<ElduThemeKey>('brawl_stars')
  const [duration, setDuration] = useState(60)
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (nonHostPlayers.length < 2) { setError('Il faut au moins 2 joueurs (hors arbitre)'); return }
    setStarting(true)
    setError(null)
    try {
      const res = await fetch(`/api/rooms/${code}/eldu/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, theme, durationPerPlayer: duration, difficulty }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) setError(data.error ?? 'Erreur de démarrage')
    } catch {
      setError('Erreur réseau')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Arbitre banner */}
      <div style={{
        background:'rgba(255,96,53,0.08)', border:'1.5px solid rgba(255,96,53,0.25)',
        borderRadius:16, padding:'12px 16px',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{ fontSize:20 }}>🎯</span>
        <div>
          <p style={{ fontSize:13, fontWeight:900, color:'#FF6035', margin:0 }}>Tu es l&apos;arbitre</p>
          <p style={{ fontSize:12, fontWeight:600, color:'rgba(255,96,53,0.7)', margin:0 }}>Tu vois les réponses et tu valides à la voix</p>
        </div>
      </div>

      {/* Thème */}
      <div>
        <p style={S.label}>Thème</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {ELDU_THEMES.map(t => (
            <button key={t.value} onClick={() => setTheme(t.value)} style={{
              padding:'10px 8px', borderRadius:14, border:'none',
              fontFamily:"'Nunito',sans-serif", fontSize:12, fontWeight:800,
              cursor:'pointer',
              background: theme === t.value ? 'linear-gradient(90deg,#FF6035,#FF8C60)' : '#FFF',
              color: theme === t.value ? '#FFF' : '#1A1A2E',
              boxShadow: theme === t.value ? '0 4px 14px rgba(255,96,53,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Durée */}
      <div>
        <p style={S.label}>Temps par joueur</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[30, 60, 90].map(s => (
            <button key={s} onClick={() => setDuration(s)} style={{
              padding:'10px 8px', borderRadius:14, border:'none',
              fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:900,
              cursor:'pointer',
              background: duration === s ? 'linear-gradient(90deg,#FF6035,#FF8C60)' : '#FFF',
              color: duration === s ? '#FFF' : '#1A1A2E',
              boxShadow: duration === s ? '0 4px 14px rgba(255,96,53,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
            }}>{s}s</button>
          ))}
        </div>
      </div>

      {/* Difficulté */}
      <div>
        <p style={S.label}>Difficulté</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
          {([['normal', 'Normal'], ['hard', 'Difficile 🌫️']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setDifficulty(val)} style={{
              padding:'10px 8px', borderRadius:14, border:'none',
              fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:800,
              cursor:'pointer',
              background: difficulty === val ? 'linear-gradient(90deg,#FF6035,#FF8C60)' : '#FFF',
              color: difficulty === val ? '#FFF' : '#1A1A2E',
              boxShadow: difficulty === val ? '0 4px 14px rgba(255,96,53,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {error && <p style={{ fontSize:13, fontWeight:700, color:'#E53935', margin:0, textAlign:'center' }}>{error}</p>}

      <button
        onClick={handleStart}
        disabled={starting || nonHostPlayers.length < 2}
        style={{ ...S.btn, opacity: starting || nonHostPlayers.length < 2 ? 0.5 : 1, marginTop:4 }}
      >
        {starting ? 'Chargement des images...' : '🚀 Lancer ELDU'}
      </button>

      {nonHostPlayers.length < 2 && (
        <p style={{ textAlign:'center', fontSize:13, fontWeight:700, color:'#999', margin:0 }}>
          Encore {2 - nonHostPlayers.length} joueur{2 - nonHostPlayers.length > 1 ? 's' : ''} pour démarrer
        </p>
      )}
    </div>
  )
}

// ─── Config ISAM ───────────────────────────────────────────────────────

type IsamThemeKey = 'brawl_stars' | 'lifestyle' | 'mix'

const ISAM_THEMES: { value: IsamThemeKey; label: string }[] = [
  { value: 'brawl_stars', label: '🎮 Brawl Stars' },
  { value: 'lifestyle', label: '✨ Lifestyle' },
  { value: 'mix', label: '🎲 Mix' },
]

function IsamConfig({ code, playerId, players }: ConfigProps) {
  const [theme, setTheme] = useState<IsamThemeKey>('mix')
  const [duration, setDuration] = useState(60)
  const [questionCount, setQuestionCount] = useState(5)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canStart = players.length >= 2

  async function handleStart() {
    if (!canStart) { setError('Il faut exactement 2 joueurs'); return }
    setStarting(true)
    setError(null)
    try {
      const res = await fetch(`/api/rooms/${code}/isam/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, theme, answerDuration: duration, questionCount }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) setError(data.error ?? 'Erreur de démarrage')
    } catch {
      setError('Erreur réseau')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Thème */}
      <div>
        <p style={S.label}>Thème</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {ISAM_THEMES.map(t => (
            <button key={t.value} onClick={() => setTheme(t.value)} style={{
              padding:'10px 8px', borderRadius:14, border:'none',
              fontFamily:"'Nunito',sans-serif", fontSize:12, fontWeight:800,
              cursor:'pointer',
              background: theme === t.value ? 'linear-gradient(90deg,#FF6035,#FF8C60)' : '#FFF',
              color: theme === t.value ? '#FFF' : '#1A1A2E',
              boxShadow: theme === t.value ? '0 4px 14px rgba(255,96,53,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Durée */}
      <div>
        <p style={S.label}>Temps pour répondre</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[30, 60, 90].map(s => (
            <button key={s} onClick={() => setDuration(s)} style={{
              padding:'10px 8px', borderRadius:14, border:'none',
              fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:900,
              cursor:'pointer',
              background: duration === s ? 'linear-gradient(90deg,#FF6035,#FF8C60)' : '#FFF',
              color: duration === s ? '#FFF' : '#1A1A2E',
              boxShadow: duration === s ? '0 4px 14px rgba(255,96,53,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
            }}>{s}s</button>
          ))}
        </div>
      </div>

      {/* Nb questions */}
      <div>
        <p style={S.label}>Nombre de questions</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[3, 5, 7, 10].map(n => (
            <button key={n} onClick={() => setQuestionCount(n)} style={{
              padding:'10px 8px', borderRadius:14, border:'none',
              fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:900,
              cursor:'pointer',
              background: questionCount === n ? 'linear-gradient(90deg,#FF6035,#FF8C60)' : '#FFF',
              color: questionCount === n ? '#FFF' : '#1A1A2E',
              boxShadow: questionCount === n ? '0 4px 14px rgba(255,96,53,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
            }}>{n}</button>
          ))}
        </div>
      </div>

      {error && <p style={{ fontSize:13, fontWeight:700, color:'#E53935', margin:0, textAlign:'center' }}>{error}</p>}

      <button
        onClick={handleStart}
        disabled={starting || !canStart}
        style={{ ...S.btn, opacity: starting || !canStart ? 0.5 : 1, marginTop:4 }}
      >
        {starting ? 'Démarrage...' : '🚀 Lancer ISAM'}
      </button>

      {!canStart && (
        <p style={{ textAlign:'center', fontSize:13, fontWeight:700, color:'#999', margin:0 }}>
          {2 - players.length} joueur{2 - players.length > 1 ? 's' : ''} manquant pour démarrer
        </p>
      )}
    </div>
  )
}

// ─── Toggle Row ────────────────────────────────────────────────────────

function ToggleRow({
  label, desc, value, onChange,
}: {
  label: string
  desc: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      background:'#FFF', borderRadius:16, padding:'12px 16px',
      boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div>
        <p style={{ fontSize:13, fontWeight:800, color:'#1A1A2E', margin:0 }}>{label}</p>
        <p style={{ fontSize:12, fontWeight:600, color:'#999', margin:0 }}>{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          position:'relative', width:44, height:24, borderRadius:12,
          border:'none', cursor:'pointer', flexShrink:0, marginLeft:12,
          background: value ? 'linear-gradient(90deg,#FF6035,#FF8C60)' : '#DDD',
          transition:'background 0.2s',
        }}
      >
        <span style={{
          position:'absolute', top:3,
          left: value ? 23 : 3,
          width:18, height:18, borderRadius:'50%', background:'#FFF',
          transition:'left 0.2s',
          boxShadow:'0 1px 4px rgba(0,0,0,0.2)',
        }}/>
      </button>
    </div>
  )
}
