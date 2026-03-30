'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function atualizarNome(
  nome: string
): Promise<{ sucesso: true } | { erro: string }> {
  if (!nome.trim()) return { erro: 'Nome não pode ser vazio.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado.' }

  const { error } = await supabase
    .from('usuarios')
    .update({ nome: nome.trim() })
    .eq('id', user.id)

  if (error) return { erro: error.message }

  revalidatePath('/perfil')
  return { sucesso: true }
}

export async function alterarSenha(
  senhaAtual: string,
  novaSenha: string
): Promise<{ sucesso: true } | { erro: string }> {
  if (novaSenha.length < 6) return { erro: 'A nova senha deve ter pelo menos 6 caracteres.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { erro: 'Não autenticado.' }

  // Verificar senha atual tentando autenticar
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  })
  if (authError) return { erro: 'Senha atual incorreta.' }

  const { error } = await supabase.auth.updateUser({ password: novaSenha })
  if (error) return { erro: error.message }

  return { sucesso: true }
}
