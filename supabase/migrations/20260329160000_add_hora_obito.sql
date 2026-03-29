-- ============================================================
-- Migration: Adicionar coluna hora_obito
-- Data: 2026-03-29
-- ============================================================

-- Adicionar coluna hora_obito para armazenar a hora separadamente
ALTER TABLE public.encaminhamentos 
ADD COLUMN IF NOT EXISTS hora_obito TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.encaminhamentos.hora_obito IS 'Hora do óbito no formato HH:mm';
