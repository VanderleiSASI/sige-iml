/**
 * Edge Function: send-password-reset
 * Recuperação de senha com rate limiting
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Rate limiting em memória (em produção, usar Redis ou banco de dados)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutos

function isRateLimited(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record) {
    rateLimitMap.set(key, { count: 1, timestamp: now })
    return false
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, timestamp: now })
    return false
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true
  }

  record.count++
  return false
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Rate limiting
    if (isRateLimited(email)) {
      return new Response(
        JSON.stringify({ 
          message: "Muitas tentativas. Tente novamente em 5 minutos." 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do Supabase incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Verificar se usuário existe (não revelar na resposta)
    const { data: user } = await supabase
      .from("usuarios")
      .select("id, email")
      .eq("email", email)
      .single()

    if (!user) {
      // Retornar sucesso mesmo se não existir (não revelar existência)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Gerar link de recuperação
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
    })

    if (linkError || !linkData) {
      console.error("Erro ao gerar link:", linkError)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Enviar email via send-email
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:3000"
    const resetUrl = `${frontendUrl}/auth/callback?type=recovery&token=${linkData.properties?.hashed_token}`

    const emailBody = `
Olá,

Você solicitou a redefinição de senha do SIGE-IML.

Para criar uma nova senha, acesse o link abaixo:
${resetUrl}

Este link expira em 1 hora.

Se você não solicitou esta redefinição, ignore este email.

---
SIGE-IML - Sistema de Gestão de Encaminhamentos ao IML
Instituto Médico Legal do Amazonas
    `.trim()

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #003366; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #006633; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>SIGE-IML</h2>
      <p>Sistema de Gestão de Encaminhamentos ao IML</p>
    </div>
    <div class="content">
      <h3>Redefinição de Senha</h3>
      <p>Olá,</p>
      <p>Você solicitou a redefinição de senha do SIGE-IML.</p>
      <p>Para criar uma nova senha, clique no botão abaixo:</p>
      <center>
        <a href="${resetUrl}" class="button">Redefinir Senha</a>
      </center>
      <p>Ou copie e cole este link no navegador:</p>
      <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
      <p><strong>Este link expira em 1 hora.</strong></p>
      <p>Se você não solicitou esta redefinição, ignore este email.</p>
    </div>
    <div class="footer">
      <p>Instituto Médico Legal do Amazonas</p>
      <p>Avenida Noel Nutels, 300 - Cidade Nova - Manaus/AM</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Chamar send-email internamente
    const sendEmailResponse = await fetch(
      `${supabaseUrl}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          to: email,
          subject: "SIGE-IML - Redefinição de Senha",
          body: emailBody,
          html: emailHtml,
        }),
      }
    )

    if (!sendEmailResponse.ok) {
      console.error("Erro ao enviar email:", await sendEmailResponse.text())
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Erro:", error)
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
