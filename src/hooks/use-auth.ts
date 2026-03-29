'use client'

import { createContext, useContext } from 'react'
import type { PerfilUsuario } from '@/lib/types/database.types'

export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
}

export interface AuthContextValue {
  usuario: UsuarioLogado
  podeEditar: (createdBy: string) => boolean
  podeValidar: () => boolean
  podeGerarRelatorio: () => boolean
  podeGerenciarUsuarios: () => boolean
  podeVerAuditoria: () => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
