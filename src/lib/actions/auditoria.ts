'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'

export type AuditoriaLog = Database['public']['Tables']['auditoria_logs']['Row']

export interface AuditoriaComUsuario extends AuditoriaLog {
  usuario_nome?: string
  usuario_email?: string
}

const acaoLabel: Record<Database['public']['Enums']['acao_auditoria'], string> = {
  criacao: 'Criação',
  atualizacao: 'Atualização',
  confirmacao: 'Confirmação',
  cancelamento: 'Cancelamento',
  recepcao_iml: 'Recepção IML',
  geracao_pdf: 'Geração de PDF',
  visualizacao: 'Visualização',
}

export async function getAcaoLabel(acao: Database['public']['Enums']['acao_auditoria']): Promise<string> {
  return acaoLabel[acao] ?? acao
}

/** Lista logs de auditoria de um encaminhamento */
export async function listarAuditoria(encaminhamentoId: string): Promise<AuditoriaComUsuario[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('auditoria_logs')
    .select('*')
    .eq('encaminhamento_id', encaminhamentoId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao listar auditoria:', error)
    return []
  }

  // Buscar nomes dos usuários
  const userIds = [...new Set((data ?? []).map(log => log.usuario_id).filter((id): id is string => !!id))]
  
  let usuarios: Record<string, { nome: string; email: string }> = {}
  
  if (userIds.length > 0) {
    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .in('id', userIds)
    
    usuarios = (usuariosData ?? []).reduce((acc, u) => {
      acc[u.id] = { nome: u.nome, email: u.email }
      return acc
    }, {} as Record<string, { nome: string; email: string }>)
  }

  return (data ?? []).map(log => ({
    ...log,
    usuario_nome: log.usuario_id ? usuarios[log.usuario_id]?.nome : undefined,
    usuario_email: log.usuario_id ? usuarios[log.usuario_id]?.email : undefined,
  }))
}

/** Lista todos os logs de auditoria (para administradores) */
export async function listarAuditoriaGeral(
  limite: number = 100,
  offset: number = 0
): Promise<AuditoriaComUsuario[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('auditoria_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limite - 1)

  if (error) {
    console.error('Erro ao listar auditoria geral:', error)
    return []
  }

  // Buscar nomes dos usuários
  const userIds = [...new Set((data ?? []).map(log => log.usuario_id).filter((id): id is string => !!id))]
  
  let usuarios: Record<string, { nome: string; email: string }> = {}
  
  if (userIds.length > 0) {
    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .in('id', userIds)
    
    usuarios = (usuariosData ?? []).reduce((acc, u) => {
      acc[u.id] = { nome: u.nome, email: u.email }
      return acc
    }, {} as Record<string, { nome: string; email: string }>)
  }

  return (data ?? []).map(log => ({
    ...log,
    usuario_nome: log.usuario_id ? usuarios[log.usuario_id]?.nome : undefined,
    usuario_email: log.usuario_id ? usuarios[log.usuario_id]?.email : undefined,
  }))
}
