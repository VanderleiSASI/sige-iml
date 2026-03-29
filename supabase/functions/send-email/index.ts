/**
 * Edge Function: send-email
 * Envio genérico de emails - uso interno apenas (service_role_key)
 */

import { SMTPClient } from "../_shared/smtp-client.ts"

interface SendEmailRequest {
  to: string
  subject: string
  body: string
  html?: string
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Verificar service_role_key (apenas uso interno)
    const authHeader = req.headers.get("authorization")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if (!authHeader || !serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
      return new Response(
        JSON.stringify({ error: "Acesso não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { to, subject, body, html }: SendEmailRequest = await req.json()

    // Validações
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: to, subject, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Configurações SMTP
    const smtpServer = Deno.env.get("SMTP_SERVER")
    const smtpPort = Deno.env.get("SMTP_PORT")
    const smtpUsername = Deno.env.get("SMTP_USERNAME")
    const smtpPassword = Deno.env.get("SMTP_PASSWORD")
    const smtpSender = Deno.env.get("SMTP_SENDER_EMAIL")

    if (!smtpServer || !smtpPort || !smtpUsername || !smtpPassword || !smtpSender) {
      return new Response(
        JSON.stringify({ error: "Configuração SMTP incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const smtpClient = new SMTPClient({
      host: smtpServer,
      port: parseInt(smtpPort),
      username: smtpUsername,
      password: smtpPassword,
      from: smtpSender,
    })

    await smtpClient.sendEmail({ to, subject, body, html })

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao enviar email" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
