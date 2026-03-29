import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FichaIMLPDF } from '@/components/encaminhamento/ficha-iml-pdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/link-button'
import type { Database } from '@/lib/types/database.types'

export const metadata: Metadata = { title: 'Gerar PDF - Ficha IML' }

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  rascunho:     { label: 'Rascunho',     variant: 'outline' },
  confirmado:   { label: 'Confirmado',   variant: 'default' },
  recebido_iml: { label: 'Recebido IML', variant: 'secondary' },
  cancelado:    { label: 'Cancelado',    variant: 'destructive' },
}

const causaLabel: Record<string, string> = {
  arma_de_fogo: 'Arma de Fogo', arma_branca: 'Arma Branca', asfixia: 'Asfixia',
  queimadura: 'Queimadura', acidente_transito: 'Acidente de Trânsito', afogamento: 'Afogamento',
  envenenamento: 'Envenenamento', espancamento: 'Espancamento', outros: 'Outros',
}

const motivoLabel: Record<string, string> = {
  morte_violenta: 'Morte Violenta',
  morte_suspeita: 'Morte Suspeita',
}

const sexoLabel: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  indeterminado: 'Indeterminado',
}

function Campo({ label, value, className = '' }: { label: string; value?: string | null | boolean | number; className?: string }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">
        {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
      </p>
    </div>
  )
}

export default async function PdfPage({
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

  const st = statusConfig[enc.status] ?? { label: enc.status, variant: 'outline' as const }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LinkButton href={`/encaminhamentos/${id}`} variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </LinkButton>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Ficha de Encaminhamento ao IML
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualize e gere o PDF oficial do encaminhamento
          </p>
        </div>
        <FichaIMLPDF encaminhamento={enc} />
      </div>

      {/* Preview da Ficha */}
      <Card className="border-2">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">ESTADO DO AMAZONAS</CardTitle>
              <p className="text-sm text-muted-foreground">
                Secretaria de Segurança Pública - Departamento de Polícia Técnico-Científica
              </p>
              <p className="text-sm font-semibold mt-1">
                INSTITUTO MÉDICO LEGAL &quot;DR. ANTÔNIO HOSANNAH DA SILVA FILHO&quot;
              </p>
            </div>
            <div className="text-right">
              <Badge variant={st.variant} className="text-sm">{st.label}</Badge>
              <p className="text-2xl font-mono font-bold text-primary mt-2">
                {enc.protocolo ?? 'RASCUNHO'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Dados da Instituição */}
          <section>
            <h3 className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded mb-3">
              1. DADOS DA INSTITUIÇÃO DE ORIGEM
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Campo label="Instituição" value={enc.instituicao_nome} className="col-span-2" />
              <Campo label="Tipo" value={enc.instituicao_tipo ?? undefined} />
              <Campo label="Médico Responsável" value={enc.medico_nome} className="col-span-2" />
              <Campo label="CRM" value={enc.medico_crm} />
              <Campo label="Motivo do Encaminhamento" value={motivoLabel[enc.motivo]} className="col-span-2" />
            </div>
          </section>

          <Separator />

          {/* Causa da Morte */}
          <section>
            <h3 className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded mb-3">
              2. CAUSA DA MORTE
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Campo label="Causa Principal" value={causaLabel[enc.causa_principal]} />
              <Campo label="Detalhes" value={enc.causa_detalhes} className="col-span-2" />
              <Campo label="Subtipo de Asfixia" value={enc.subtipo_asfixia ?? undefined} />
            </div>
          </section>

          <Separator />

          {/* Identificação */}
          <section>
            <h3 className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded mb-3 flex items-center gap-2">
              3. IDENTIFICAÇÃO DO CORPO
              <Badge variant={enc.identificado ? 'default' : 'outline'} className="text-xs">
                {enc.identificado ? 'Identificado' : 'Não Identificado'}
              </Badge>
            </h3>
            {enc.identificado ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Campo label="Nome Completo" value={enc.nome_falecido} className="col-span-2" />
                <Campo label="Sexo" value={sexoLabel[enc.sexo]} />
                <Campo label="Data de Nascimento" value={enc.data_nascimento ? new Date(enc.data_nascimento).toLocaleDateString('pt-BR') : null} />
                <Campo label="CPF" value={enc.cpf} />
                <Campo label="RG" value={enc.rg} />
                <Campo label="Nacionalidade" value={enc.nacionalidade} />
                <Campo label="Naturalidade" value={enc.naturalidade} />
                <Campo label="Profissão" value={enc.profissao} />
                <Campo label="Filiação - Mãe" value={enc.filiacao_mae} className="col-span-2" />
                <Campo label="Filiação - Pai" value={enc.filiacao_pai} className="col-span-2" />
                <Campo label="Endereço" value={enc.endereco_vitima} className="col-span-2" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <Campo label="Características Físicas" value={enc.caracteristicas_fisicas} />
                <Campo label="Vestimentas e Objetos" value={enc.vestimentas_objetos} />
              </div>
            )}
          </section>

          <Separator />

          {/* Dados do Atendimento */}
          <section>
            <h3 className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded mb-3">
              4. DADOS DO ATENDIMENTO
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Campo label="Data do Óbito" value={new Date(enc.data_obito).toLocaleDateString('pt-BR')} />
              <Campo label="Hora do Óbito" value={enc.hora_obito} />
              <Campo label="Recebeu Atendimento" value={enc.recebeu_atendimento} />
              {enc.recebeu_atendimento && (
                <>
                  <Campo label="Data de Admissão" value={enc.data_admissao ? new Date(enc.data_admissao).toLocaleDateString('pt-BR') : null} />
                  <Campo label="Houve Internação" value={enc.houve_internacao} />
                  <Campo label="Houve Transfusão" value={enc.houve_transfusao} />
                </>
              )}
            </div>
          </section>

          {/* Campos específicos Arma de Fogo */}
          {enc.causa_principal === 'arma_de_fogo' && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold bg-destructive/10 text-destructive px-3 py-1 rounded mb-3">
                  DADOS ESPECÍFICOS - ARMA DE FOGO
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Campo label="Realizou Exame de Imagem" value={enc.arma_fogo_exame_imagem} />
                  <Campo label="Tipo de Exame" value={enc.arma_fogo_tipo_exame} />
                  <Campo label="Realizou Cirurgia" value={enc.arma_fogo_cirurgia} />
                  <Campo label="Descrição da Cirurgia" value={enc.arma_fogo_desc_cirurgia} className="col-span-2" />
                  <Campo label="Projéteis Localizados" value={enc.arma_fogo_projeteis_loc} />
                  <Campo label="Quantidade de Projéteis" value={enc.arma_fogo_projeteis_qtd} />
                  <Campo label="Projéteis Recuperados" value={enc.arma_fogo_projeteis_rec} />
                  <Campo label="Destino dos Projéteis" value={enc.arma_fogo_projeteis_dest} />
                </div>
              </section>
            </>
          )}

          <Separator />

          {/* Informações Adicionais */}
          <section>
            <h3 className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded mb-3">
              5. INFORMAÇÕES ADICIONAIS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Campo label="Cidade do Preenchimento" value={enc.cidade_preenchimento} />
              <Campo label="Data do Preenchimento" value={new Date(enc.data_preenchimento).toLocaleDateString('pt-BR')} />
              <Campo label="Outras Informações" value={enc.outras_informacoes} className="col-span-4" />
            </div>
          </section>

          {enc.hash_integridade && (
            <>
              <Separator />
              <section className="bg-muted/30 p-4 rounded">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                  HASH DE INTEGRIDADE (SHA-256)
                </h3>
                <p className="text-xs font-mono break-all text-muted-foreground">
                  {enc.hash_integridade}
                </p>
              </section>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <LinkButton href={`/encaminhamentos/${id}`} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Detalhes
        </LinkButton>
      </div>
    </div>
  )
}
