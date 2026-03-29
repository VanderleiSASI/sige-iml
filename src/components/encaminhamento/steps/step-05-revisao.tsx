'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { EncaminhamentoFormData } from '@/lib/validations/encaminhamento.schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Props {
  form: UseFormReturn<EncaminhamentoFormData>
}

function Campo({ label, value }: { label: string; value?: string | null | boolean }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">
        {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value}
      </p>
    </div>
  )
}

const motivoLabel: Record<string, string> = {
  morte_violenta: 'Morte Violenta',
  morte_suspeita: 'Morte Suspeita',
}

const causaLabel: Record<string, string> = {
  arma_de_fogo: 'Arma de Fogo',
  arma_branca: 'Arma Branca',
  asfixia: 'Asfixia',
  queimadura: 'Queimadura',
  acidente_transito: 'Acidente de Trânsito',
  afogamento: 'Afogamento',
  envenenamento: 'Envenenamento/Intoxicação',
  espancamento: 'Espancamento',
  outros: 'Outros',
}

const sexoLabel: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  indeterminado: 'Indeterminado',
}

function formatarData(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export function Step05Revisao({ form }: Props) {
  const dados = form.getValues()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Revisão do Encaminhamento</h2>
        <p className="text-sm text-muted-foreground">
          Verifique todos os dados antes de salvar. Você poderá editar antes de confirmar.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Instituição */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Dados da Instituição</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Campo label="Instituição" value={dados.instituicao_nome} />
            <Campo label="Tipo" value={dados.instituicao_tipo_outro ?? dados.instituicao_tipo} />
            <Campo label="Médico" value={dados.medico_nome} />
            <Campo label="CRM" value={dados.medico_crm} />
            <Campo label="Motivo" value={motivoLabel[dados.motivo] ?? dados.motivo} />
          </CardContent>
        </Card>

        {/* Causa */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Causa da Morte</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Campo label="Causa Principal" value={causaLabel[dados.causa_principal] ?? dados.causa_principal} />
            <Campo label="Detalhes" value={dados.causa_detalhes} />
            {'subtipo_asfixia' in dados && (
              <Campo label="Subtipo de Asfixia" value={(dados as { subtipo_asfixia?: string }).subtipo_asfixia} />
            )}
            {'descricao_suspeita' in dados && (
              <Campo label="Suspeita Criminal" value={(dados as { descricao_suspeita?: string }).descricao_suspeita} />
            )}
          </CardContent>
        </Card>

        {/* Identificação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              Identificação do Corpo
              <Badge variant={dados.identificado ? 'default' : 'outline'}>
                {dados.identificado ? 'Identificado' : 'Não identificado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {dados.identificado ? (
              <>
                <Campo label="Nome" value={dados.nome_falecido} />
                <Campo label="Sexo" value={sexoLabel[dados.sexo] ?? dados.sexo} />
                <Campo label="Data de Nascimento" value={formatarData(dados.data_nascimento)} />
                <Campo label="CPF" value={dados.cpf} />
                <Campo label="RG" value={dados.rg} />
                <Campo label="Profissão" value={dados.profissao} />
                <Campo label="Naturalidade" value={dados.naturalidade} />
                <Campo label="Mãe" value={dados.filiacao_mae} />
                <Campo label="Pai" value={dados.filiacao_pai} />
                <Campo label="Endereço" value={dados.endereco_vitima} />
              </>
            ) : (
              <>
                <div className="col-span-2">
                  <Campo label="Características Físicas" value={dados.caracteristicas_fisicas} />
                </div>
                <div className="col-span-2">
                  <Campo label="Vestimentas e Objetos" value={dados.vestimentas_objetos} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Atendimento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Dados do Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Campo label="Data do Óbito" value={formatarData(dados.data_obito)} />
            <Campo label="Hora do Óbito" value={dados.hora_obito} />
            <Campo label="Recebeu Atendimento" value={dados.recebeu_atendimento} />
            {dados.recebeu_atendimento && (
              <>
                <Campo label="Data de Admissão" value={formatarData(dados.data_admissao)} />
                <Campo label="Internação" value={dados.houve_internacao} />
                <Campo label="Transfusão" value={dados.houve_transfusao} />
              </>
            )}
            {dados.causa_principal === 'arma_de_fogo' && (
              <>
                <Separator className="col-span-2" />
                <p className="col-span-2 text-xs font-semibold text-destructive">Arma de Fogo</p>
                <Campo label="Exame de Imagem" value={dados.arma_fogo_exame_imagem} />
                <Campo label="Tipo de Exame" value={dados.arma_fogo_tipo_exame} />
                <Campo label="Cirurgia" value={dados.arma_fogo_cirurgia} />
                <Campo label="Projéteis Localizados" value={dados.arma_fogo_projeteis_loc} />
                <Campo label="Qtd. Projéteis" value={dados.arma_fogo_projeteis_qtd?.toString()} />
                <Campo label="Projéteis Recuperados" value={dados.arma_fogo_projeteis_rec} />
              </>
            )}
            <Campo label="Cidade" value={dados.cidade_preenchimento} />
            <Campo label="Data de Preenchimento" value={formatarData(dados.data_preenchimento)} />
            {dados.outras_informacoes && (
              <div className="col-span-2">
                <Campo label="Outras Informações" value={dados.outras_informacoes} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Atenção:</strong> Ao salvar, o encaminhamento será registrado como
        &quot;Rascunho&quot;. Para gerar o protocolo oficial e o PDF, confirme o encaminhamento
        na tela de detalhes.
      </div>
    </div>
  )
}
