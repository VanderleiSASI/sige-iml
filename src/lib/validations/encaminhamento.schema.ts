import { z } from 'zod'

// ── Schema simplificado sem discriminated unions ──────────────────────────────

export const encaminhamentoSchema = z.object({
  // Step 1: Dados da Instituição
  instituicao_nome: z.string().min(3, 'Nome da instituição obrigatório'),
  instituicao_tipo: z.enum(['hospital_ps', 'spa', 'maternidade', 'outro']),
  instituicao_tipo_outro: z.string().optional(),
  medico_nome: z.string().min(3, 'Nome do médico obrigatório'),
  medico_crm: z
    .string()
    .min(4, 'CRM obrigatório')
    .regex(/^\d{4,6}(-[A-Z]{2})?$/, 'Formato de CRM inválido (ex: 12345 ou 12345-AM)'),
  motivo: z.enum(['morte_violenta', 'morte_suspeita']),

  // Step 2: Causa da Morte
  causa_principal: z.enum([
    'arma_de_fogo',
    'arma_branca',
    'asfixia',
    'queimadura',
    'acidente_transito',
    'afogamento',
    'envenenamento',
    'espancamento',
    'outros',
  ]),
  causa_detalhes: z.string().optional(),
  subtipo_asfixia: z
    .enum(['enforcamento', 'estrangulamento', 'esganadura', 'afogamento', 'soterramento'])
    .optional(),
  envenenamento_substancias: z.array(z.string()).optional(),
  descricao_suspeita: z.string().optional(),

  // Step 3: Identificação do Corpo
  identificado: z.boolean(),
  nome_falecido: z.string().optional(),
  sexo: z.enum(['masculino', 'feminino', 'indeterminado']),
  data_nascimento: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  nacionalidade: z.string().default('Brasileira'),
  naturalidade: z.string().optional(),
  filiacao_mae: z.string().optional(),
  filiacao_pai: z.string().optional(),
  profissao: z.string().optional(),
  endereco_vitima: z.string().optional(),
  contato_familiar_nome: z.string().optional(),
  contato_familiar_parentesco: z.string().optional(),
  contato_familiar_telefone: z.string().optional(),
  caracteristicas_fisicas: z.string().optional(),
  vestimentas_objetos: z.string().optional(),

  // Step 4: Dados do Atendimento
  data_obito: z.string().min(1, 'Data do óbito obrigatória'),
  hora_obito: z.string().regex(/^\d{2}:\d{2}$/, 'Hora do óbito obrigatória'),
  cidade_preenchimento: z.string().min(2, 'Cidade de preenchimento obrigatória'),
  data_preenchimento: z.string().min(1, 'Data de preenchimento obrigatória'),
  recebeu_atendimento: z.boolean(),
  data_admissao: z.string().optional(),
  houve_internacao: z.boolean().optional(),
  houve_transfusao: z.boolean().optional(),
  descricao_transfusao: z.string().optional(),
  outras_informacoes: z.string().optional(),

  // Campos exclusivos para Arma de Fogo
  arma_fogo_exame_imagem: z.boolean().optional(),
  arma_fogo_tipo_exame: z.string().optional(),
  arma_fogo_cirurgia: z.boolean().optional(),
  arma_fogo_desc_cirurgia: z.string().optional(),
  arma_fogo_projeteis_loc: z.boolean().optional(),
  arma_fogo_projeteis_qtd: z.number().int().min(0).optional(),
  arma_fogo_projeteis_rec: z.boolean().optional(),
  arma_fogo_projeteis_dest: z.string().optional(),
})
  // Validações cross-field
  .refine(
    (data) => {
      if (!data.data_admissao || !data.data_obito) return true
      return new Date(data.data_admissao) <= new Date(data.data_obito)
    },
    {
      message: 'Data de admissão deve ser anterior ou igual à data do óbito',
      path: ['data_admissao'],
    }
  )
  // Validação: se não identificado, características físicas são obrigatórias
  .refine(
    (data) => {
      if (data.identificado) return true
      return !!data.caracteristicas_fisicas && data.caracteristicas_fisicas.length >= 10
    },
    {
      message: 'Descreva as características físicas (mínimo 10 caracteres)',
      path: ['caracteristicas_fisicas'],
    }
  )
  // Validação: se identificado, nome é obrigatório
  .refine(
    (data) => {
      if (!data.identificado) return true
      return !!data.nome_falecido && data.nome_falecido.length >= 3
    },
    {
      message: 'Nome do falecido obrigatório',
      path: ['nome_falecido'],
    }
  )
  // Validação: motivo suspeita requer descrição
  .refine(
    (data) => {
      if (data.motivo !== 'morte_suspeita') return true
      return !!data.descricao_suspeita && data.descricao_suspeita.length >= 20
    },
    {
      message: 'Descreva a suspeita criminal com ao menos 20 caracteres',
      path: ['descricao_suspeita'],
    }
  )
  // Validação: motivo suspeita requer substâncias
  .refine(
    (data) => {
      if (data.motivo !== 'morte_suspeita') return true
      return !!data.envenenamento_substancias && data.envenenamento_substancias.length > 0
    },
    {
      message: 'Selecione ao menos uma substância',
      path: ['envenenamento_substancias'],
    }
  )
  // Validação: arma de fogo requer campos obrigatórios
  .refine(
    (data) => {
      if (data.causa_principal !== 'arma_de_fogo') return true
      return (
        data.arma_fogo_exame_imagem !== undefined &&
        data.arma_fogo_cirurgia !== undefined &&
        data.arma_fogo_projeteis_loc !== undefined
      )
    },
    {
      message: 'Campos obrigatórios para arma de fogo',
      path: ['arma_fogo_exame_imagem'],
    }
  )

// ── Campos por etapa para validação progressiva no stepper ───────────────────

export const camposPorEtapa: Record<number, string[]> = {
  0: ['instituicao_nome', 'instituicao_tipo', 'medico_nome', 'medico_crm', 'motivo'],
  1: ['causa_principal', 'envenenamento_substancias', 'descricao_suspeita'],
  2: ['identificado', 'nome_falecido', 'sexo', 'caracteristicas_fisicas'],
  3: ['data_obito', 'hora_obito', 'cidade_preenchimento', 'data_preenchimento',
      'arma_fogo_exame_imagem', 'arma_fogo_cirurgia', 'arma_fogo_projeteis_loc'],
}

export type EncaminhamentoFormData = z.infer<typeof encaminhamentoSchema>
