'use client'

import { AuthContext, type AuthContextValue, type UsuarioLogado } from '@/hooks/use-auth'

interface AuthProviderProps {
  usuario: UsuarioLogado
  children: React.ReactNode
}

export function AuthProvider({ usuario, children }: AuthProviderProps) {
  const value: AuthContextValue = {
    usuario,
    podeEditar: (createdBy: string) =>
      usuario.perfil === 'administrador' || createdBy === usuario.id,
    podeValidar: () =>
      usuario.perfil === 'administrador' || usuario.perfil === 'gestor_iml',
    podeGerarRelatorio: () =>
      usuario.perfil !== 'medico',
    podeGerenciarUsuarios: () =>
      usuario.perfil === 'administrador',
    podeVerAuditoria: () =>
      usuario.perfil === 'administrador' || usuario.perfil === 'auditor',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
