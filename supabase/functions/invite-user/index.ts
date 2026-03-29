/**
 * Edge Function: invite-user
 * Convite de novos usuários com email customizado
 * Apenas administradores podem usar
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

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

    const { email, nome, perfil = "medico" } = await req.json()

    if (!email || !nome || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Verificar se quem chama é admin
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Extrair token JWT
    const jwt = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verificar perfil do usuário
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("perfil")
      .eq("id", user.id)
      .single()

    if (usuario?.perfil !== "administrador") {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem convidar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Criar usuário no Auth
    const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nome, perfil },
    })

    if (createError) {
      if (createError.message.includes("already registered")) {
        return new Response(
          JSON.stringify({ error: "Já existe um usuário com este email" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      throw createError
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Gerar link de recuperação de senha
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
    })

    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:3000"
    const setupUrl = linkData?.properties?.hashed_token 
      ? `${frontendUrl}/auth/callback?type=recovery&token=${linkData.properties.hashed_token}`
      : `${frontendUrl}/login`

    // Enviar email de convite
    const emailBody = `
Olá ${nome},

Você foi convidado(a) para acessar o SIGE-IML - Sistema de Gestão de Encaminhamentos ao Instituto Médico Legal do Amazonas.

Perfil: ${perfil.toUpperCase()}

Para acessar o sistema e definir sua senha, clique no link abaixo:
${setupUrl}

Este link expira em 1 hora.

Em caso de dúvidas, entre em contato com o administrador do sistema.

---
SIGE-IML
Instituto Médico Legal "Dr. Antônio Hosannah da Silva Filho"
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
    .perfil { background: #e0e0e0; padding: 8px 16px; border-radius: 4px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>SIGE-IML</h2>
      <p>Sistema de Gestão de Encaminhamentos ao IML</p>
    </div>
    <div class="content">
      <h3>Bem-vindo(a)!</h3>
      <p>Olá <strong>${nome}</strong>,</p>
      <p>Você foi convidado(a) para acessar o SIGE-IML.</p>
      
      <div class="perfil">
        <strong>Perfil:</strong> ${perfil.toUpperCase()}
      </div>
      
      <p>Para acessar o sistema e definir sua senha, clique no botão abaixo:</p>
      <center>
        <a href="${setupUrl}" class="button">Acessar o Sistema</a>
      </center>
      
      <p>Ou copie e cole este link no navegador:</p>
      <p style="word-break: break-all; font-size: 12px; color: #666;">${setupUrl}</p>
      
      <p><strong>Este link expira em 1 hora.</strong></p>
      <p>Em caso de dúvidas, entre em contato com o administrador.</p>
    </div>
    <div class="footer">
      <p>Instituto Médico Legal "Dr. Antônio Hosannah da Silva Filho"</p>
      <p>Avenida Noel Nutels, 300 - Cidade Nova - Manaus/AM</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        to: email,
        subject: "SIGE-IML - Convite de Acesso",
        body: emailBody,
        html: emailHtml,
      }),
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Usuário convidado com sucesso",
        userId: newUser.user.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Erro:", error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao convidar usuário" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
