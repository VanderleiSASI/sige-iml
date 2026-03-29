'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  BarChart3, 
  Calendar, 
  Users, 
  Building2, 
  Activity,
  Download,
  Filter,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { gerarRelatorio, gerarRelatorioProdutividade, type DadosRelatorio } from '@/lib/actions/relatorios'
import { listarInstituicoesAtivas } from '@/lib/actions/admin'
import type { Database } from '@/lib/types/database.types'

const CORES = ['#003366', '#006633', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const causasDisponiveis: Database['public']['Enums']['causa_principal'][] = [
  'arma_de_fogo', 'arma_branca', 'asfixia', 'queimadura', 
  'acidente_transito', 'afogamento', 'envenenamento', 'espancamento', 'outros'
]

const causasLabel: Record<string, string> = {
  arma_de_fogo: 'Arma de Fogo',
  arma_branca: 'Arma Branca',
  asfixia: 'Asfixia',
  queimadura: 'Queimadura',
  acidente_transito: 'Acidente de Trânsito',
  afogamento: 'Afogamento',
  envenenamento: 'Envenenamento',
  espancamento: 'Espancamento',
  outros: 'Outros',
}

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('geral')
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState<DadosRelatorio | null>(null)
  const [dadosProdutividade, setDadosProdutividade] = useState<Awaited<ReturnType<typeof gerarRelatorioProdutividade>>>([])
  const [instituicoes, setInstituicoes] = useState<Array<{ id: string; nome: string }>>([])
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [instituicaoId, setInstituicaoId] = useState('')
  const [causa, setCausa] = useState<Database['public']['Enums']['causa_principal'] | ''>('')

  useEffect(() => {
    carregarInstituicoes()
    carregarDados()
  }, [])

  async function carregarInstituicoes() {
    const insts = await listarInstituicoesAtivas()
    setInstituicoes(insts.map(i => ({ id: i.id, nome: i.nome })))
  }

  async function carregarDados() {
    setCarregando(true)
    const [relatorio, produtividade] = await Promise.all([
      gerarRelatorio({
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        instituicaoId: instituicaoId || undefined,
        causa: causa || undefined,
      }),
      gerarRelatorioProdutividade(
        dataInicio || undefined,
        dataFim || undefined
      ),
    ])
    setDados(relatorio)
    setDadosProdutividade(produtividade)
    setCarregando(false)
  }

  function handleExportarCSV() {
    if (!dados) return

    const linhas = [
      ['Métrica', 'Valor'],
      ['Total de Encaminhamentos', dados.total.toString()],
      ['Identificados', dados.identificados.sim.toString()],
      ['Não Identificados', dados.identificados.nao.toString()],
      [],
      ['Por Causa', ''],
      ...Object.entries(dados.porCausa).map(([causa, total]) => [causa, total.toString()]),
      [],
      ['Por Status', ''],
      ...Object.entries(dados.porStatus).map(([status, total]) => [status, total.toString()]),
      [],
      ['Por Sexo', ''],
      ...Object.entries(dados.porSexo).map(([sexo, total]) => [sexo, total.toString()]),
    ]

    const csv = linhas.map(l => l.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_iml_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    
    toast.success('Relatório exportado!')
  }

  const dadosCausa = dados ? Object.entries(dados.porCausa).map(([name, value]) => ({ name, value })) : []
  const dadosStatus = dados ? Object.entries(dados.porStatus).map(([name, value]) => ({ name, value })) : []
  const dadosSexo = dados ? Object.entries(dados.porSexo).map(([name, value]) => ({ name, value })) : []
  const dadosIdentificados = dados ? [
    { name: 'Identificados', value: dados.identificados.sim },
    { name: 'Não Identificados', value: dados.identificados.nao },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Relatórios
          </h1>
          <p className="text-muted-foreground text-sm">
            Análise estatística e relatórios dos encaminhamentos
          </p>
        </div>
        <Button variant="outline" onClick={handleExportarCSV} disabled={!dados || carregando}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data Início</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data Fim</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Instituição</label>
              <select
                value={instituicaoId}
                onChange={(e) => setInstituicaoId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background"
              >
                <option value="">Todas</option>
                {instituicoes.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Causa</label>
              <select
                value={causa}
                onChange={(e) => setCausa(e.target.value as Database['public']['Enums']['causa_principal'] | '')}
                className="w-full h-10 px-3 rounded-md border bg-background"
              >
                <option value="">Todas</option>
                {causasDisponiveis.map((c) => (
                  <option key={c} value={c}>{causasLabel[c]}</option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={carregarDados} className="mt-4" disabled={carregando}>
            {carregando ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="causas">Causas</TabsTrigger>
          <TabsTrigger value="demografico">Demográfico</TabsTrigger>
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
        </TabsList>

        {/* Tab Geral */}
        <TabsContent value="geral" className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{dados?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">encaminhamentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Confirmados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {dados?.porStatus['Confirmado'] ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dados ? Math.round((dados.porStatus['Confirmado'] ?? 0) / dados.total * 100) : 0}% do total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Rascunhos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-600">
                  {dados?.porStatus['Rascunho'] ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Cancelados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-destructive">
                  {dados?.porStatus['Cancelado'] ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">encaminhamentos</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {dadosStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Top Instituições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados?.porInstituicao.slice(0, 5) ?? []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="instituicao" type="category" width={150} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#003366" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Causas */}
        <TabsContent value="causas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Distribuição por Causa da Morte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosCausa}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#006633">
                      {dadosCausa.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dadosCausa.map((causa, index) => (
              <Card key={causa.name}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CORES[index % CORES.length] }}
                    />
                    <span className="font-medium">{causa.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{causa.value}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({Math.round((causa.value / (dados?.total || 1)) * 100)}%)
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab Demográfico */}
        <TabsContent value="demografico" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Por Sexo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosSexo}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label
                      >
                        {dadosSexo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Identificação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosIdentificados}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#6b7280" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dados?.porMes ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#003366" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Produtividade */}
        <TabsContent value="produtividade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Produtividade por Médico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosProdutividade.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                <div className="space-y-4">
                  {dadosProdutividade.map((med) => (
                    <div key={med.medicoId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{med.medicoNome}</h3>
                        <Badge variant="outline">{med.totalEncaminhamentos} total</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-2 bg-green-50 rounded">
                          <p className="text-2xl font-bold text-green-600">{med.confirmados}</p>
                          <p className="text-xs text-muted-foreground">Confirmados</p>
                        </div>
                        <div className="p-2 bg-amber-50 rounded">
                          <p className="text-2xl font-bold text-amber-600">{med.rascunhos}</p>
                          <p className="text-xs text-muted-foreground">Rascunhos</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded">
                          <p className="text-2xl font-bold text-red-600">{med.cancelados}</p>
                          <p className="text-xs text-muted-foreground">Cancelados</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
