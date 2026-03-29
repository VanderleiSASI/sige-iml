-- ============================================================
-- SIGE-IML — Schema inicial
-- Gerado em: 2026-03-29
-- ============================================================

-- ============================================================
-- TIPOS ENUM
-- ============================================================

CREATE TYPE perfil_usuario AS ENUM (
  'administrador',
  'gestor_iml',
  'medico',
  'auditor'
);

CREATE TYPE status_encaminhamento AS ENUM (
  'rascunho',
  'confirmado',
  'recebido_iml',
  'cancelado'
);

CREATE TYPE motivo_encaminhamento AS ENUM (
  'morte_violenta',
  'morte_suspeita'
);

CREATE TYPE causa_principal AS ENUM (
  'arma_de_fogo',
  'arma_branca',
  'asfixia',
  'queimadura',
  'acidente_transito',
  'afogamento',
  'envenenamento',
  'espancamento',
  'outros'
);

CREATE TYPE subtipo_asfixia AS ENUM (
  'enforcamento',
  'estrangulamento',
  'esganadura',
  'afogamento',
  'soterramento'
);

CREATE TYPE sexo_vitima AS ENUM (
  'masculino',
  'feminino',
  'indeterminado'
);

CREATE TYPE tipo_instituicao AS ENUM (
  'hospital_ps',
  'spa',
  'maternidade',
  'outro'
);

CREATE TYPE acao_auditoria AS ENUM (
  'criacao',
  'atualizacao',
  'confirmacao',
  'cancelamento',
  'recepcao_iml',
  'geracao_pdf',
  'visualizacao'
);

CREATE TYPE tipo_anexo AS ENUM (
  'identificacao',
  'exame',
  'boletim_ocorrencia',
  'outro'
);

-- ============================================================
-- TABELA: instituicoes
-- ============================================================

CREATE TABLE public.instituicoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                TEXT NOT NULL,
  tipo                tipo_instituicao NOT NULL,
  tipo_outro          TEXT,
  endereco            TEXT,
  municipio           TEXT NOT NULL DEFAULT 'Manaus',
  uf                  CHAR(2) NOT NULL DEFAULT 'AM',
  telefone            TEXT,
  responsavel_tecnico TEXT,
  ativo               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_instituicoes_nome ON public.instituicoes (nome);

-- ============================================================
-- TABELA: usuarios (espelha auth.users)
-- ============================================================

CREATE TABLE public.usuarios (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil       perfil_usuario NOT NULL DEFAULT 'medico',
  nome         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  ativo        BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_login TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: medicos (vinculados a instituicoes)
-- ============================================================

CREATE TABLE public.medicos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  nome           TEXT NOT NULL,
  crm            TEXT NOT NULL,
  crm_uf         CHAR(2) NOT NULL DEFAULT 'AM',
  especialidade  TEXT,
  contato        TEXT,
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (crm, crm_uf)
);

CREATE INDEX idx_medicos_instituicao ON public.medicos (instituicao_id);
CREATE INDEX idx_medicos_crm ON public.medicos (crm);

-- ============================================================
-- TABELA auxiliar: protocolo_sequencia
-- Garante protocolo único por ano de forma atômica
-- ============================================================

CREATE TABLE public.protocolo_sequencia (
  ano    INTEGER PRIMARY KEY,
  ultimo INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- FUNÇÃO: gerar_protocolo_iml()
-- Formato: IML-AAAA-NNNNNN (sequência reinicia por ano)
-- Usa INSERT ON CONFLICT para garantir atomicidade sem LOCK
-- ============================================================

CREATE OR REPLACE FUNCTION public.gerar_protocolo_iml()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ano INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_seq INTEGER;
BEGIN
  INSERT INTO public.protocolo_sequencia (ano, ultimo)
  VALUES (v_ano, 1)
  ON CONFLICT (ano) DO UPDATE
    SET ultimo = protocolo_sequencia.ultimo + 1
  RETURNING ultimo INTO v_seq;

  RETURN 'IML-' || v_ano::TEXT || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

-- ============================================================
-- TABELA: encaminhamentos (registro central)
-- ============================================================

CREATE TABLE public.encaminhamentos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT UNIQUE,
  status    status_encaminhamento NOT NULL DEFAULT 'rascunho',
  versao    INTEGER NOT NULL DEFAULT 1,

  -- Autoria
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Dados da instituição (desnormalizados para imutabilidade histórica)
  instituicao_id   UUID REFERENCES public.instituicoes(id),
  instituicao_nome TEXT NOT NULL,
  instituicao_tipo tipo_instituicao,
  medico_id        UUID REFERENCES public.medicos(id),
  medico_nome      TEXT NOT NULL,
  medico_crm       TEXT NOT NULL,
  motivo           motivo_encaminhamento NOT NULL,

  -- Causa da morte
  causa_principal          causa_principal NOT NULL,
  causa_detalhes           TEXT,
  subtipo_asfixia          subtipo_asfixia,
  envenenamento_substancias TEXT[],
  descricao_suspeita        TEXT,

  -- Identificação do corpo
  identificado             BOOLEAN NOT NULL DEFAULT TRUE,
  nome_falecido            TEXT,
  cpf                      TEXT,
  rg                       TEXT,
  data_nascimento          DATE,
  sexo                     sexo_vitima NOT NULL DEFAULT 'indeterminado',
  nacionalidade            TEXT DEFAULT 'Brasileira',
  naturalidade             TEXT,
  filiacao_mae             TEXT,
  filiacao_pai             TEXT,
  profissao                TEXT,
  endereco_vitima          TEXT,
  contato_familiar_nome    TEXT,
  contato_familiar_parentesco TEXT,
  contato_familiar_telefone TEXT,
  caracteristicas_fisicas  TEXT,
  vestimentas_objetos      TEXT,

  -- Dados do atendimento
  recebeu_atendimento      BOOLEAN NOT NULL DEFAULT FALSE,
  data_admissao            TIMESTAMPTZ,
  houve_internacao         BOOLEAN,
  data_obito               TIMESTAMPTZ NOT NULL,
  houve_transfusao         BOOLEAN,
  descricao_transfusao     TEXT,

  -- Campos condicionais: arma de fogo
  arma_fogo_exame_imagem   BOOLEAN,
  arma_fogo_tipo_exame     TEXT,
  arma_fogo_cirurgia       BOOLEAN,
  arma_fogo_desc_cirurgia  TEXT,
  arma_fogo_projeteis_loc  BOOLEAN,
  arma_fogo_projeteis_qtd  INTEGER,
  arma_fogo_projeteis_rec  BOOLEAN,
  arma_fogo_projeteis_dest TEXT,

  -- Finalização
  outras_informacoes       TEXT,
  cidade_preenchimento     TEXT NOT NULL DEFAULT 'Manaus',
  data_preenchimento       DATE NOT NULL DEFAULT CURRENT_DATE,
  justificativa_cancelamento TEXT,

  -- Integridade
  hash_integridade         TEXT,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Restrições de negócio
  CONSTRAINT chk_datas_consistentes CHECK (
    (data_admissao IS NULL OR data_admissao <= data_obito)
  ),
  CONSTRAINT chk_identificado_fisicas CHECK (
    identificado = TRUE OR caracteristicas_fisicas IS NOT NULL
  ),
  CONSTRAINT chk_cancelamento_justificativa CHECK (
    status != 'cancelado' OR justificativa_cancelamento IS NOT NULL
  ),
  CONSTRAINT chk_protocolo_confirmado CHECK (
    status = 'rascunho' OR protocolo IS NOT NULL
  ),
  CONSTRAINT chk_arma_fogo_campos CHECK (
    causa_principal != 'arma_de_fogo' OR (
      arma_fogo_exame_imagem IS NOT NULL AND
      arma_fogo_cirurgia IS NOT NULL AND
      arma_fogo_projeteis_loc IS NOT NULL
    )
  )
);

CREATE INDEX idx_enc_created_by   ON public.encaminhamentos (created_by);
CREATE INDEX idx_enc_status       ON public.encaminhamentos (status);
CREATE INDEX idx_enc_data_obito   ON public.encaminhamentos (data_obito DESC);
CREATE INDEX idx_enc_protocolo    ON public.encaminhamentos (protocolo) WHERE protocolo IS NOT NULL;
CREATE INDEX idx_enc_instituicao  ON public.encaminhamentos (instituicao_id);
CREATE INDEX idx_enc_causa        ON public.encaminhamentos (causa_principal);
CREATE INDEX idx_enc_motivo       ON public.encaminhamentos (motivo);

-- ============================================================
-- TABELA: auditoria_logs (append-only)
-- ============================================================

CREATE TABLE public.auditoria_logs (
  id                BIGSERIAL PRIMARY KEY,
  encaminhamento_id UUID REFERENCES public.encaminhamentos(id) ON DELETE SET NULL,
  usuario_id        UUID REFERENCES auth.users(id),
  acao              acao_auditoria NOT NULL,
  ip                INET,
  user_agent        TEXT,
  dados_anteriores  JSONB,
  dados_novos       JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_encaminhamento ON public.auditoria_logs (encaminhamento_id);
CREATE INDEX idx_audit_usuario        ON public.auditoria_logs (usuario_id);
CREATE INDEX idx_audit_created_at     ON public.auditoria_logs (created_at DESC);
CREATE INDEX idx_audit_acao           ON public.auditoria_logs (acao);

-- ============================================================
-- TABELA: anexos
-- ============================================================

CREATE TABLE public.anexos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encaminhamento_id UUID NOT NULL REFERENCES public.encaminhamentos(id) ON DELETE RESTRICT,
  tipo              tipo_anexo NOT NULL,
  nome_original     TEXT NOT NULL,
  storage_path      TEXT NOT NULL UNIQUE,
  mime_type         TEXT NOT NULL,
  tamanho_bytes     BIGINT NOT NULL,
  hash_sha256       TEXT NOT NULL,
  uploaded_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anexos_encaminhamento ON public.anexos (encaminhamento_id);

-- ============================================================
-- FUNÇÃO: set_updated_at() — trigger genérico
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_instituicoes_updated_at
  BEFORE UPDATE ON public.instituicoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_medicos_updated_at
  BEFORE UPDATE ON public.medicos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_encaminhamentos_updated_at
  BEFORE UPDATE ON public.encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TRIGGER: gerar protocolo ao confirmar
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_gerar_protocolo_ao_confirmar()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'confirmado'
     AND (OLD.status IS NULL OR OLD.status = 'rascunho')
     AND NEW.protocolo IS NULL THEN
    NEW.protocolo := public.gerar_protocolo_iml();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protocolo_ao_confirmar
  BEFORE UPDATE ON public.encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_protocolo_ao_confirmar();

-- ============================================================
-- TRIGGER: auditoria automática em encaminhamentos
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_audit_encaminhamento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_acao acao_auditoria;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_acao := 'criacao';
    INSERT INTO public.auditoria_logs (encaminhamento_id, usuario_id, acao, dados_novos)
    VALUES (NEW.id, NEW.created_by, v_acao, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detectar ação semântica pela mudança de status
    IF NEW.status != OLD.status THEN
      CASE NEW.status
        WHEN 'confirmado'    THEN v_acao := 'confirmacao';
        WHEN 'cancelado'     THEN v_acao := 'cancelamento';
        WHEN 'recebido_iml'  THEN v_acao := 'recepcao_iml';
        ELSE v_acao := 'atualizacao';
      END CASE;
    ELSE
      v_acao := 'atualizacao';
    END IF;

    -- Incrementar versão a cada UPDATE
    NEW.versao := OLD.versao + 1;

    INSERT INTO public.auditoria_logs
      (encaminhamento_id, usuario_id, acao, dados_anteriores, dados_novos)
    VALUES
      (NEW.id, auth.uid(), v_acao, to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_encaminhamento
  BEFORE INSERT OR UPDATE ON public.encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_encaminhamento();

-- ============================================================
-- TRIGGER: sincronizar usuarios com auth.users no signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_novo_usuario_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'perfil')::perfil_usuario,
      'medico'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_novo_usuario_auth
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_novo_usuario_auth();

-- ============================================================
-- FUNÇÃO auxiliar: auth_perfil() — retorna o perfil do usuário logado
-- SECURITY DEFINER para uso nas RLS policies
-- ============================================================

CREATE OR REPLACE FUNCTION public.auth_perfil()
RETURNS perfil_usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT perfil FROM public.usuarios WHERE id = auth.uid()
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.instituicoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encaminhamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos           ENABLE ROW LEVEL SECURITY;

-- ── INSTITUICOES ──────────────────────────────────────────────

CREATE POLICY "inst_leitura_autenticados" ON public.instituicoes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "inst_escrita_admin" ON public.instituicoes
  FOR ALL USING (public.auth_perfil() = 'administrador')
  WITH CHECK (public.auth_perfil() = 'administrador');

-- ── USUARIOS ──────────────────────────────────────────────────

CREATE POLICY "usuarios_proprio_select" ON public.usuarios
  FOR SELECT USING (
    id = auth.uid()
    OR public.auth_perfil() IN ('administrador', 'gestor_iml', 'auditor')
  );

CREATE POLICY "usuarios_proprio_update" ON public.usuarios
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_admin_all" ON public.usuarios
  FOR ALL USING (public.auth_perfil() = 'administrador')
  WITH CHECK (public.auth_perfil() = 'administrador');

-- ── MEDICOS ───────────────────────────────────────────────────

CREATE POLICY "medicos_leitura_autenticados" ON public.medicos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "medicos_escrita_admin_gestor" ON public.medicos
  FOR ALL USING (public.auth_perfil() IN ('administrador', 'gestor_iml'))
  WITH CHECK (public.auth_perfil() IN ('administrador', 'gestor_iml'));

-- ── ENCAMINHAMENTOS ───────────────────────────────────────────

-- Médico: CRUD apenas dos próprios (só edita rascunhos)
CREATE POLICY "enc_medico_select" ON public.encaminhamentos
  FOR SELECT USING (
    public.auth_perfil() = 'medico' AND created_by = auth.uid()
  );

CREATE POLICY "enc_medico_insert" ON public.encaminhamentos
  FOR INSERT WITH CHECK (
    public.auth_perfil() = 'medico' AND created_by = auth.uid()
  );

CREATE POLICY "enc_medico_update" ON public.encaminhamentos
  FOR UPDATE USING (
    public.auth_perfil() = 'medico'
    AND created_by = auth.uid()
    AND status = 'rascunho'
  );

-- Gestor IML: leitura total + pode atualizar status
CREATE POLICY "enc_gestor_select" ON public.encaminhamentos
  FOR SELECT USING (public.auth_perfil() = 'gestor_iml');

CREATE POLICY "enc_gestor_update" ON public.encaminhamentos
  FOR UPDATE USING (public.auth_perfil() = 'gestor_iml')
  WITH CHECK (public.auth_perfil() = 'gestor_iml');

-- Administrador: acesso total
CREATE POLICY "enc_admin_all" ON public.encaminhamentos
  FOR ALL USING (public.auth_perfil() = 'administrador')
  WITH CHECK (public.auth_perfil() = 'administrador');

-- Auditor: somente leitura
CREATE POLICY "enc_auditor_select" ON public.encaminhamentos
  FOR SELECT USING (public.auth_perfil() = 'auditor');

-- ── AUDITORIA_LOGS ────────────────────────────────────────────

-- INSERT via triggers SECURITY DEFINER — clientes não inserem diretamente
CREATE POLICY "audit_insert_sistema" ON public.auditoria_logs
  FOR INSERT WITH CHECK (FALSE);

-- Leitura: admin, gestor_iml e auditor veem tudo
CREATE POLICY "audit_select_gestores" ON public.auditoria_logs
  FOR SELECT USING (
    public.auth_perfil() IN ('administrador', 'gestor_iml', 'auditor')
  );

-- Médico: vê apenas logs dos próprios encaminhamentos
CREATE POLICY "audit_select_medico" ON public.auditoria_logs
  FOR SELECT USING (
    public.auth_perfil() = 'medico'
    AND encaminhamento_id IN (
      SELECT id FROM public.encaminhamentos WHERE created_by = auth.uid()
    )
  );

-- UPDATE e DELETE sempre bloqueados (imutabilidade)
CREATE POLICY "audit_no_update" ON public.auditoria_logs
  FOR UPDATE USING (FALSE);

CREATE POLICY "audit_no_delete" ON public.auditoria_logs
  FOR DELETE USING (FALSE);

-- ── ANEXOS ────────────────────────────────────────────────────

CREATE POLICY "anexos_admin_gestor" ON public.anexos
  FOR ALL USING (public.auth_perfil() IN ('administrador', 'gestor_iml'))
  WITH CHECK (public.auth_perfil() IN ('administrador', 'gestor_iml'));

CREATE POLICY "anexos_medico_proprios" ON public.anexos
  FOR ALL USING (
    public.auth_perfil() = 'medico'
    AND uploaded_by = auth.uid()
  )
  WITH CHECK (
    public.auth_perfil() = 'medico'
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "anexos_auditor_select" ON public.anexos
  FOR SELECT USING (public.auth_perfil() = 'auditor');
