import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Dois fluxos chegam aqui:
// 1. ?code=xxx  — PKCE (resetPasswordForEmail nativo do Supabase)
// 2. ?token=xxx&type=recovery — hashed_token (convite e reset via send-email)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type') as 'recovery' | 'invite' | null
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') ? rawNext : '/dashboard'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'recovery' || type === 'invite') {
        return NextResponse.redirect(new URL('/definir-senha', origin))
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  if (token && (type === 'recovery' || type === 'invite')) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type,
    })
    if (!error) {
      return NextResponse.redirect(new URL('/definir-senha', origin))
    }
  }

  return NextResponse.redirect(new URL('/login?erro=link_invalido', origin))
}
