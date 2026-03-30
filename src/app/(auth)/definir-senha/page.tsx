'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DefinirSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro('Não foi possível definir a senha. O link pode ter expirado.')
      setCarregando(false)
      return
    }

    setSucesso(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'white',
        padding: 32,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#003366' }}>SIGE-IML</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Definir nova senha</p>
        </div>

        {sucesso ? (
          <div style={{
            background: '#dcfce7',
            color: '#16a34a',
            padding: 16,
            borderRadius: 4,
            textAlign: 'center',
            fontSize: 14,
          }}>
            Senha definida com sucesso! Redirecionando...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {erro && (
              <div style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: 12,
                borderRadius: 4,
                marginBottom: 16,
                fontSize: 14,
              }}>
                {erro}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Nova senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                disabled={carregando}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                minLength={6}
                disabled={carregando}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                placeholder="Digite novamente"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              style={{
                width: '100%',
                padding: 12,
                background: '#003366',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                cursor: carregando ? 'not-allowed' : 'pointer',
                opacity: carregando ? 0.7 : 1,
              }}
            >
              {carregando ? 'Salvando...' : 'Definir Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
