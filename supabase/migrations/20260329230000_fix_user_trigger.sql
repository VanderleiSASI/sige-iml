-- ============================================================
-- Migration: Corrigir trigger de criação de usuários
-- Adiciona tratamento de erro e logging
-- ============================================================

-- Remover trigger existente
DROP TRIGGER IF EXISTS trg_novo_usuario_auth ON auth.users;

-- Recriar função com tratamento de erro
CREATE OR REPLACE FUNCTION public.fn_novo_usuario_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nome TEXT;
  v_perfil TEXT;
  v_perfil_valido perfil_usuario;
BEGIN
  -- Extrair nome
  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
  
  -- Extrair e validar perfil
  v_perfil := NEW.raw_user_meta_data->>'perfil';
  
  -- Validar se o perfil é válido, senão usar 'medico' como padrão
  IF v_perfil IS NOT NULL AND v_perfil = ANY(ARRAY['administrador', 'gestor_iml', 'medico', 'auditor']::text[]) THEN
    v_perfil_valido := v_perfil::perfil_usuario;
  ELSE
    v_perfil_valido := 'medico';
  END IF;
  
  -- Inserir na tabela usuários
  INSERT INTO public.usuarios (id, nome, email, perfil)
  VALUES (NEW.id, v_nome, NEW.email, v_perfil_valido)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro (aparece nos logs do PostgreSQL)
    RAISE WARNING 'Erro no trigger fn_novo_usuario_auth: % - %', SQLERRM, SQLSTATE;
    -- Ainda retorna NEW para não bloquear a criação do usuário no auth
    RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER trg_novo_usuario_auth
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_novo_usuario_auth();

-- Comentário
COMMENT ON FUNCTION public.fn_novo_usuario_auth IS 'Sincroniza auth.users com public.usuarios, com tratamento de erro';
