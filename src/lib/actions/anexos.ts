'use server'

import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'

export type Anexo = Database['public']['Tables']['anexos']['Row']

export type UploadResult = 
  | { sucesso: true; anexo: Anexo }
  | { erro: string }

/** Lista anexos de um encaminhamento */
export async function listarAnexos(encaminhamentoId: string): Promise<Anexo[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('anexos')
    .select('*')
    .eq('encaminhamento_id', encaminhamentoId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao listar anexos:', error)
    return []
  }

  return (data as Anexo[]) ?? []
}

/** Gera URL assinada para download de um anexo */
export async function gerarUrlDownload(anexoId: string): Promise<{ url: string; nome: string } | { erro: string }> {
  const supabase = await createClient()
  
  // Buscar informações do anexo
  const { data: anexo, error: erroAnexo } = await supabase
    .from('anexos')
    .select('*')
    .eq('id', anexoId)
    .single()

  if (erroAnexo || !anexo) {
    return { erro: 'Anexo não encontrado.' }
  }

  // Gerar URL assinada válida por 1 hora
  const { data, error } = await supabase
    .storage
    .from('anexos')
    .createSignedUrl(anexo.storage_path, 3600)

  if (error) {
    return { erro: 'Erro ao gerar link de download.' }
  }

  return { url: data.signedUrl, nome: anexo.nome_original }
}

/** Remove um anexo */
export async function removerAnexo(anexoId: string): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = await createClient()
  
  // Verificar permissão (quem fez o upload pode remover, ou admin)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  const { data: anexo } = await supabase
    .from('anexos')
    .select('storage_path, uploaded_by')
    .eq('id', anexoId)
    .single()

  if (!anexo) return { erro: 'Anexo não encontrado.' }

  const podeRemover = 
    usuario?.perfil === 'administrador' || 
    anexo.uploaded_by === user.id

  if (!podeRemover) {
    return { erro: 'Sem permissão para remover este anexo.' }
  }

  // Remover do storage
  const { error: erroStorage } = await supabase
    .storage
    .from('anexos')
    .remove([anexo.storage_path])

  if (erroStorage) {
    console.error('Erro ao remover do storage:', erroStorage)
  }

  // Remover registro
  const { error } = await supabase
    .from('anexos')
    .delete()
    .eq('id', anexoId)

  if (error) {
    return { erro: error.message }
  }

  return { sucesso: true }
}

/** Calcula SHA-256 de um arquivo */
export async function calcularHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hash = createHash('sha256')
  hash.update(Buffer.from(buffer))
  return hash.digest('hex')
}

/** Faz upload de um anexo */
export async function uploadAnexo(
  encaminhamentoId: string,
  tipo: Database['public']['Enums']['tipo_anexo'],
  file: File
): Promise<UploadResult> {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  // Verificar permissão (médico só pode adicionar aos próprios rascunhos)
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (usuario?.perfil === 'medico') {
    const { data: enc } = await supabase
      .from('encaminhamentos')
      .select('status, created_by')
      .eq('id', encaminhamentoId)
      .single()
    
    if (!enc || enc.status !== 'rascunho' || enc.created_by !== user.id) {
      return { erro: 'Você só pode anexar arquivos em seus rascunhos.' }
    }
  }

  // Limitar tamanho (10MB)
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return { erro: 'Arquivo muito grande. Tamanho máximo: 10MB.' }
  }

  // Calcular hash SHA-256
  const hashSha256 = await calcularHash(file)

  // Gerar path único
  const timestamp = Date.now()
  const extension = file.name.split('.').pop() || ''
  const storagePath = `${encaminhamentoId}/${timestamp}_${hashSha256.slice(0, 16)}.${extension}`

  // Fazer upload para o storage
  const { error: uploadError } = await supabase
    .storage
    .from('anexos')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { erro: `Erro ao fazer upload: ${uploadError.message}` }
  }

  // Criar registro no banco
  const { data: anexo, error: dbError } = await supabase
    .from('anexos')
    .insert({
      encaminhamento_id: encaminhamentoId,
      tipo,
      nome_original: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      tamanho_bytes: file.size,
      hash_sha256: hashSha256,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (dbError) {
    // Rollback: remover do storage
    await supabase.storage.from('anexos').remove([storagePath])
    return { erro: `Erro ao salvar registro: ${dbError.message}` }
  }

  return { sucesso: true, anexo: anexo as Anexo }
}
