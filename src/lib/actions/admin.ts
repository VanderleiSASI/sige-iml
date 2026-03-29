'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'

export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type Medico = Database['public']['Tables']['medicos']['Row']
export type Instituicao = Database['public']['Tables']['instituicoes']['Row']

// ============================================================================
// USUÁRIOS
// ============================================================================

export async function listarUsuarios(): Promise<Usuario[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao listar usuários:', error)
    return []
  }

  return (data as Usuario[]) ?? []
}

export async function criarUsuario(
  dados: {
    email: string
    password: string
    nome: string
    perfil: Database['public']['Enums']['perfil_usuario']
  }
): Promise<{ sucesso: true; id: string } | { erro: string }> {
  // Verificar se é admin usando client normal
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { data: usuario } = await authClient
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (usuario?.perfil !== 'administrador') {
    return { erro: 'Apenas administradores podem criar usuários.' }
  }

  try {
    const serviceClient = createServiceClient()

    // Criar usuário via SDK admin (nome e perfil já no user_metadata para o trigger)
    const { data, error: authError } = await serviceClient.auth.admin.createUser({
      email: dados.email,
      password: dados.password,
      email_confirm: true,
      user_metadata: { nome: dados.nome, perfil: dados.perfil },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return { erro: 'Já existe um usuário com este e-mail.' }
      }
      return { erro: authError.message }
    }

    // Garantir que public.usuarios está sincronizado (o trigger pode já ter inserido)
    const { error: upsertError } = await serviceClient
      .from('usuarios')
      .upsert({
        id: data.user.id,
        email: dados.email,
        nome: dados.nome,
        perfil: dados.perfil,
        ativo: true,
      }, { onConflict: 'id' })

    if (upsertError) {
      console.error('Erro ao sincronizar public.usuarios:', upsertError)
    }

    revalidatePath('/admin/usuarios')
    return { sucesso: true, id: data.user.id }
  } catch (error) {
    console.error('Exceção ao criar usuário:', error)
    return { erro: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export async function atualizarUsuario(
  id: string,
  dados: {
    nome?: string
    perfil?: Database['public']['Enums']['perfil_usuario']
    ativo?: boolean
  }
): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = await createClient()
  
  // Verificar se é admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (usuario?.perfil !== 'administrador') {
    return { erro: 'Apenas administradores podem atualizar usuários.' }
  }

  const { error } = await supabase
    .from('usuarios')
    .update(dados)
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/admin/usuarios')
  return { sucesso: true }
}

export async function redefinirSenhaUsuario(
  id: string,
  novaSenha: string
): Promise<{ sucesso: true } | { erro: string }> {
  const authClient = await createClient()

  // Verificar se é admin
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { data: usuario } = await authClient
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (usuario?.perfil !== 'administrador') {
    return { erro: 'Apenas administradores podem redefinir senhas.' }
  }

  // Usar service client — auth.admin requer service_role key
  const serviceClient = createServiceClient()
  const { error } = await serviceClient.auth.admin.updateUserById(id, {
    password: novaSenha,
  })

  if (error) return { erro: error.message }

  return { sucesso: true }
}

// ============================================================================
// MÉDICOS
// ============================================================================

export async function listarMedicos(): Promise<Medico[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('medicos')
    .select('*, instituicoes(nome)')
    .order('nome')

  if (error) {
    console.error('Erro ao listar médicos:', error)
    return []
  }

  return (data as (Medico & { instituicoes: { nome: string } | null })[]) ?? []
}

export async function criarMedico(
  dados: Omit<Database['public']['Tables']['medicos']['Insert'], 'id'>
): Promise<{ sucesso: true; id: string } | { erro: string }> {
  const supabase = await createClient()
  
  // Verificar permissão
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (!['administrador', 'gestor_iml'].includes(usuario?.perfil ?? '')) {
    return { erro: 'Sem permissão para criar médicos.' }
  }

  const { data, error } = await supabase
    .from('medicos')
    .insert(dados)
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('unique constraint')) {
      return { erro: 'Já existe um médico com este CRM.' }
    }
    return { erro: error.message }
  }

  revalidatePath('/admin/medicos')
  return { sucesso: true, id: data.id }
}

export async function atualizarMedico(
  id: string,
  dados: Database['public']['Tables']['medicos']['Update']
): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = await createClient()
  
  // Verificar permissão
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (!['administrador', 'gestor_iml'].includes(usuario?.perfil ?? '')) {
    return { erro: 'Sem permissão para atualizar médicos.' }
  }

  const { error } = await supabase
    .from('medicos')
    .update(dados)
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/admin/medicos')
  return { sucesso: true }
}

// ============================================================================
// INSTITUIÇÕES
// ============================================================================

export async function listarInstituicoes(): Promise<Instituicao[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('instituicoes')
    .select('*')
    .order('nome')

  if (error) {
    console.error('Erro ao listar instituições:', error)
    return []
  }

  return (data as Instituicao[]) ?? []
}

export async function listarInstituicoesAtivas(): Promise<Instituicao[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('instituicoes')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  if (error) {
    console.error('Erro ao listar instituições:', error)
    return []
  }

  return (data as Instituicao[]) ?? []
}

export async function criarInstituicao(
  dados: Omit<Database['public']['Tables']['instituicoes']['Insert'], 'id'>
): Promise<{ sucesso: true; id: string } | { erro: string }> {
  const supabase = await createClient()
  
  // Verificar permissão
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (usuario?.perfil !== 'administrador') {
    return { erro: 'Apenas administradores podem criar instituições.' }
  }

  const { data, error } = await supabase
    .from('instituicoes')
    .insert(dados)
    .select('id')
    .single()

  if (error) return { erro: error.message }

  revalidatePath('/admin/instituicoes')
  return { sucesso: true, id: data.id }
}

export async function atualizarInstituicao(
  id: string,
  dados: Database['public']['Tables']['instituicoes']['Update']
): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = await createClient()
  
  // Verificar permissão
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (usuario?.perfil !== 'administrador') {
    return { erro: 'Apenas administradores podem atualizar instituições.' }
  }

  const { error } = await supabase
    .from('instituicoes')
    .update(dados)
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/admin/instituicoes')
  return { sucesso: true }
}
