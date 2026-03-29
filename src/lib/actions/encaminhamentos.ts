'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import type { EncaminhamentoFormData } from '@/lib/validations/encaminhamento.schema'
import type { Database } from '@/lib/types/database.types'

type EncaminhamentoInsert = Database['public']['Tables']['encaminhamentos']['Insert']

async function getUsuarioAutenticado() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, perfil')
    .eq('id', user.id)
    .single() as { data: { id: string; perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  if (!usuario) redirect('/login')
  return { supabase, user, perfil: usuario.perfil }
}

/** Cria um rascunho de encaminhamento */
export async function criarEncaminhamento(
  formData: Partial<EncaminhamentoFormData>
): Promise<{ id: string } | { erro: string }> {
  const { supabase, user, perfil } = await getUsuarioAutenticado()

  if (!['medico', 'administrador'].includes(perfil)) {
    return { erro: 'Sem permissão para criar encaminhamentos.' }
  }

  const payload: EncaminhamentoInsert = {
    created_by: user.id,
    status: 'rascunho',
    motivo: formData.motivo ?? 'morte_violenta',
    causa_principal: formData.causa_principal ?? 'outros',
    instituicao_id: null,
    instituicao_nome: formData.instituicao_nome ?? '',
    instituicao_tipo: formData.instituicao_tipo ?? null,
    medico_id: null,
    medico_nome: formData.medico_nome ?? '',
    medico_crm: formData.medico_crm ?? '',
    identificado: formData.identificado ?? true,
    sexo: formData.sexo ?? 'indeterminado',
    data_obito: formData.data_obito
      ? new Date(formData.data_obito).toISOString()
      : new Date().toISOString(),
    cidade_preenchimento: formData.cidade_preenchimento ?? 'Manaus',
    data_preenchimento: formData.data_preenchimento ?? new Date().toISOString().slice(0, 10),
    // Campos opcionais
    causa_detalhes: formData.causa_detalhes ?? null,
    subtipo_asfixia: 'subtipo_asfixia' in formData ? (formData as { subtipo_asfixia?: Database['public']['Enums']['subtipo_asfixia'] }).subtipo_asfixia ?? null : null,
    envenenamento_substancias: 'envenenamento_substancias' in formData
      ? (formData as { envenenamento_substancias?: string[] }).envenenamento_substancias ?? null
      : null,
    descricao_suspeita: 'descricao_suspeita' in formData
      ? (formData as { descricao_suspeita?: string }).descricao_suspeita ?? null
      : null,
    nome_falecido: formData.nome_falecido ?? null,
    cpf: formData.cpf ?? null,
    rg: formData.rg ?? null,
    data_nascimento: formData.data_nascimento ?? null,
    filiacao_mae: formData.filiacao_mae ?? null,
    filiacao_pai: formData.filiacao_pai ?? null,
    profissao: formData.profissao ?? null,
    endereco_vitima: formData.endereco_vitima ?? null,
    caracteristicas_fisicas: formData.caracteristicas_fisicas ?? null,
    vestimentas_objetos: formData.vestimentas_objetos ?? null,
    recebeu_atendimento: formData.recebeu_atendimento ?? false,
    data_admissao: formData.data_admissao
      ? new Date(formData.data_admissao).toISOString()
      : null,
    houve_internacao: formData.houve_internacao ?? null,
    houve_transfusao: formData.houve_transfusao ?? null,
    descricao_transfusao: formData.descricao_transfusao ?? null,
    arma_fogo_exame_imagem: formData.arma_fogo_exame_imagem ?? null,
    arma_fogo_tipo_exame: formData.arma_fogo_tipo_exame ?? null,
    arma_fogo_cirurgia: formData.arma_fogo_cirurgia ?? null,
    arma_fogo_desc_cirurgia: formData.arma_fogo_desc_cirurgia ?? null,
    arma_fogo_projeteis_loc: formData.arma_fogo_projeteis_loc ?? null,
    arma_fogo_projeteis_qtd: formData.arma_fogo_projeteis_qtd ?? null,
    arma_fogo_projeteis_rec: formData.arma_fogo_projeteis_rec ?? null,
    arma_fogo_projeteis_dest: formData.arma_fogo_projeteis_dest ?? null,
    outras_informacoes: formData.outras_informacoes ?? null,
    nacionalidade: formData.nacionalidade ?? 'Brasileira',
    naturalidade: formData.naturalidade ?? null,
    contato_familiar_nome: formData.contato_familiar_nome ?? null,
    contato_familiar_parentesco: formData.contato_familiar_parentesco ?? null,
    contato_familiar_telefone: formData.contato_familiar_telefone ?? null,
    hora_obito: formData.hora_obito ?? null,
    justificativa_cancelamento: null,
    hash_integridade: null,
  }

  const { data, error } = await supabase
    .from('encaminhamentos')
    .insert(payload as any)
    .select('id')
    .single() as { data: { id: string } | null; error: Error | null }

  if (error) return { erro: error.message }
  if (!data) return { erro: 'Erro ao criar encaminhamento' }
  return { id: data.id }
}

/** Atualiza um rascunho existente */
export async function atualizarEncaminhamento(
  id: string,
  formData: Partial<EncaminhamentoFormData>
): Promise<{ sucesso: true } | { erro: string }> {
  const { supabase, user, perfil } = await getUsuarioAutenticado()

  // Verificar ownership e status
  const { data: enc } = await supabase
    .from('encaminhamentos')
    .select('id, status, created_by')
    .eq('id', id)
    .single() as { data: { id: string; status: string; created_by: string } | null }

  if (!enc) return { erro: 'Encaminhamento não encontrado.' }

  const podeEditar =
    perfil === 'administrador' ||
    (enc.created_by === user.id && enc.status === 'rascunho')

  if (!podeEditar) {
    return { erro: 'Sem permissão para editar este encaminhamento.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('encaminhamentos')
    .update({
      ...formData,
      data_obito: formData.data_obito
        ? new Date(formData.data_obito).toISOString()
        : undefined,
      data_admissao: formData.data_admissao
        ? new Date(formData.data_admissao).toISOString()
        : undefined,
    })
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath(`/encaminhamentos/${id}`)
  return { sucesso: true }
}

/** Confirma um encaminhamento, gera protocolo e calcula hash SHA-256 */
export async function confirmarEncaminhamento(
  id: string
): Promise<{ protocolo: string; hash: string } | { erro: string }> {
  const { supabase, user, perfil } = await getUsuarioAutenticado()

  const { data: enc } = await supabase
    .from('encaminhamentos')
    .select('*')
    .eq('id', id)
    .single() as { data: Database['public']['Tables']['encaminhamentos']['Row'] | null }

  if (!enc) return { erro: 'Encaminhamento não encontrado.' }
  if (enc.status !== 'rascunho') return { erro: 'Apenas rascunhos podem ser confirmados.' }

  const podeConfirmar =
    perfil === 'administrador' ||
    (perfil === 'medico' && enc.created_by === user.id)

  if (!podeConfirmar) return { erro: 'Sem permissão para confirmar este encaminhamento.' }

  // Calcular hash SHA-256 dos dados canônicos (sem campos voláteis)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, protocolo: _p, hash_integridade: _h, created_at: _ca, updated_at: _ua, versao: _v, ...dadosCanonicais } = enc
  const json = JSON.stringify(dadosCanonicais, Object.keys(dadosCanonicais).sort())
  const hash = createHash('sha256').update(json).digest('hex')

  // UPDATE: status → confirmado (trigger gera o protocolo automaticamente)
  const { data: atualizado, error } = await (supabase as any)
    .from('encaminhamentos')
    .update({ status: 'confirmado', hash_integridade: hash })
    .eq('id', id)
    .select('protocolo')
    .single() as { data: { protocolo: string } | null; error: Error | null }

  if (error || !atualizado?.protocolo) {
    return { erro: error?.message ?? 'Erro ao confirmar encaminhamento.' }
  }

  revalidatePath(`/encaminhamentos/${id}`)
  revalidatePath('/encaminhamentos')
  revalidatePath('/dashboard')

  return { protocolo: atualizado.protocolo, hash }
}

/** Registra a geração do PDF no log de auditoria */
export async function registrarGeracaoPdf(
  encaminhamentoId: string
): Promise<{ sucesso: true } | { erro: string }> {
  const { supabase } = await getUsuarioAutenticado()

  // Usar função RPC que ignora RLS (SECURITY DEFINER)
  const { error } = await supabase.rpc('registrar_auditoria', {
    p_encaminhamento_id: encaminhamentoId,
    p_acao: 'geracao_pdf',
  })

  if (error) return { erro: error.message }
  return { sucesso: true }
}

/** Cancela um encaminhamento (soft delete com justificativa) */
export async function cancelarEncaminhamento(
  id: string,
  justificativa: string
): Promise<{ sucesso: true } | { erro: string }> {
  const { supabase, user, perfil } = await getUsuarioAutenticado()

  if (!justificativa || justificativa.trim().length < 10) {
    return { erro: 'A justificativa deve ter ao menos 10 caracteres.' }
  }

  const { data: enc } = await supabase
    .from('encaminhamentos')
    .select('id, status, created_by')
    .eq('id', id)
    .single()

  if (!enc) return { erro: 'Encaminhamento não encontrado.' }
  if (enc.status === 'cancelado') return { erro: 'Encaminhamento já está cancelado.' }

  const podeCancelar =
    perfil === 'administrador' ||
    (enc.created_by === user.id && enc.status === 'rascunho')

  if (!podeCancelar) return { erro: 'Sem permissão para cancelar este encaminhamento.' }

  const { error } = await supabase
    .from('encaminhamentos')
    .update({
      status: 'cancelado',
      justificativa_cancelamento: justificativa.trim(),
    })
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath(`/encaminhamentos/${id}`)
  revalidatePath('/encaminhamentos')

  return { sucesso: true }
}

/** Registra recebimento no IML - apenas gestores e admins */
export async function receberEncaminhamentoIML(
  id: string
): Promise<{ sucesso: true } | { erro: string }> {
  const { supabase, user, perfil } = await getUsuarioAutenticado()

  // Apenas gestor_iml e administrador podem receber
  if (!['administrador', 'gestor_iml'].includes(perfil)) {
    return { erro: 'Apenas gestores e administradores podem receber encaminhamentos.' }
  }

  const { data: enc } = await supabase
    .from('encaminhamentos')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!enc) return { erro: 'Encaminhamento não encontrado.' }
  if (enc.status !== 'confirmado') {
    return { erro: 'Apenas encaminhamentos confirmados podem ser recebidos.' }
  }

  const { error } = await supabase
    .from('encaminhamentos')
    .update({ status: 'recebido_iml' })
    .eq('id', id)

  if (error) return { erro: error.message }

  // Registrar na auditoria
  await supabase.from('auditoria_logs').insert({
    encaminhamento_id: id,
    usuario_id: user.id,
    acao: 'recepcao_iml',
  })

  revalidatePath(`/encaminhamentos/${id}`)
  revalidatePath('/encaminhamentos')
  revalidatePath('/dashboard')

  return { sucesso: true }
}
