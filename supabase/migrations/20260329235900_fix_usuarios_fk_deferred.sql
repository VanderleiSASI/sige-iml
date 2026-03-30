-- ============================================================
-- Migration: Corrigir FK de public.usuarios para DEFERRABLE
-- Problema: FK IMMEDIATE falha dentro de AFTER trigger porque
-- o PostgreSQL não consegue ver o auth.users row no momento
-- exato do INSERT dentro do trigger (condição de visibilidade).
-- Solução: FK DEFERRABLE INITIALLY DEFERRED → verificado no commit.
-- ============================================================

-- Recriar FK como DEFERRABLE INITIALLY DEFERRED
ALTER TABLE public.usuarios
  DROP CONSTRAINT usuarios_id_fkey;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- Atualizar trigger para usar ON CONFLICT DO NOTHING (sem alvo)
-- Isso cobre conflito tanto no id (PK) quanto no email (UNIQUE)
CREATE OR REPLACE FUNCTION public.fn_novo_usuario_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nome         TEXT;
  v_perfil       TEXT;
  v_perfil_valido perfil_usuario;
BEGIN
  v_nome   := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
  v_perfil := NEW.raw_user_meta_data->>'perfil';

  IF v_perfil IS NOT NULL
     AND v_perfil = ANY(ARRAY['administrador','gestor_iml','medico','auditor']::text[])
  THEN
    v_perfil_valido := v_perfil::perfil_usuario;
  ELSE
    v_perfil_valido := 'medico';
  END IF;

  INSERT INTO public.usuarios (id, nome, email, perfil)
  VALUES (NEW.id, v_nome, NEW.email, v_perfil_valido)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'fn_novo_usuario_auth erro: % (SQLSTATE %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;
