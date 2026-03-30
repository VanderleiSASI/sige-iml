'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
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

const perfilLabel: Record<string, string> = {
  administrador: 'Administrador',
  gestor_iml: 'Gestor IML',
  medico: 'Médico',
  auditor: 'Auditor',
}

export async function convidarUsuario(
  dados: {
    email: string
    nome: string
    perfil: Database['public']['Enums']['perfil_usuario']
  }
): Promise<{ sucesso: true; id: string; avisoEmail?: string } | { erro: string }> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { data: usuario } = await authClient
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (usuario?.perfil !== 'administrador') {
    return { erro: 'Apenas administradores podem convidar usuários.' }
  }

  try {
    const serviceClient = createServiceClient()
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const appUrl = `${protocol}://${host}`

    // 1. Criar usuário com senha temporária segura
    const tempPassword = crypto.randomUUID() + crypto.randomUUID()

    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: dados.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nome: dados.nome, perfil: dados.perfil },
    })

    if (createError) {
      if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
        return { erro: 'Já existe um usuário com este e-mail.' }
      }
      return { erro: createError.message }
    }

    // 2. Gerar link para o usuário definir sua própria senha
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email: dados.email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('generateLink falhou:', linkError?.message)
      // Usuário foi criado mas não conseguimos gerar o link — continuar com aviso
    }

    const token = linkData?.properties?.hashed_token
    const setupUrl = token
      ? `${appUrl}/auth/callback?type=recovery&token=${token}`
      : `${appUrl}/login`

    // 3. Enviar email de convite via Edge Function (usa SMTP configurado no projeto)
    const perfilNome = perfilLabel[dados.perfil] ?? dados.perfil
    let avisoEmail: string | undefined

    try {
      const emailRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: dados.email,
          subject: 'SIGE-IML — Convite de Acesso',
          body: `Olá ${dados.nome},\n\nVocê foi convidado(a) para acessar o SIGE-IML.\nPerfil: ${perfilNome}\n\nPara acessar e definir sua senha:\n${setupUrl}\n\nEste link expira em 1 hora.\n\n---\nSIGE-IML\nInstituto Médico Legal "Dr. Antônio Hosannah da Silva Filho"`,
          html: buildConviteHtml(dados.nome, perfilNome, setupUrl),
        }),
      })

      if (!emailRes.ok) {
        const errBody = await emailRes.text().catch(() => `status ${emailRes.status}`)
        avisoEmail = `Falha ao enviar email (${emailRes.status}): ${errBody}`
        console.error('send-email falhou:', avisoEmail)
      }
    } catch (fetchErr) {
      avisoEmail = fetchErr instanceof Error ? fetchErr.message : 'Edge Function inacessível'
      console.error('Erro ao chamar send-email:', fetchErr)
    }

    // 4. Garantir sincronização (trigger pode já ter inserido)
    await serviceClient
      .from('usuarios')
      .upsert({
        id: newUser.user.id,
        email: dados.email,
        nome: dados.nome,
        perfil: dados.perfil,
        ativo: true,
      }, { onConflict: 'id' })

    revalidatePath('/admin/usuarios')
    return { sucesso: true, id: newUser.user.id, ...(avisoEmail ? { avisoEmail } : {}) }
  } catch (error) {
    return { erro: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildConviteHtml(nome: string, perfil: string, url: string): string {
  const n = escapeHtml(nome)
  const p = escapeHtml(perfil)
  const u = escapeHtml(url)
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.wrap{max-width:600px;margin:0 auto;padding:20px}
.hdr{background:#003366;color:white;padding:20px;text-align:center;border-radius:4px 4px 0 0}
.body{padding:24px;background:#f9f9f9}
.btn{display:inline-block;padding:12px 28px;background:#006633;color:white;text-decoration:none;border-radius:4px;margin:20px 0;font-weight:bold}
.ftr{padding:16px;text-align:center;font-size:12px;color:#888}
.chip{background:#e0e0e0;padding:4px 12px;border-radius:4px;display:inline-block;margin:8px 0;font-size:13px}
</style></head><body>
<div class="wrap">
<div class="hdr"><h2 style="margin:0">SIGE-IML</h2><p style="margin:4px 0 0;font-size:13px">Sistema de Gestão de Encaminhamentos ao IML</p></div>
<div class="body">
<h3>Bem-vindo(a), ${n}!</h3>
<p>Você foi convidado(a) para acessar o SIGE-IML.</p>
<div class="chip"><strong>Perfil:</strong> ${p}</div>
<p>Clique no botão abaixo para acessar o sistema e definir sua senha:</p>
<center><a href="${u}" class="btn">Acessar o Sistema</a></center>
<p style="font-size:12px;color:#666;word-break:break-all">Ou copie: ${u}</p>
<p><strong>Este link expira em 1 hora.</strong></p>
</div>
<div class="ftr">Instituto Médico Legal "Dr. Antônio Hosannah da Silva Filho"<br>Avenida Noel Nutels, 300 – Cidade Nova – Manaus/AM</div>
</div></body></html>`
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
