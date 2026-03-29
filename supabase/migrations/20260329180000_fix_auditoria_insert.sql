-- ============================================================
-- Migration: Permitir inserção em auditoria_logs via função
-- ============================================================

-- Criar função para registrar auditoria (ignora RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.registrar_auditoria(
  p_encaminhamento_id UUID,
  p_acao acao_auditoria,
  p_dados_anteriores JSONB DEFAULT NULL,
  p_dados_novos JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.auditoria_logs (
    encaminhamento_id,
    usuario_id,
    acao,
    dados_anteriores,
    dados_novos
  ) VALUES (
    p_encaminhamento_id,
    auth.uid(),
    p_acao,
    p_dados_anteriores,
    p_dados_novos
  );
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.registrar_auditoria IS 'Registra um evento de auditoria, ignorando as políticas RLS da tabela auditoria_logs';
