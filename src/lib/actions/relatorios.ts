'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'

export interface FiltrosRelatorio {
  dataInicio?: string
  dataFim?: string
  instituicaoId?: string
  medicoId?: string
  causa?: Database['public']['Enums']['causa_principal']
  status?: Database['public']['Enums']['status_encaminhamento']
}

export interface DadosRelatorio {
  total: number
  porCausa: Record<string, number>
  porStatus: Record<string, number>
  porInstituicao: Array<{ instituicao: string; total: number }>
  porMes: Array<{ mes: string; total: number }>
  porSexo: Record<string, number>
  identificados: { sim: number; nao: number }
  porFaixaEtaria: Array<{ faixa: string; total: number }>
  evolucaoDiaria: Array<{ data: string; total: number }>
}

export interface DadosProdutividade {
  medicoId: string
  medicoNome: string
  totalEncaminhamentos: number
  confirmados: number
  rascunhos: number
  cancelados: number
  tempoMedioConfirmacao?: number // em horas
}

/** Gera dados para relatórios gerais */
export async function gerarRelatorio(filtros: FiltrosRelatorio): Promise<DadosRelatorio> {
  const supabase = await createClient()
  
  let query = supabase
    .from('encaminhamentos')
    .select('*')

  if (filtros.dataInicio) {
    query = query.gte('created_at', filtros.dataInicio)
  }
  if (filtros.dataFim) {
    query = query.lte('created_at', filtros.dataFim)
  }
  if (filtros.instituicaoId) {
    query = query.eq('instituicao_id', filtros.instituicaoId)
  }
  if (filtros.medicoId) {
    query = query.eq('medico_id', filtros.medicoId)
  }
  if (filtros.causa) {
    query = query.eq('causa_principal', filtros.causa)
  }
  if (filtros.status) {
    query = query.eq('status', filtros.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao gerar relatório:', error)
    return {
      total: 0,
      porCausa: {},
      porStatus: {},
      porInstituicao: [],
      porMes: [],
      porSexo: {},
      identificados: { sim: 0, nao: 0 },
      porFaixaEtaria: [],
      evolucaoDiaria: [],
    }
  }

  const encaminhamentos = data ?? []

  // Processar dados
  const porCausa: Record<string, number> = {}
  const porStatus: Record<string, number> = {}
  const porInstituicaoMap = new Map<string, number>()
  const porMesMap = new Map<string, number>()
  const porSexo: Record<string, number> = {}
  let identificadosSim = 0
  let identificadosNao = 0
  const faixaEtariaMap = new Map<string, number>()
  const evolucaoDiariaMap = new Map<string, number>()

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

  const statusLabel: Record<string, string> = {
    rascunho: 'Rascunho',
    confirmado: 'Confirmado',
    recebido_iml: 'Recebido IML',
    cancelado: 'Cancelado',
  }

  for (const enc of encaminhamentos) {
    // Por causa
    const causa = causasLabel[enc.causa_principal] ?? enc.causa_principal
    porCausa[causa] = (porCausa[causa] ?? 0) + 1

    // Por status
    const status = statusLabel[enc.status] ?? enc.status
    porStatus[status] = (porStatus[status] ?? 0) + 1

    // Por instituição
    const instNome = enc.instituicao_nome ?? 'Não informada'
    porInstituicaoMap.set(instNome, (porInstituicaoMap.get(instNome) ?? 0) + 1)

    // Por mês
    const mes = new Date(enc.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    porMesMap.set(mes, (porMesMap.get(mes) ?? 0) + 1)

    // Por sexo
    const sexo = enc.sexo === 'masculino' ? 'Masculino' : enc.sexo === 'feminino' ? 'Feminino' : 'Indeterminado'
    porSexo[sexo] = (porSexo[sexo] ?? 0) + 1

    // Identificados
    if (enc.identificado) {
      identificadosSim++
    } else {
      identificadosNao++
    }

    // Faixa etária
    if (enc.data_nascimento) {
      const idade = calcularIdade(enc.data_nascimento)
      const faixa = getFaixaEtaria(idade)
      faixaEtariaMap.set(faixa, (faixaEtariaMap.get(faixa) ?? 0) + 1)
    }

    // Evolução diária
    const data = new Date(enc.created_at).toISOString().slice(0, 10)
    evolucaoDiariaMap.set(data, (evolucaoDiariaMap.get(data) ?? 0) + 1)
  }

  return {
    total: encaminhamentos.length,
    porCausa,
    porStatus,
    porInstituicao: Array.from(porInstituicaoMap.entries())
      .map(([instituicao, total]) => ({ instituicao, total }))
      .sort((a, b) => b.total - a.total),
    porMes: Array.from(porMesMap.entries())
      .map(([mes, total]) => ({ mes, total }))
      .sort((a, b) => a.mes.localeCompare(b.mes)),
    porSexo,
    identificados: { sim: identificadosSim, nao: identificadosNao },
    porFaixaEtaria: Array.from(faixaEtariaMap.entries())
      .map(([faixa, total]) => ({ faixa, total })),
    evolucaoDiaria: Array.from(evolucaoDiariaMap.entries())
      .map(([data, total]) => ({ data, total }))
      .sort((a, b) => a.data.localeCompare(b.data)),
  }
}

/** Relatório de produtividade por médico */
export async function gerarRelatorioProdutividade(
  dataInicio?: string,
  dataFim?: string
): Promise<DadosProdutividade[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('encaminhamentos')
    .select('created_by, medico_nome, status, created_at, updated_at')

  if (dataInicio) {
    query = query.gte('created_at', dataInicio)
  }
  if (dataFim) {
    query = query.lte('created_at', dataFim)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao gerar relatório de produtividade:', error)
    return []
  }

  const encaminhamentos = data ?? []
  const porMedico = new Map<string, DadosProdutividade>()

  for (const enc of encaminhamentos) {
    const medicoId = enc.created_by
    const medicoNome = enc.medico_nome || 'Não identificado'

    if (!porMedico.has(medicoId)) {
      porMedico.set(medicoId, {
        medicoId,
        medicoNome,
        totalEncaminhamentos: 0,
        confirmados: 0,
        rascunhos: 0,
        cancelados: 0,
      })
    }

    const dados = porMedico.get(medicoId)!
    dados.totalEncaminhamentos++

    if (enc.status === 'confirmado') dados.confirmados++
    else if (enc.status === 'rascunho') dados.rascunhos++
    else if (enc.status === 'cancelado') dados.cancelados++
  }

  return Array.from(porMedico.values()).sort((a, b) => b.totalEncaminhamentos - a.totalEncaminhamentos)
}

/** Estatísticas para dashboard */
export async function getEstatisticasDashboard(): Promise<{
  totalHoje: number
  totalMes: number
  totalAno: number
  pendentes: number
  confirmados: number
  cancelados: number
  topCausas: Array<{ causa: string; total: number }>
}> {
  const supabase = await createClient()
  
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
  const inicioAno = new Date(hoje.getFullYear(), 0, 1).toISOString()
  const hojeStr = hoje.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('encaminhamentos')
    .select('created_at, status, causa_principal')
    .gte('created_at', inicioAno)

  if (error) {
    console.error('Erro ao buscar estatísticas:', JSON.stringify(error, null, 2))
    return {
      totalHoje: 0,
      totalMes: 0,
      totalAno: 0,
      pendentes: 0,
      confirmados: 0,
      cancelados: 0,
      topCausas: [],
    }
  }

  const encaminhamentos = data ?? []

  const causasCount = new Map<string, number>()
  let totalHoje = 0
  let totalMes = 0
  let pendentes = 0
  let confirmados = 0
  let cancelados = 0

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

  for (const enc of encaminhamentos) {
    const dataEnc = new Date(enc.created_at)

    // Hoje
    if (enc.created_at.slice(0, 10) === hojeStr) {
      totalHoje++
    }

    // Mês
    if (dataEnc >= new Date(inicioMes)) {
      totalMes++
    }

    // Status
    if (enc.status === 'rascunho') pendentes++
    else if (enc.status === 'confirmado') confirmados++
    else if (enc.status === 'cancelado') cancelados++

    // Causas
    const causa = causasLabel[enc.causa_principal] ?? enc.causa_principal
    causasCount.set(causa, (causasCount.get(causa) ?? 0) + 1)
  }

  const topCausas = Array.from(causasCount.entries())
    .map(([causa, total]) => ({ causa, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return {
    totalHoje,
    totalMes,
    totalAno: encaminhamentos.length,
    pendentes,
    confirmados,
    cancelados,
    topCausas,
  }
}

// Helpers
function calcularIdade(dataNascimento: string): number {
  const nasc = new Date(dataNascimento)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const mes = hoje.getMonth() - nasc.getMonth()
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
    idade--
  }
  return idade
}

function getFaixaEtaria(idade: number): string {
  if (idade < 1) return '< 1 ano'
  if (idade < 5) return '1-4 anos'
  if (idade < 10) return '5-9 anos'
  if (idade < 15) return '10-14 anos'
  if (idade < 20) return '15-19 anos'
  if (idade < 30) return '20-29 anos'
  if (idade < 40) return '30-39 anos'
  if (idade < 50) return '40-49 anos'
  if (idade < 60) return '50-59 anos'
  if (idade < 70) return '60-69 anos'
  return '70+ anos'
}
