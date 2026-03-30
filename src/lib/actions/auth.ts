'use server'

import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

export async function solicitarRecuperacaoSenha(
  email: string
): Promise<{ sucesso: true }> {
  try {
    const serviceClient = createServiceClient()
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const appUrl = `${protocol}://${host}`

    // generateLink falha silenciosamente se o email não existe
    const { data: linkData } = await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    const token = linkData?.properties?.hashed_token
    if (token) {
      const resetUrl = `${appUrl}/auth/callback?type=recovery&token=${token}`

      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: email,
          subject: 'SIGE-IML — Redefinição de Senha',
          body: `Recebemos uma solicitação para redefinir a senha da sua conta.\n\nClique no link abaixo (expira em 1 hora):\n${resetUrl}\n\nSe você não solicitou a redefinição, ignore este e-mail.\n\n---\nSIGE-IML`,
          html: buildRecoveryHtml(resetUrl),
        }),
      })
    }
  } catch {
    // Não propagar erro — nunca revelar se o email existe ou não
  }

  // Sempre retornar sucesso para prevenir user enumeration
  return { sucesso: true }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildRecoveryHtml(url: string): string {
  const u = escapeHtml(url)
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.wrap{max-width:600px;margin:0 auto;padding:20px}
.hdr{background:#003366;color:white;padding:20px;text-align:center;border-radius:4px 4px 0 0}
.body{padding:24px;background:#f9f9f9}
.btn{display:inline-block;padding:12px 28px;background:#006633;color:white;text-decoration:none;border-radius:4px;margin:20px 0;font-weight:bold}
.ftr{padding:16px;text-align:center;font-size:12px;color:#888}
</style></head><body>
<div class="wrap">
<div class="hdr"><h2 style="margin:0">SIGE-IML</h2><p style="margin:4px 0 0;font-size:13px">Sistema de Gestão de Encaminhamentos ao IML</p></div>
<div class="body">
<h3>Redefinição de Senha</h3>
<p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
<p>Clique no botão abaixo para criar uma nova senha:</p>
<center><a href="${u}" class="btn">Redefinir Senha</a></center>
<p style="font-size:12px;color:#666;word-break:break-all">Ou copie: ${u}</p>
<p><strong>Este link expira em 1 hora.</strong></p>
<p style="font-size:12px;color:#888">Se você não solicitou a redefinição, ignore este e-mail.</p>
</div>
<div class="ftr">Instituto Médico Legal "Dr. Antônio Hosannah da Silva Filho"<br>Avenida Noel Nutels, 300 – Cidade Nova – Manaus/AM</div>
</div></body></html>`
}
