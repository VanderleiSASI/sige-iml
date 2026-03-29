// Este arquivo é gerado automaticamente via:
// supabase gen types typescript --local > src/lib/types/database.types.ts
// Nunca editar manualmente.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PerfilUsuario = 'administrador' | 'gestor_iml' | 'medico' | 'auditor'
export type StatusEncaminhamento = 'rascunho' | 'confirmado' | 'recebido_iml' | 'cancelado'
export type MotivoEncaminhamento = 'morte_violenta' | 'morte_suspeita'
export type CausaPrincipal =
  | 'arma_de_fogo'
  | 'arma_branca'
  | 'asfixia'
  | 'queimadura'
  | 'acidente_transito'
  | 'afogamento'
  | 'envenenamento'
  | 'espancamento'
  | 'outros'
export type SubtipoAsfixia = 'enforcamento' | 'estrangulamento' | 'esganadura' | 'afogamento' | 'soterramento'
export type SexoVitima = 'masculino' | 'feminino' | 'indeterminado'
export type TipoInstituicao = 'hospital_ps' | 'spa' | 'maternidade' | 'outro'
export type AcaoAuditoria = 'criacao' | 'atualizacao' | 'confirmacao' | 'cancelamento' | 'recepcao_iml' | 'geracao_pdf' | 'visualizacao'
export type TipoAnexo = 'identificacao' | 'exame' | 'boletim_ocorrencia' | 'outro'

export interface Database {
  public: {
    Tables: {
      instituicoes: {
        Row: {
          id: string
          nome: string
          tipo: TipoInstituicao
          tipo_outro: string | null
          endereco: string | null
          municipio: string
          uf: string
          telefone: string | null
          responsavel_tecnico: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          tipo: TipoInstituicao
          tipo_outro?: string | null
          endereco?: string | null
          municipio?: string
          uf?: string
          telefone?: string | null
          responsavel_tecnico?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: TipoInstituicao
          tipo_outro?: string | null
          endereco?: string | null
          municipio?: string
          uf?: string
          telefone?: string | null
          responsavel_tecnico?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          perfil: PerfilUsuario
          nome: string
          email: string
          ativo: boolean
          ultimo_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          perfil?: PerfilUsuario
          nome: string
          email: string
          ativo?: boolean
          ultimo_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          perfil?: PerfilUsuario
          nome?: string
          email?: string
          ativo?: boolean
          ultimo_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      medicos: {
        Row: {
          id: string
          instituicao_id: string | null
          nome: string
          crm: string
          crm_uf: string
          especialidade: string | null
          contato: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instituicao_id?: string | null
          nome: string
          crm: string
          crm_uf?: string
          especialidade?: string | null
          contato?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instituicao_id?: string | null
          nome?: string
          crm?: string
          crm_uf?: string
          especialidade?: string | null
          contato?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicos_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          }
        ]
      }
      encaminhamentos: {
        Row: {
          id: string
          protocolo: string | null
          status: StatusEncaminhamento
          versao: number
          created_by: string
          instituicao_id: string | null
          instituicao_nome: string
          instituicao_tipo: TipoInstituicao | null
          medico_id: string | null
          medico_nome: string
          medico_crm: string
          motivo: MotivoEncaminhamento
          causa_principal: CausaPrincipal
          causa_detalhes: string | null
          subtipo_asfixia: SubtipoAsfixia | null
          envenenamento_substancias: string[] | null
          descricao_suspeita: string | null
          identificado: boolean
          nome_falecido: string | null
          cpf: string | null
          rg: string | null
          data_nascimento: string | null
          sexo: SexoVitima
          nacionalidade: string | null
          naturalidade: string | null
          filiacao_mae: string | null
          filiacao_pai: string | null
          profissao: string | null
          endereco_vitima: string | null
          contato_familiar_nome: string | null
          contato_familiar_parentesco: string | null
          contato_familiar_telefone: string | null
          caracteristicas_fisicas: string | null
          vestimentas_objetos: string | null
          recebeu_atendimento: boolean
          data_admissao: string | null
          hora_obito: string | null
          houve_internacao: boolean | null
          data_obito: string
          houve_transfusao: boolean | null
          descricao_transfusao: string | null
          arma_fogo_exame_imagem: boolean | null
          arma_fogo_tipo_exame: string | null
          arma_fogo_cirurgia: boolean | null
          arma_fogo_desc_cirurgia: string | null
          arma_fogo_projeteis_loc: boolean | null
          arma_fogo_projeteis_qtd: number | null
          arma_fogo_projeteis_rec: boolean | null
          arma_fogo_projeteis_dest: string | null
          outras_informacoes: string | null
          cidade_preenchimento: string
          data_preenchimento: string
          justificativa_cancelamento: string | null
          hash_integridade: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          protocolo?: string | null
          status?: StatusEncaminhamento
          versao?: number
          created_by: string
          instituicao_id?: string | null
          instituicao_nome: string
          instituicao_tipo?: TipoInstituicao | null
          medico_id?: string | null
          medico_nome: string
          medico_crm: string
          motivo: MotivoEncaminhamento
          causa_principal: CausaPrincipal
          causa_detalhes?: string | null
          subtipo_asfixia?: SubtipoAsfixia | null
          envenenamento_substancias?: string[] | null
          descricao_suspeita?: string | null
          identificado?: boolean
          nome_falecido?: string | null
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          sexo?: SexoVitima
          nacionalidade?: string | null
          naturalidade?: string | null
          filiacao_mae?: string | null
          filiacao_pai?: string | null
          profissao?: string | null
          endereco_vitima?: string | null
          contato_familiar_nome?: string | null
          contato_familiar_parentesco?: string | null
          contato_familiar_telefone?: string | null
          caracteristicas_fisicas?: string | null
          vestimentas_objetos?: string | null
          recebeu_atendimento?: boolean
          data_admissao?: string | null
          hora_obito?: string | null
          houve_internacao?: boolean | null
          data_obito: string
          houve_transfusao?: boolean | null
          descricao_transfusao?: string | null
          arma_fogo_exame_imagem?: boolean | null
          arma_fogo_tipo_exame?: string | null
          arma_fogo_cirurgia?: boolean | null
          arma_fogo_desc_cirurgia?: string | null
          arma_fogo_projeteis_loc?: boolean | null
          arma_fogo_projeteis_qtd?: number | null
          arma_fogo_projeteis_rec?: boolean | null
          arma_fogo_projeteis_dest?: string | null
          outras_informacoes?: string | null
          cidade_preenchimento?: string
          data_preenchimento?: string
          justificativa_cancelamento?: string | null
          hash_integridade?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          protocolo?: string | null
          status?: StatusEncaminhamento
          versao?: number
          created_by?: string
          instituicao_id?: string | null
          instituicao_nome?: string
          instituicao_tipo?: TipoInstituicao | null
          medico_id?: string | null
          medico_nome?: string
          medico_crm?: string
          motivo?: MotivoEncaminhamento
          causa_principal?: CausaPrincipal
          causa_detalhes?: string | null
          subtipo_asfixia?: SubtipoAsfixia | null
          envenenamento_substancias?: string[] | null
          descricao_suspeita?: string | null
          identificado?: boolean
          nome_falecido?: string | null
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          sexo?: SexoVitima
          nacionalidade?: string | null
          naturalidade?: string | null
          filiacao_mae?: string | null
          filiacao_pai?: string | null
          profissao?: string | null
          endereco_vitima?: string | null
          contato_familiar_nome?: string | null
          contato_familiar_parentesco?: string | null
          contato_familiar_telefone?: string | null
          caracteristicas_fisicas?: string | null
          vestimentas_objetos?: string | null
          recebeu_atendimento?: boolean
          data_admissao?: string | null
          hora_obito?: string | null
          houve_internacao?: boolean | null
          data_obito?: string
          houve_transfusao?: boolean | null
          descricao_transfusao?: string | null
          arma_fogo_exame_imagem?: boolean | null
          arma_fogo_tipo_exame?: string | null
          arma_fogo_cirurgia?: boolean | null
          arma_fogo_desc_cirurgia?: string | null
          arma_fogo_projeteis_loc?: boolean | null
          arma_fogo_projeteis_qtd?: number | null
          arma_fogo_projeteis_rec?: boolean | null
          arma_fogo_projeteis_dest?: string | null
          outras_informacoes?: string | null
          cidade_preenchimento?: string
          data_preenchimento?: string
          justificativa_cancelamento?: string | null
          hash_integridade?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encaminhamentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          }
        ]
      }
      auditoria_logs: {
        Row: {
          id: number
          encaminhamento_id: string | null
          usuario_id: string | null
          acao: AcaoAuditoria
          ip: string | null
          user_agent: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          encaminhamento_id?: string | null
          usuario_id?: string | null
          acao: AcaoAuditoria
          ip?: string | null
          user_agent?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          encaminhamento_id?: string | null
          usuario_id?: string | null
          acao?: AcaoAuditoria
          ip?: string | null
          user_agent?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_logs_encaminhamento_id_fkey"
            columns: ["encaminhamento_id"]
            isOneToOne: false
            referencedRelation: "encaminhamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      anexos: {
        Row: {
          id: string
          encaminhamento_id: string
          tipo: TipoAnexo
          nome_original: string
          storage_path: string
          mime_type: string
          tamanho_bytes: number
          hash_sha256: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          encaminhamento_id: string
          tipo: TipoAnexo
          nome_original: string
          storage_path: string
          mime_type: string
          tamanho_bytes: number
          hash_sha256: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          encaminhamento_id?: string
          tipo?: TipoAnexo
          nome_original?: string
          storage_path?: string
          mime_type?: string
          tamanho_bytes?: number
          hash_sha256?: string
          uploaded_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_encaminhamento_id_fkey"
            columns: ["encaminhamento_id"]
            isOneToOne: false
            referencedRelation: "encaminhamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {
      auth_perfil: {
        Args: Record<never, never>
        Returns: PerfilUsuario
      }
      gerar_protocolo_iml: {
        Args: Record<never, never>
        Returns: string
      }
    }
    Enums: {
      perfil_usuario: PerfilUsuario
      status_encaminhamento: StatusEncaminhamento
      motivo_encaminhamento: MotivoEncaminhamento
      causa_principal: CausaPrincipal
      subtipo_asfixia: SubtipoAsfixia
      sexo_vitima: SexoVitima
      tipo_instituicao: TipoInstituicao
      acao_auditoria: AcaoAuditoria
      tipo_anexo: TipoAnexo
    }
    CompositeTypes: {}
  }
}
