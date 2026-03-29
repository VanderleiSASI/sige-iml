'use client'

import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'sonner'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { registrarGeracaoPdf } from '@/lib/actions/encaminhamentos'
import type { Database } from '@/lib/types/database.types'

type Encaminhamento = Database['public']['Tables']['encaminhamentos']['Row']

interface Props {
  encaminhamento: Encaminhamento
}

const causaLabel: Record<string, string> = {
  arma_de_fogo: 'ARMA DE FOGO',
  arma_branca: 'ARMA BRANCA',
  asfixia: 'ASFIXIA',
  queimadura: 'QUEIMADURA',
  acidente_transito: 'ACIDENTE DE TRÂNSITO',
  afogamento: 'AFOGAMENTO',
  envenenamento: 'ENVENENAMENTO/INTOXICAÇÃO',
  espancamento: 'ESPANCAMENTO',
  outros: 'OUTRO',
}

const subtipoAsfixiaLabel: Record<string, string> = {
  enforcamento: 'ENFORCAMENTO',
  estrangulamento: 'ESTRANGULAMENTO',
  esganadura: 'ESGANADURA',
  afogamento: 'AFOGAMENTO',
  soterramento: 'SOTERRAMENTO',
}

function Checkbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-3 h-3 border border-black text-center text-[8px] leading-3">
        {checked ? 'X' : ''}
      </span>
      <span className="text-[10px]">{label}</span>
    </span>
  )
}

function CampoLinha({ label, value, fullWidth = false }: { label: string; value?: string | null; fullWidth?: boolean }) {
  return (
    <div className={`${fullWidth ? 'col-span-full' : ''} border-b border-black pb-0.5`}>
      <span className="text-[10px] font-bold">{label}:</span>
      <span className="text-[10px] ml-1">{value || ''}</span>
    </div>
  )
}

export function FichaIMLPDF({ encaminhamento }: Props) {
  const [gerando, setGerando] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ficha_IML_${encaminhamento.protocolo ?? encaminhamento.id.slice(0, 8)}`,
    onAfterPrint: async () => {
      const resultado = await registrarGeracaoPdf(encaminhamento.id)
      if ('erro' in resultado) {
        console.error('Erro ao registrar PDF:', resultado.erro)
      }
      setGerando(false)
    },
    onPrintError: () => {
      toast.error('Erro ao gerar PDF')
      setGerando(false)
    },
  })

  async function handleGerarPdf() {
    setGerando(true)
    handlePrint()
  }

  const isAcidenteTransito = encaminhamento.causa_principal === 'acidente_transito'
  const isQueda = false // Não temos esse campo específico
  const isAgressaoMaos = false
  const isAgressaoArma = false
  const isArmaBranca = encaminhamento.causa_principal === 'arma_branca'
  const isArmaFogo = encaminhamento.causa_principal === 'arma_de_fogo'
  const isMordida = false
  const isAsfixia = encaminhamento.causa_principal === 'asfixia'
  const isAfogamento = encaminhamento.subtipo_asfixia === 'afogamento' || encaminhamento.causa_principal === 'afogamento'
  const isEnforcamento = encaminhamento.subtipo_asfixia === 'enforcamento'
  const isEstrangulamento = encaminhamento.subtipo_asfixia === 'estrangulamento'
  const isEsganadura = encaminhamento.subtipo_asfixia === 'esganadura'
  const isSoterramento = encaminhamento.subtipo_asfixia === 'soterramento'
  const isQueimadura = encaminhamento.causa_principal === 'queimadura'
  const isChoque = false
  const isOutro = encaminhamento.causa_principal === 'outros'
  const isMorteViolenta = encaminhamento.motivo === 'morte_violenta'
  const isMorteSuspeita = encaminhamento.motivo === 'morte_suspeita'

  return (
    <>
      <Button 
        onClick={handleGerarPdf} 
        disabled={gerando || encaminhamento.status !== 'confirmado'}
      >
        <Printer className="w-4 h-4 mr-2" />
        {gerando ? 'Gerando...' : 'Imprimir Ficha Oficial'}
      </Button>

      {/* Template para impressão (escondido) */}
      <div className="hidden">
        <div 
          ref={printRef} 
          className="bg-white text-black p-6"
          style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}
        >
          {/* Brasão e Cabeçalho */}
          <div className="text-center mb-4">
            {/* Brasão do Amazonas */}
            <div className="flex justify-center mb-2">
              <img 
                src="/governo_amazonas_logo.png" 
                alt="Governo do Amazonas" 
                className="h-20 object-contain"
              />
            </div>
            <h1 className="text-sm font-bold tracking-wide">
              FICHA DE ENCAMINHAMENTO DE CADÁVER AO INSTITUTO MÉDICO LEGAL
            </h1>
          </div>

          {/* Seção 1: Dados da Instituição */}
          <div className="mb-4">
            <h2 className="text-xs font-bold mb-2">1. DADOS DA INSTITUIÇÃO</h2>
            
            <CampoLinha label="NOME DA INSTITUIÇÃO" value={encaminhamento.instituicao_nome} fullWidth />
            
            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
              <div>
                <span className="font-bold">TIPO DE INSTITUIÇÃO:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Checkbox checked={encaminhamento.instituicao_tipo === 'hospital_ps'} label="Hospital/PS" />
                  <Checkbox checked={encaminhamento.instituicao_tipo === 'spa'} label="SPA" />
                  <Checkbox checked={encaminhamento.instituicao_tipo === 'maternidade'} label="Maternidade" />
                  <Checkbox checked={encaminhamento.instituicao_tipo === 'outro'} label="Outros" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <CampoLinha label="NOME DO MÉDICO RESPONSÁVEL PELO ENCAMINHAMENTO" value={encaminhamento.medico_nome} />
              <CampoLinha label="CRM" value={encaminhamento.medico_crm} />
            </div>

            <div className="mt-2 text-[10px]">
              <span className="font-bold">MOTIVO DO ENCAMINHAMENTO:</span>
              <div className="flex gap-4 mt-1">
                <Checkbox checked={isMorteViolenta} label="Morte Violenta" />
                <Checkbox checked={isMorteSuspeita} label="Morte Suspeita" />
              </div>
            </div>
          </div>

          {/* Seção 2: Causa da Morte */}
          <div className="mb-4">
            <h2 className="text-xs font-bold mb-2">2. CAUSA DA MORTE</h2>
            
            {/* 2.1 Morte Violenta */}
            <div className="mb-3">
              <h3 className="text-[10px] font-bold mb-2">2.1 NO CASO DE MORTE VIOLENTA</h3>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
                <div className="flex items-center gap-1">
                  <Checkbox checked={isAcidenteTransito} label="ACIDENTE DE TRÂNSITO" />
                  {isAcidenteTransito && encaminhamento.causa_detalhes && (
                    <span className="border-b border-black flex-1 ml-1 text-[8px]">{encaminhamento.causa_detalhes}</span>
                  )}
                </div>
                <div><Checkbox checked={isQueda} label="QUEDA" /></div>
                
                <div className="col-span-2 flex flex-wrap gap-2">
                  <Checkbox checked={isAgressaoMaos} label="AGRESSÃO FÍSICA MÃOS/PÉS" />
                  <Checkbox checked={isAgressaoArma} label="AGRESSÃO FÍSICA COM ARMA BRANCA" />
                </div>
                
                <div className="flex items-center gap-1">
                  <Checkbox checked={isArmaFogo} label="ARMA DE FOGO" />
                  {isArmaFogo && encaminhamento.arma_fogo_projeteis_qtd && (
                    <span className="text-[8px] ml-2">Qtd: {encaminhamento.arma_fogo_projeteis_qtd}</span>
                  )}
                </div>
                <div><Checkbox checked={isMordida} label="MORDEDURA/CONTATO COM ANIMAL(IS)" /></div>
                
                <div className="col-span-2 flex flex-wrap gap-2">
                  <Checkbox checked={isAsfixia && !isAfogamento && !isEnforcamento && !isEstrangulamento && !isEsganadura && !isSoterramento} label="ASFIXIA POR" />
                  <Checkbox checked={isEnforcamento} label="ENFORCAMENTO" />
                  <Checkbox checked={isEstrangulamento} label="ESTRANGULAMENTO" />
                  <Checkbox checked={isEsganadura} label="ESGANADURA" />
                  <Checkbox checked={isAfogamento} label="AFOGAMENTO" />
                  <Checkbox checked={isSoterramento} label="SOTERRAMENTO" />
                </div>
                
                <div className="flex items-center gap-1">
                  <Checkbox checked={isQueimadura} label="QUEIMADURA POR" />
                  {isQueimadura && encaminhamento.causa_detalhes && (
                    <span className="border-b border-black flex-1 ml-1 text-[8px]">{encaminhamento.causa_detalhes}</span>
                  )}
                </div>
                <div><Checkbox checked={isChoque} label="CHOQUE ELÉTRICO POR" /></div>
                
                <div className="col-span-2 flex items-center gap-1">
                  <Checkbox checked={isOutro} label="OUTRO" />
                  {isOutro && encaminhamento.causa_detalhes && (
                    <span className="border-b border-black flex-1 ml-1 text-[8px]">{encaminhamento.causa_detalhes}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 2.2 Morte Suspeita */}
            <div>
              <h3 className="text-[10px] font-bold mb-2">2.2 NO CASO DE MORTE SUSPEITA</h3>
              <div className="text-[9px]">
                <div className="flex flex-wrap gap-2 items-center">
                  <Checkbox checked={isMorteSuspeita} label="ENVENENAMENTO/INTOXICAÇÃO POR:" />
                  {encaminhamento.envenenamento_substancias?.map((s, i) => (
                    <span key={i} className="border-b border-black px-2 text-[8px]">{s}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Checkbox checked={encaminhamento.envenenamento_substancias?.includes('Álcool')} label="Álcool" />
                  <Checkbox checked={encaminhamento.envenenamento_substancias?.includes('Maconha')} label="Maconha" />
                  <Checkbox checked={encaminhamento.envenenamento_substancias?.includes('Cocaína')} label="Cocaína" />
                  <Checkbox checked={encaminhamento.envenenamento_substancias?.includes('Oxi/Crack')} label="Oxi/Crack" />
                  <Checkbox checked={encaminhamento.envenenamento_substancias?.includes('Medicamento(s)') || false} label="Medicamento(s):" />
                  {encaminhamento.envenenamento_substancias?.some(s => !['Álcool', 'Maconha', 'Cocaína', 'Oxi/Crack', 'Medicamento(s)'].includes(s)) && (
                    <span className="border-b border-black flex-1 text-[8px]">
                      {encaminhamento.envenenamento_substancias?.find(s => !['Álcool', 'Maconha', 'Cocaína', 'Oxi/Crack', 'Medicamento(s)'].includes(s))}
                    </span>
                  )}
                  <Checkbox checked={false} label="Outro(s):" />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Identificação do Corpo */}
          <div className="mb-4">
            <h2 className="text-xs font-bold mb-2">3. IDENTIFICAÇÃO DO CORPO</h2>
            
            <div className="text-[10px] mb-2">
              <span className="font-bold">CORPO IDENTIFICADO:</span>
              <span className="ml-2"><Checkbox checked={!encaminhamento.identificado} label="Não" /></span>
              <span className="ml-2"><Checkbox checked={encaminhamento.identificado} label="Sim" /></span>
            </div>

            {encaminhamento.identificado ? (
              <div className="grid grid-cols-2 gap-2">
                <CampoLinha label="NOME" value={encaminhamento.nome_falecido} />
                <CampoLinha label="RG" value={encaminhamento.rg} />
                <div className="text-[10px]">
                  <span className="font-bold">SEXO:</span>
                  <span className="ml-1"><Checkbox checked={encaminhamento.sexo === 'masculino'} label="Masculino" /></span>
                  <span className="ml-1"><Checkbox checked={encaminhamento.sexo === 'feminino'} label="Feminino" /></span>
                </div>
                <CampoLinha label="DATA DE NASCIMENTO" value={encaminhamento.data_nascimento ? new Date(encaminhamento.data_nascimento).toLocaleDateString('pt-BR') : ''} />
                <CampoLinha label="IDADE" value={encaminhamento.data_nascimento ? String(Math.floor((new Date().getTime() - new Date(encaminhamento.data_nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : ''} />
                <CampoLinha label="PROFISSÃO" value={encaminhamento.profissao} />
                <CampoLinha label="NATURALIDADE" value={encaminhamento.naturalidade} />
                <CampoLinha label="NACIONALIDADE" value={encaminhamento.nacionalidade} />
                <CampoLinha label="MÃE" value={encaminhamento.filiacao_mae} fullWidth />
                <CampoLinha label="PAI" value={encaminhamento.filiacao_pai} fullWidth />
                <CampoLinha label="ENDEREÇO" value={encaminhamento.endereco_vitima} fullWidth />
              </div>
            ) : (
              <div className="space-y-2">
                <CampoLinha label="CARACTERÍSTICAS FÍSICAS" value={encaminhamento.caracteristicas_fisicas} fullWidth />
                <CampoLinha label="VESTIMENTAS E OBJETOS" value={encaminhamento.vestimentas_objetos} fullWidth />
              </div>
            )}
          </div>

          {/* Seção 4: Dados do Atendimento */}
          <div className="mb-4">
            <h2 className="text-xs font-bold mb-2">4. DADOS DO ATENDIMENTO</h2>
            
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <CampoLinha label="DATA DO ÓBITO" value={new Date(encaminhamento.data_obito).toLocaleDateString('pt-BR')} />
              <CampoLinha label="HORA DO ÓBITO" value={encaminhamento.hora_obito} />
              <div className="col-span-2">
                <span className="font-bold">RECEBEU ATENDIMENTO MÉDICO:</span>
                <span className="ml-1"><Checkbox checked={encaminhamento.recebeu_atendimento} label="Sim" /></span>
                <span className="ml-1"><Checkbox checked={!encaminhamento.recebeu_atendimento} label="Não" /></span>
              </div>
            </div>

            {encaminhamento.recebeu_atendimento && (
              <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
                <CampoLinha label="DATA DA INTERNAÇÃO/ADMISSÃO" value={encaminhamento.data_admissao ? new Date(encaminhamento.data_admissao).toLocaleDateString('pt-BR') : ''} />
                <div>
                  <span className="font-bold">HOUVE INTERNAÇÃO:</span>
                  <span className="ml-1"><Checkbox checked={encaminhamento.houve_internacao === true} label="Sim" /></span>
                  <span className="ml-1"><Checkbox checked={encaminhamento.houve_internacao === false} label="Não" /></span>
                </div>
                <div>
                  <span className="font-bold">HOUVE TRANSFUSÃO:</span>
                  <span className="ml-1"><Checkbox checked={encaminhamento.houve_transfusao === true} label="Sim" /></span>
                  <span className="ml-1"><Checkbox checked={encaminhamento.houve_transfusao === false} label="Não" /></span>
                </div>
                <CampoLinha label="DESCRIÇÃO DA TRANSFUSÃO" value={encaminhamento.descricao_transfusao} />
              </div>
            )}
          </div>

          {/* Seção 5: Observações */}
          <div className="mb-4">
            <h2 className="text-xs font-bold mb-2">5. OBSERVAÇÕES</h2>
            <div className="border border-black p-2 min-h-[60px] text-[10px]">
              {encaminhamento.outras_informacoes || 'Nenhuma observação adicional.'}
            </div>
          </div>

          {/* Local e Data */}
          <div className="grid grid-cols-2 gap-4 mb-8 text-[10px]">
            <CampoLinha label="CIDADE" value={encaminhamento.cidade_preenchimento} />
            <CampoLinha label="DATA DO PREENCHIMENTO" value={new Date(encaminhamento.data_preenchimento).toLocaleDateString('pt-BR')} />
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-2 gap-12 mt-12">
            <div className="text-center">
              <div className="border-t border-black pt-1">
                <p className="text-[10px] font-bold">{encaminhamento.medico_nome}</p>
                <p className="text-[9px]">CRM: {encaminhamento.medico_crm}</p>
                <p className="text-[9px] text-gray-600">Médico Responsável</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1 min-h-[40px]">
                <p className="text-[10px]">&nbsp;</p>
                <p className="text-[9px] text-gray-600">Recebedor no IML</p>
              </div>
            </div>
          </div>

          {/* Protocolo e Hash */}
          <div className="mt-8 pt-4 border-t-2 border-black">
            <div className="flex justify-between items-center text-[9px]">
              <div>
                <span className="font-bold">PROTOCOLO:</span>
                <span className="ml-2 font-mono text-sm">{encaminhamento.protocolo || 'RASCUNHO'}</span>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-gray-500">Documento gerado eletronicamente pelo SIGE-IML</p>
                {encaminhamento.hash_integridade && (
                  <p className="text-[7px] text-gray-400 font-mono truncate max-w-[300px]">
                    HASH: {encaminhamento.hash_integridade}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé IML */}
          <div className="mt-6 pt-4 border-t border-gray-300 text-[8px] text-center text-gray-600">
            <p>INSTITUTO MÉDICO LEGAL &quot;DR. ANTÔNIO HOSANNAH DA SILVA FILHO&quot;</p>
            <p>Avenida Noel Nutels, 300 - Cidade Nova - Manaus/AM - CEP: 69090-000</p>
            <p>Fone: (92) 3216-6070 / 3216-6048</p>
          </div>
        </div>
      </div>
    </>
  )
}
