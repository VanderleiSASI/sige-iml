'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { solicitarRecuperacaoSenha } from '@/lib/actions/auth'

export default function RecuperarSenhaPage() {
  const [isPending, startTransition] = useTransition()
  const [enviado, setEnviado] = useState(false)
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await solicitarRecuperacaoSenha(email)
      setEnviado(true)
    })
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
          <p style={{ color: '#666', fontSize: 14 }}>Recuperação de senha</p>
        </div>

        {enviado ? (
          <div>
            <div style={{
              background: '#dcfce7',
              color: '#16a34a',
              padding: 16,
              borderRadius: 4,
              marginBottom: 16,
              fontSize: 14,
            }}>
              Se o e-mail estiver cadastrado, você receberá as instruções de recuperação em instantes.
            </div>
            <Link
              href="/login"
              style={{
                display: 'block',
                textAlign: 'center',
                color: '#003366',
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              ← Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#555', fontSize: 14, marginBottom: 20 }}>
              Informe seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                placeholder="usuario@iml.am.gov.br"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              style={{
                width: '100%',
                padding: 12,
                background: '#003366',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
                marginBottom: 16,
              }}
            >
              {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>

            <Link
              href="/login"
              style={{
                display: 'block',
                textAlign: 'center',
                color: '#666',
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              ← Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
