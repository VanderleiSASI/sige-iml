/**
 * Serviço de Email - Cliente para as Edge Functions
 * Integração com AWS SES via Supabase Edge Functions
 */

import { createClient } from '@/lib/supabase/client'

export interface EmailResult {
  success: boolean
  message?: string
  error?: string
  userId?: string
}

export interface SMTPTestResult {
  success: boolean
  message: string
  config?: Record<string, string>
}

/**
 * Solicita recuperação de senha
 */
export async function requestPasswordReset(email: string): Promise<EmailResult> {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-password-reset`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
      },
      body: JSON.stringify({ email }),
    }
  )

  const data = await response.json()
  
  if (!response.ok && response.status !== 429) {
    return { success: false, error: data.error || 'Erro ao solicitar recuperação' }
  }

  return { 
    success: true, 
    message: data.message || 'Se este email estiver cadastrado, você receberá instruções.' 
  }
}

/**
 * Convidar novo usuário (apenas admin)
 */
export async function inviteUser(
  email: string, 
  nome: string, 
  perfil: string = 'medico'
): Promise<EmailResult> {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    return { success: false, error: 'Não autenticado' }
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email, nome, perfil }),
    }
  )

  const data = await response.json()
  
  if (!response.ok) {
    return { success: false, error: data.error || 'Erro ao convidar usuário' }
  }

  return { 
    success: true, 
    message: data.message,
    userId: data.userId
  }
}

/**
 * Testar conexão SMTP (apenas admin)
 */
export async function testSMTPConnection(): Promise<SMTPTestResult> {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    return { success: false, message: 'Não autenticado' }
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/test-smtp-connection`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    }
  )

  const data = await response.json()
  
  return {
    success: data.success,
    message: data.message,
    config: data.config
  }
}
