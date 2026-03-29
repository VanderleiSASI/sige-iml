'use client'

import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'sonner'
import { FileDown, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { registrarGeracaoPdf } from '@/lib/actions/encaminhamentos'
import type { Database } from '@/lib/types/database.types'

type Encaminhamento = Database['public']['Tables']['encaminhamentos']['Row']

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

const tipoInstituicaoLabel: Record<string, string> = {
  hospital_ps: 'Hospital/Pronto Socorro',
  spa: 'SPA',
  maternidade: 'Maternidade',
  outro: 'Outro',
}

function Campo({ label, value, className = '' }: { label: string; value?: string | null | boolean | number; className?: string }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className={className}>
      <p className="text-[10px] text-gray-600 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium">
        {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
      </p>
    </div>
  )
}

interface Props {
  encaminhamento: Encaminhamento
}

export function GerarPdfButton({ encaminhamento }: Props) {
  const [gerando, setGerando] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ficha_IML_${encaminhamento.protocolo ?? encaminhamento.id.slice(0, 8)}`,
    onAfterPrint: async () => {
      // Registrar geração do PDF
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

  return (
    <>
      <Button 
        onClick={handleGerarPdf} 
        disabled={gerando || encaminhamento.status !== 'confirmado'}
        className="print:hidden"
      >
        <Printer className="w-4 h-4 mr-2" />
        {gerando ? 'Gerando...' : 'Imprimir / PDF'}
      </Button>

      {/* Template para impressão (escondido) */}
      <div className="hidden">
        <div 
          ref={printRef} 
          className="p-8 bg-white text-black"
          style={{ width: '210mm', minHeight: '297mm' }}
        >
          {/* Cabeçalho Institucional */}
          <div className="border-b-2 border-black pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div className="text-center flex-1">
                <p className="text-sm font-bold">ESTADO DO AMAZONAS</p>
                <p className="text-xs">Secretaria de Segurança Pública</p>
                <p className="text-xs">Departamento de Polícia Técnico-Científica</p>
                <p className="text-sm font-bold mt-2">
                  INSTITUTO MÉDICO LEGAL
                </p>
                <p className="text-xs italic">&quot;Dr. Antônio Hosannah da Silva Filho&quot;</p>
              </div>
              <div className="text-right">
                <p className="text-xs">Protocolo:</p>
                <p className="text-xl font-mono font-bold">
                  {encaminhamento.protocolo ?? 'RASCUNHO'}
                </p>
                <p className="text-xs mt-1">
                  {new Date(encaminhamento.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold border-2 border-black inline-block px-8 py-2">
              FICHA DE ENCAMINHAMENTO DE CADÁVER AO IML
            </h1>
          </div>

          {/* Seção 1: Instituição */}
          <div className="mb-6">
            <h2 className="text-sm font-bold bg-gray-200 px-2 py-1 mb-3">
              1. DADOS DA INSTITUIÇÃO DE ORIGEM
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Nome da Instituição" value={encaminhamento.instituicao_nome} />
              <Campo label="Tipo" value={encaminhamento.instituicao_tipo ? tipoInstituicaoLabel[encaminhamento.instituicao_tipo] : undefined} />
              <Campo label="Médico Responsável" value={encaminhamento.medico_nome} />
              <Campo label="CRM" value={encaminhamento.medico_crm} />
              <Campo label="Motivo do Encaminhamento" value={motivoLabel[encaminhamento.motivo]} className="col-span-2" />
            </div>
          </div>

          {/* Seção 2: Causa */}
          <div className="mb-6">
            <h2 className="text-sm font-bold bg-gray-200 px-2 py-1 mb-3">
              2. CAUSA DA MORTE
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Causa Principal" value={causaLabel[encaminhamento.causa_principal]} />
              <Campo label="Detalhes" value={encaminhamento.causa_detalhes} />
              {encaminhamento.subtipo_asfixia && (
                <Campo label="Subtipo de Asfixia" value={encaminhamento.subtipo_asfixia} />
              )}
            </div>
          </div>

          {/* Seção 3: Identificação */}
          <div className="mb-6">
            <h2 className="text-sm font-bold bg-gray-200 px-2 py-1 mb-3 flex items-center gap-2">
              3. IDENTIFICAÇÃO DO CORPO
              <span className="text-xs font-normal">
                ({encaminhamento.identificado ? 'Identificado' : 'Não Identificado'})
              </span>
            </h2>
            {encaminhamento.identificado ? (
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Nome Completo" value={encaminhamento.nome_falecido} className="col-span-2" />
                <Campo label="Sexo" value={sexoLabel[encaminhamento.sexo]} />
                <Campo label="Data de Nascimento" value={encaminhamento.data_nascimento ? new Date(encaminhamento.data_nascimento).toLocaleDateString('pt-BR') : null} />
                <Campo label="CPF" value={encaminhamento.cpf} />
                <Campo label="RG" value={encaminhamento.rg} />
                <Campo label="Nacionalidade" value={encaminhamento.nacionalidade} />
                <Campo label="Naturalidade" value={encaminhamento.naturalidade} />
                <Campo label="Profissão" value={encaminhamento.profissao} />
                <Campo label="Filiação - Mãe" value={encaminhamento.filiacao_mae} className="col-span-2" />
                <Campo label="Filiação - Pai" value={encaminhamento.filiacao_pai} className="col-span-2" />
                <Campo label="Endereço" value={encaminhamento.endereco_vitima} className="col-span-2" />
              </div>
            ) : (
              <div className="space-y-3">
                <Campo label="Características Físicas" value={encaminhamento.caracteristicas_fisicas} />
                <Campo label="Vestimentas e Objetos" value={encaminhamento.vestimentas_objetos} />
              </div>
            )}
          </div>

          {/* Seção 4: Atendimento */}
          <div className="mb-6">
            <h2 className="text-sm font-bold bg-gray-200 px-2 py-1 mb-3">
              4. DADOS DO ATENDIMENTO
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Data do Óbito" value={new Date(encaminhamento.data_obito).toLocaleDateString('pt-BR')} />
              <Campo label="Hora do Óbito" value={encaminhamento.hora_obito} />
              <Campo label="Recebeu Atendimento Médico" value={encaminhamento.recebeu_atendimento} />
              {encaminhamento.recebeu_atendimento && (
                <>
                  <Campo label="Data de Admissão" value={encaminhamento.data_admissao ? new Date(encaminhamento.data_admissao).toLocaleDateString('pt-BR') : null} />
                  <Campo label="Houve Internação" value={encaminhamento.houve_internacao} />
                  <Campo label="Houve Transfusão" value={encaminhamento.houve_transfusao} />
                </>
              )}
            </div>
          </div>

          {/* Seção Arma de Fogo */}
          {encaminhamento.causa_principal === 'arma_de_fogo' && (
            <div className="mb-6 border-2 border-red-500 p-4">
              <h2 className="text-sm font-bold bg-red-100 text-red-800 px-2 py-1 mb-3">
                DADOS ESPECÍFICOS - ARMA DE FOGO
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Realizou Exame de Imagem" value={encaminhamento.arma_fogo_exame_imagem} />
                <Campo label="Tipo de Exame" value={encaminhamento.arma_fogo_tipo_exame} />
                <Campo label="Realizou Cirurgia" value={encaminhamento.arma_fogo_cirurgia} />
                <Campo label="Projéteis Localizados" value={encaminhamento.arma_fogo_projeteis_loc} />
                <Campo label="Quantidade de Projéteis" value={encaminhamento.arma_fogo_projeteis_qtd} />
                <Campo label="Projéteis Recuperados" value={encaminhamento.arma_fogo_projeteis_rec} />
              </div>
            </div>
          )}

          {/* Seção 5: Informações Adicionais */}
          <div className="mb-6">
            <h2 className="text-sm font-bold bg-gray-200 px-2 py-1 mb-3">
              5. INFORMAÇÕES ADICIONAIS
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Cidade do Preenchimento" value={encaminhamento.cidade_preenchimento} />
              <Campo label="Data do Preenchimento" value={new Date(encaminhamento.data_preenchimento).toLocaleDateString('pt-BR')} />
              {encaminhamento.outras_informacoes && (
                <Campo label="Outras Informações" value={encaminhamento.outras_informacoes} className="col-span-2" />
              )}
            </div>
          </div>

          {/* Assinaturas */}
          <div className="mt-12 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-black pt-2">
                <p className="text-sm font-medium">{encaminhamento.medico_nome}</p>
                <p className="text-xs text-gray-600">CRM: {encaminhamento.medico_crm}</p>
                <p className="text-xs text-gray-500">Médico Responsável</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-2">
                <p className="text-sm font-medium">&nbsp;</p>
                <p className="text-xs text-gray-500">Recebedor no IML</p>
              </div>
            </div>
          </div>

          {/* Rodapé com Hash */}
          {encaminhamento.hash_integridade && (
            <div className="mt-12 pt-4 border-t border-gray-300">
              <p className="text-[8px] text-gray-500 text-center">
                HASH DE INTEGRIDADE: {encaminhamento.hash_integridade}
              </p>
              <p className="text-[8px] text-gray-400 text-center mt-1">
                Documento gerado eletronicamente pelo SIGE-IML em {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
