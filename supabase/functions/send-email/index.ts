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

/**
 * Verifica JWT assinatura via HMAC-SHA256 e checa role=service_role.
 * SUPABASE_JWT_SECRET está disponível automaticamente no runtime Deno do Supabase.
 */
async function isServiceRole(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false
  const token = authHeader.slice(7)

  const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET")
  if (!jwtSecret) return false

  try {
    const parts = token.split(".")
    if (parts.length !== 3) return false

    const [headerB64, payloadB64, signatureB64] = parts

    // Importar chave HMAC para verificação
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )

    // Converter base64url → base64 → Uint8Array
    const base64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/")
    const signature = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

    // Verificar assinatura sobre "header.payload"
    const signingInput = `${headerB64}.${payloadB64}`
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(signingInput)
    )
    if (!valid) return false

    // Decodificar payload somente após assinatura confirmada
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    const payload = JSON.parse(payloadJson)
    return payload?.role === "service_role"
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Verificar que o token tem role=service_role com assinatura válida
    const authHeader = req.headers.get("authorization")
    if (!(await isServiceRole(authHeader))) {
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
