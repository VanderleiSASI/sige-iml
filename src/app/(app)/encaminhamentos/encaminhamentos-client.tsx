'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, FileText, Search, Filter, X } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

type Encaminhamento = Database['public']['Tables']['encaminhamentos']['Row']
type StatusEncaminhamento = Database['public']['Enums']['status_encaminhamento']
type CausaPrincipal = Database['public']['Enums']['causa_principal']

const statusConfig: Record<StatusEncaminhamento, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  rascunho:     { label: 'Rascunho',     variant: 'outline' },
  confirmado:   { label: 'Confirmado',   variant: 'default' },
  recebido_iml: { label: 'Recebido IML', variant: 'secondary' },
  cancelado:    { label: 'Cancelado',    variant: 'destructive' },
}

const causaLabel: Record<CausaPrincipal, string> = {
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

interface Props {
  encaminhamentos: Encaminhamento[]
}

export default function EncaminhamentosClient({ encaminhamentos: initialData }: Props) {
  const [encaminhamentos] = useState<Encaminhamento[]>(initialData || [])
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusEncaminhamento | 'todos'>('todos')
  const [filtroCausa, setFiltroCausa] = useState<CausaPrincipal | 'todos'>('todos')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const filteredEncaminhamentos = useMemo(() => {
    return encaminhamentos.filter((enc) => {
      // Filtro de busca textual
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchProtocolo = enc.protocolo?.toLowerCase().includes(search)
        const matchNome = enc.nome_falecido?.toLowerCase().includes(search)
        const matchInstituicao = enc.instituicao_nome.toLowerCase().includes(search)
        const matchMedico = enc.medico_nome.toLowerCase().includes(search)
        
        if (!matchProtocolo && !matchNome && !matchInstituicao && !matchMedico) {
          return false
        }
      }
      
      // Filtro de status
      if (filtroStatus !== 'todos' && enc.status !== filtroStatus) {
        return false
      }
      
      // Filtro de causa
      if (filtroCausa !== 'todos' && enc.causa_principal !== filtroCausa) {
        return false
      }
      
      // Filtro de data
      if (filtroDataInicio && enc.data_obito) {
        const dataObito = new Date(enc.data_obito)
        const dataInicio = new Date(filtroDataInicio)
        if (dataObito < dataInicio) return false
      }
      
      if (filtroDataFim && enc.data_obito) {
        const dataObito = new Date(enc.data_obito)
        const dataFim = new Date(filtroDataFim)
        dataFim.setHours(23, 59, 59, 999)
        if (dataObito > dataFim) return false
      }
      
      return true
    })
  }, [encaminhamentos, searchTerm, filtroStatus, filtroCausa, filtroDataInicio, filtroDataFim])

  function limparFiltros() {
    setSearchTerm('')
    setFiltroStatus('todos')
    setFiltroCausa('todos')
    setFiltroDataInicio('')
    setFiltroDataFim('')
  }

  const filtrosAtivos = searchTerm || filtroStatus !== 'todos' || filtroCausa !== 'todos' || filtroDataInicio || filtroDataFim

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Encaminhamentos</h1>
          <p className="text-muted-foreground text-sm">
            {filteredEncaminhamentos.length} de {encaminhamentos.length} registro(s)
          </p>
        </div>
        <LinkButton href="/encaminhamentos/novo">
          <Plus className="w-4 h-4 mr-2" />
          Novo Encaminhamento
        </LinkButton>
      </div>

      {/* Barra de busca e filtros */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por protocolo, nome, instituição ou médico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant={mostrarFiltros ? 'default' : 'outline'}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {filtrosAtivos && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Ativos
              </Badge>
            )}
          </Button>
        </div>

        {/* Painel de filtros */}
        {mostrarFiltros && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as StatusEncaminhamento | 'todos')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="recebido_iml">Recebido IML</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Causa da Morte</label>
                  <Select value={filtroCausa} onValueChange={(v) => setFiltroCausa(v as CausaPrincipal | 'todos')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as causas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {Object.entries(causaLabel).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data do Óbito (Início)</label>
                  <Input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data do Óbito (Fim)</label>
                  <Input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                  />
                </div>
              </div>

              {filtrosAtivos && (
                <div className="flex justify-end mt-4">
                  <Button variant="ghost" onClick={limparFiltros}>
                    <X className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registros</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEncaminhamentos.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {encaminhamentos.length === 0 
                  ? 'Nenhum encaminhamento registrado' 
                  : 'Nenhum resultado encontrado para os filtros aplicados'}
              </p>
              {encaminhamentos.length === 0 ? (
                <LinkButton href="/encaminhamentos/novo" variant="link" className="mt-2">
                  Criar primeiro encaminhamento
                </LinkButton>
              ) : (
                <Button variant="link" className="mt-2" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Falecido</TableHead>
                  <TableHead className="hidden md:table-cell">Causa</TableHead>
                  <TableHead className="hidden lg:table-cell">Instituição</TableHead>
                  <TableHead className="hidden lg:table-cell">Data do Óbito</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEncaminhamentos.map((enc) => {
                  const st = statusConfig[enc.status] ?? { label: enc.status, variant: 'outline' as const }
                  return (
                    <TableRow key={enc.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/encaminhamentos/${enc.id}`} className="block">
                          <span className="font-mono text-xs text-primary">
                            {enc.protocolo ?? '—'}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/encaminhamentos/${enc.id}`} className="block">
                          <span className="text-sm">
                            {enc.nome_falecido ?? (enc.identificado ? '—' : 'Não identificado')}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {causaLabel[enc.causa_principal] ?? enc.causa_principal}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground truncate max-w-32 block">
                          {enc.instituicao_nome}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground font-mono">
                          {enc.data_obito
                            ? new Date(enc.data_obito).toLocaleDateString('pt-BR')
                            : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="text-xs">
                          {st.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
