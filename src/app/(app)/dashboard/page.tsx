import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/link-button'
import { 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,

} from 'lucide-react'
import { DashboardCharts } from './charts'
import { getEstatisticasDashboard } from '@/lib/actions/relatorios'
import type { Database } from '@/lib/types/database.types'

export const metadata: Metadata = { title: 'Dashboard' }

const CORES = ['#003366', '#006633', '#0ea5e9', '#f59e0b', '#ef4444']

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  rascunho:     { label: 'Rascunho',     variant: 'outline' },
  confirmado:   { label: 'Confirmado',   variant: 'default' },
  recebido_iml: { label: 'Recebido IML', variant: 'secondary' },
  cancelado:    { label: 'Cancelado',    variant: 'destructive' },
}

const causaLabel: Record<string, string> = {
  arma_de_fogo:    'Arma de Fogo',
  arma_branca:     'Arma Branca',
  asfixia:         'Asfixia',
  queimadura:      'Queimadura',
  acidente_transito: 'Acidente de Trânsito',
  afogamento:      'Afogamento',
  envenenamento:   'Envenenamento',
  espancamento:    'Espancamento',
  outros:          'Outros',
}

type EncaminhamentoResumo = {
  id: string
  protocolo: string | null
  status: string
  motivo: string
  causa_principal: string
  nome_falecido: string | null
  data_obito: string | null
  instituicao_nome: string
  created_at: string
}

async function getUltimosEncaminhamentos(): Promise<EncaminhamentoResumo[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('encaminhamentos')
    .select('id, protocolo, status, motivo, causa_principal, nome_falecido, data_obito, instituicao_nome, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  return (data as EncaminhamentoResumo[]) ?? []
}

export default async function DashboardPage() {
  const [stats, ultimos] = await Promise.all([
    getEstatisticasDashboard(),
    getUltimosEncaminhamentos(),
  ])

  const dadosCausas = stats.topCausas.map(c => ({ name: c.causa, value: c.total }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Visão geral dos encaminhamentos ao IML
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Este mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{stats.totalMes}</p>
            <p className="text-xs text-muted-foreground mt-1">encaminhamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{stats.totalHoje}</p>
            <p className="text-xs text-muted-foreground mt-1">encaminhamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Rascunhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats.pendentes}</p>
            <p className="text-xs text-muted-foreground mt-1">aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stats.confirmados}
            </p>
            <p className="text-xs text-muted-foreground mt-1">com protocolo</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <DashboardCharts dadosCausas={dadosCausas} stats={stats} />

      {/* Últimos encaminhamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Últimos Encaminhamentos</CardTitle>
          <LinkButton href="/encaminhamentos" variant="ghost" size="sm">
            Ver todos
            <ArrowRight className="w-4 h-4 ml-1" />
          </LinkButton>
        </CardHeader>
        <CardContent>
          {ultimos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum encaminhamento registrado.</p>
              <a href="/encaminhamentos/novo" className="text-sm text-primary hover:underline mt-1 inline-block">
                Criar primeiro encaminhamento
              </a>
            </div>
          ) : (
            <div className="divide-y">
              {ultimos.map((enc) => {
                const st = statusLabel[enc.status] ?? { label: enc.status, variant: 'outline' as const }
                return (
                  <a
                    key={enc.id}
                    href={`/encaminhamentos/${enc.id}`}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 -mx-2 rounded transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {enc.nome_falecido ?? 'Não identificado'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {enc.protocolo ?? 'Rascunho'} · {enc.instituicao_nome}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {causaLabel[enc.causa_principal] ?? enc.causa_principal}
                      </span>
                      <Badge variant={st.variant} className="text-xs">
                        {st.label}
                      </Badge>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
