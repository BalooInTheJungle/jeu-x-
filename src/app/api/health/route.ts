import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[health] Test de connexion Supabase...')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.error('[health] NEXT_PUBLIC_SUPABASE_URL manquante')
    return NextResponse.json(
      { status: 'error', message: 'NEXT_PUBLIC_SUPABASE_URL non configurée' },
      { status: 500 }
    )
  }

  const supabase = createClient()
  const { error } = await supabase.auth.getSession()

  if (error) {
    console.error('[health] Erreur Supabase:', error.message)
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }

  console.log('[health] Supabase connected ✅')
  return NextResponse.json(
    { status: 'ok', supabase: 'connected', url },
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  )
}
