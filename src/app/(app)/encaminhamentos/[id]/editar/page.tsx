import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EncaminhamentoForm } from '@/components/encaminhamento/encaminhamento-form'
import type { EncaminhamentoFormData } from '@/lib/validations/encaminhamento.schema'
import type { Database } from '@/lib/types/database.types'

export const metadata: Metadata = { title: 'Editar Encaminhamento' }

export default async function EditarEncaminhamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: enc } = await supabase
    .from('encaminhamentos')
    .select('*')
    .eq('id', id)
    .single() as { data: Database['public']['Tables']['encaminhamentos']['Row'] | null }

  if (!enc) notFound()
  if (enc.status !== 'rascunho') notFound()

  // Mapear campos do banco para o shape do formulário
  const defaultValues = {
    motivo: enc.motivo as EncaminhamentoFormData['motivo'],
    causa_principal: enc.causa_principal as EncaminhamentoFormData['causa_principal'],
    causa_detalhes: enc.causa_detalhes ?? undefined,
    instituicao_nome: enc.instituicao_nome,
    instituicao_tipo: enc.instituicao_tipo ?? undefined,
    medico_nome: enc.medico_nome,
    medico_crm: enc.medico_crm,
    identificado: enc.identificado,
    nome_falecido: enc.nome_falecido ?? undefined,
    sexo: (enc.sexo ?? 'indeterminado') as EncaminhamentoFormData['sexo'],
    data_nascimento: enc.data_nascimento ?? undefined,
    cpf: enc.cpf ?? undefined,
    rg: enc.rg ?? undefined,
    profissao: enc.profissao ?? undefined,
    naturalidade: enc.naturalidade ?? undefined,
    filiacao_mae: enc.filiacao_mae ?? undefined,
    filiacao_pai: enc.filiacao_pai ?? undefined,
    endereco_vitima: enc.endereco_vitima ?? undefined,
    caracteristicas_fisicas: enc.caracteristicas_fisicas ?? undefined,
    vestimentas_objetos: enc.vestimentas_objetos ?? undefined,
    data_obito: enc.data_obito
      ? new Date(enc.data_obito).toISOString().slice(0, 10)
      : undefined,
    hora_obito: enc.hora_obito ?? undefined,
    recebeu_atendimento: enc.recebeu_atendimento ?? false,
    data_admissao: enc.data_admissao
      ? new Date(enc.data_admissao).toISOString().slice(0, 10)
      : undefined,
    houve_internacao: enc.houve_internacao ?? undefined,
    houve_transfusao: enc.houve_transfusao ?? undefined,
    arma_fogo_exame_imagem: enc.arma_fogo_exame_imagem ?? undefined,
    arma_fogo_tipo_exame: enc.arma_fogo_tipo_exame ?? undefined,
    arma_fogo_cirurgia: enc.arma_fogo_cirurgia ?? undefined,
    arma_fogo_projeteis_loc: enc.arma_fogo_projeteis_loc ?? undefined,
    arma_fogo_projeteis_qtd: enc.arma_fogo_projeteis_qtd ?? undefined,
    arma_fogo_projeteis_rec: enc.arma_fogo_projeteis_rec ?? undefined,
    outras_informacoes: enc.outras_informacoes ?? undefined,
    cidade_preenchimento: enc.cidade_preenchimento ?? 'Manaus',
    data_preenchimento: enc.data_preenchimento ?? new Date().toISOString().slice(0, 10),
  } as Partial<EncaminhamentoFormData>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Encaminhamento</h1>
        <p className="text-muted-foreground text-sm font-mono">
          {enc.protocolo ?? 'Rascunho'} — edição disponível apenas para rascunhos.
        </p>
      </div>
      <EncaminhamentoForm
        encaminhamentoId={id}
        defaultValues={defaultValues}
      />
    </div>
  )
}
