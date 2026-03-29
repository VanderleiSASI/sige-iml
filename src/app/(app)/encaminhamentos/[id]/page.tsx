import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/link-button'
import { Separator } from '@/components/ui/separator'
import { Edit, FileDown, ArrowLeft, History, Paperclip } from 'lucide-react'
import { ConfirmarEncaminhamentoButton } from '@/components/encaminhamento/confirmar-button'
import { CancelarEncaminhamentoButton } from '@/components/encaminhamento/cancelar-button'
import { ReceberIMLButton } from '@/components/encaminhamento/receber-button'
import { AnexosList } from '@/components/encaminhamento/anexos-list'
import { listarAnexos } from '@/lib/actions/anexos'
import type { Database } from '@/lib/types/database.types'

export const metadata: Metadata = { title: 'Detalhes do Encaminhamento' }

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

function Campo({ label, value }: { label: string; value?: string | null | boolean | number }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">
        {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
      </p>
    </div>
  )
}

export default async function EncaminhamentoDetalhesPage({
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

  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user?.id ?? '')
    .single() as { data: { perfil: Database['public']['Enums']['perfil_usuario'] } | null }

  const perfil = usuario?.perfil
  const podeEditar =
    perfil === 'administrador' ||
    (enc.created_by === user?.id && enc.status === 'rascunho')
  const podeConfirmar =
    enc.status === 'rascunho' &&
    (perfil === 'administrador' || enc.created_by === user?.id)
  const podeCancelar =
    enc.status !== 'cancelado' &&
    (perfil === 'administrador' ||
      (enc.created_by === user?.id && enc.status === 'rascunho'))
  const podeVerAuditoria = ['administrador', 'gestor_iml', 'auditor'].includes(perfil ?? '')
  const podeReceberIML = 
    enc.status === 'confirmado' && 
    ['administrador', 'gestor_iml'].includes(perfil ?? '')
  const podeVerAnexos = true // Todos podem ver

  const st = statusConfig[enc.status] ?? { label: enc.status, variant: 'outline' as const }

  // Carregar anexos
  const anexos = await listarAnexos(id)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LinkButton href="/encaminhamentos" variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </LinkButton>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">
            {enc.protocolo ?? 'Rascunho'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={st.variant}>{st.label}</Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(enc.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {podeEditar && (
            <LinkButton href={`/encaminhamentos/${enc.id}/editar`} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </LinkButton>
          )}
          {enc.status === 'confirmado' && (
            <LinkButton href={`/encaminhamentos/${enc.id}/pdf`} size="sm">
              <FileDown className="w-4 h-4 mr-1" />
              Gerar PDF
            </LinkButton>
          )}
          {podeVerAuditoria && (
            <LinkButton href={`/encaminhamentos/${enc.id}/auditoria`} variant="outline" size="sm">
              <History className="w-4 h-4 mr-1" />
              Auditoria
            </LinkButton>
          )}
          {podeConfirmar && <ConfirmarEncaminhamentoButton id={enc.id} />}
          {podeReceberIML && <ReceberIMLButton id={enc.id} protocolo={enc.protocolo} />}
          {podeCancelar && <CancelarEncaminhamentoButton id={enc.id} />}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Dados da Instituição</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Campo label="Instituição" value={enc.instituicao_nome} />
            <Campo label="Tipo" value={enc.instituicao_tipo ?? undefined} />
            <Campo label="Médico" value={enc.medico_nome} />
            <Campo label="CRM" value={enc.medico_crm} />
            <Campo label="Motivo" value={enc.motivo === 'morte_violenta' ? 'Morte Violenta' : 'Morte Suspeita'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Causa da Morte</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Campo label="Causa Principal" value={causaLabel[enc.causa_principal] ?? enc.causa_principal} />
            <Campo label="Detalhes" value={enc.causa_detalhes} />
            <Campo label="Subtipo Asfixia" value={enc.subtipo_asfixia ?? undefined} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              Identificação
              <Badge variant={enc.identificado ? 'default' : 'outline'} className="text-xs">
                {enc.identificado ? 'Identificado' : 'Não identificado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {enc.identificado ? (
              <>
                <Campo label="Nome" value={enc.nome_falecido} />
                <Campo label="Sexo" value={enc.sexo} />
                <Campo label="Nascimento" value={enc.data_nascimento ? new Date(enc.data_nascimento).toLocaleDateString('pt-BR') : null} />
                <Campo label="CPF" value={enc.cpf} />
                <Campo label="RG" value={enc.rg} />
                <Campo label="Profissão" value={enc.profissao} />
              </>
            ) : (
              <div className="col-span-2">
                <Campo label="Características Físicas" value={enc.caracteristicas_fisicas} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Campo label="Óbito" value={new Date(enc.data_obito).toLocaleString('pt-BR')} />
            <Campo label="Atendimento Hospitalar" value={enc.recebeu_atendimento} />
            {enc.recebeu_atendimento && (
              <>
                <Campo label="Admissão" value={enc.data_admissao ? new Date(enc.data_admissao).toLocaleString('pt-BR') : null} />
                <Campo label="Internação" value={enc.houve_internacao} />
                <Campo label="Transfusão" value={enc.houve_transfusao} />
              </>
            )}
            {enc.causa_principal === 'arma_de_fogo' && (
              <>
                <Separator className="col-span-2" />
                <Campo label="Exame de Imagem" value={enc.arma_fogo_exame_imagem} />
                <Campo label="Cirurgia" value={enc.arma_fogo_cirurgia} />
                <Campo label="Projéteis Loc." value={enc.arma_fogo_projeteis_loc} />
                <Campo label="Qtd. Projéteis" value={enc.arma_fogo_projeteis_qtd ?? undefined} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Anexos */}
      {podeVerAnexos && (
        <AnexosList 
          encaminhamentoId={id} 
          anexosIniciais={anexos} 
          podeEditar={podeEditar}
        />
      )}

      {enc.hash_integridade && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Hash SHA-256 de Integridade</p>
            <p className="text-xs font-mono mt-1 break-all text-muted-foreground">
              {enc.hash_integridade}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
