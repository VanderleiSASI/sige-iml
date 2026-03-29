-- ============================================================
-- Migration: Corrigir trigger de auditoria
-- O trigger deve ser AFTER INSERT, não BEFORE INSERT
-- ============================================================

-- Remover trigger existente
DROP TRIGGER IF EXISTS trg_audit_encaminhamento ON public.encaminhamentos;

-- Recriar a função (mesma lógica, mas ajustada)
CREATE OR REPLACE FUNCTION public.fn_audit_encaminhamento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_acao acao_auditoria;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_acao := 'criacao';
    INSERT INTO public.auditoria_logs (encaminhamento_id, usuario_id, acao, dados_novos)
    VALUES (NEW.id, NEW.created_by, v_acao, to_jsonb(NEW));
    RETURN NEW;
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
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Criar trigger como AFTER INSERT (não BEFORE)
CREATE TRIGGER trg_audit_encaminhamento
  AFTER INSERT OR UPDATE ON public.encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_encaminhamento();
