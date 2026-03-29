/**
 * Edge Function: test-smtp-connection
 * Testa a conexão SMTP sem enviar email
 * Apenas administradores
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { SMTPClient } from "../_shared/smtp-client.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuração incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verificar se é admin
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const jwt = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("perfil")
      .eq("id", user.id)
      .single()

    if (usuario?.perfil !== "administrador") {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem testar a conexão SMTP" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Testar conexão SMTP
    const smtpServer = Deno.env.get("SMTP_SERVER")
    const smtpPort = Deno.env.get("SMTP_PORT")
    const smtpUsername = Deno.env.get("SMTP_USERNAME")
    const smtpPassword = Deno.env.get("SMTP_PASSWORD")
    const smtpSender = Deno.env.get("SMTP_SENDER_EMAIL")

    // Verificar configurações (não revelar valores completos)
    const configStatus = {
      smtp_server: smtpServer ? "✓ Configurado" : "✗ Não configurado",
      smtp_port: smtpPort ? `✓ ${smtpPort}` : "✗ Não configurado",
      smtp_username: smtpUsername ? `✓ ${smtpUsername.substring(0, 5)}...` : "✗ Não configurado",
      smtp_password: smtpPassword ? "✓ Configurado" : "✗ Não configurado",
      smtp_sender: smtpSender ? `✓ ${smtpSender}` : "✗ Não configurado",
    }

    if (!smtpServer || !smtpPort || !smtpUsername || !smtpPassword || !smtpSender) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Configuração SMTP incompleta",
          config: configStatus 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const smtpClient = new SMTPClient({
      host: smtpServer,
      port: parseInt(smtpPort),
      username: smtpUsername,
      password: smtpPassword,
      from: smtpSender,
    })

    const result = await smtpClient.testConnection()

    return new Response(
      JSON.stringify({ 
        success: result.success,
        message: result.message,
        config: configStatus 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Erro:", error)
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
