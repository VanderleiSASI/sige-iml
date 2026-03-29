/**
 * SMTP Client para envio de emails via AWS SES
 * Compatível com Deno/Supabase Edge Functions
 */

export interface SMTPConfig {
  host: string
  port: number
  username: string
  password: string
  from: string
}

export interface EmailMessage {
  to: string
  subject: string
  body: string
  html?: string
}

export class SMTPClient {
  private config: SMTPConfig

  constructor(config: SMTPConfig) {
    this.config = config
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    console.log("📧 Iniciando envio de email")

    // Validações
    if (!this.config.from || !this.config.from.includes('@')) {
      throw new Error(`Email remetente inválido: ${this.config.from}`)
    }

    if (!message.to || !message.to.includes('@')) {
      throw new Error(`Email destinatário inválido: ${message.to}`)
    }

    const conn = await Deno.connect({
      hostname: this.config.host,
      port: this.config.port,
    })

    try {
      // 1. Banner de boas-vindas
      await this.readResponse(conn)

      // 2. EHLO
      await this.sendCommand(conn, `EHLO ${this.config.host}\r\n`)

      // 3. STARTTLS
      await this.sendCommand(conn, "STARTTLS\r\n")

      // 4. Upgrade para TLS
      const tlsConn = await Deno.startTls(conn, {
        hostname: this.config.host,
      })

      // 5. EHLO novamente após TLS
      await this.sendCommand(tlsConn, `EHLO ${this.config.host}\r\n`)

      // 6. Autenticação
      await this.sendCommand(tlsConn, "AUTH LOGIN\r\n")
      const usernameB64 = btoa(this.config.username)
      const passwordB64 = btoa(this.config.password)
      await this.sendCommand(tlsConn, `${usernameB64}\r\n`)
      await this.sendCommand(tlsConn, `${passwordB64}\r\n`)

      // 7. Enviar email
      await this.sendCommand(tlsConn, `MAIL FROM:<${this.config.from}>\r\n`)
      await this.sendCommand(tlsConn, `RCPT TO:<${message.to}>\r\n`)
      await this.sendCommand(tlsConn, "DATA\r\n")

      const emailContent = this.buildMIMEMessage(message)
      await this.sendCommand(tlsConn, emailContent)

      console.log("✓ Email enviado com sucesso")

      // 8. Finalizar
      try {
        await this.sendCommand(tlsConn, "QUIT\r\n")
        await this.readResponse(tlsConn)
      } catch (_) {
        // Ignora erros no QUIT
      }

      tlsConn.close()
    } catch (error) {
      console.error("❌ Erro ao enviar email:", error)
      throw error
    }
  }

  private async sendCommand(conn: Deno.Conn, command: string): Promise<void> {
    const encoder = new TextEncoder()
    await conn.write(encoder.encode(command))
    await this.readResponse(conn)
  }

  private async readResponse(conn: Deno.Conn): Promise<string> {
    const decoder = new TextDecoder()
    const buffer = new Uint8Array(1024)
    const n = await conn.read(buffer)
    if (n === null) throw new Error("Conexão fechada")
    const response = decoder.decode(buffer.subarray(0, n))
    console.log("← SMTP:", response.trim())

    const code = parseInt(response.substring(0, 3))
    if (code >= 400) {
      throw new Error(`SMTP Error ${code}: ${response}`)
    }

    return response
  }

  private buildMIMEMessage(message: EmailMessage): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${this.config.host}>`
    const date = new Date().toUTCString()

    let content = `Message-ID: ${messageId}\r\n`
    content += `Date: ${date}\r\n`
    content += `From: SIGE-IML <${this.config.from}>\r\n`
    content += `To: ${message.to}\r\n`
    content += `Subject: ${message.subject}\r\n`
    content += `MIME-Version: 1.0\r\n`

    if (message.html) {
      content += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`
      content += `\r\n`
      content += `--${boundary}\r\n`
      content += `Content-Type: text/plain; charset=UTF-8\r\n`
      content += `Content-Transfer-Encoding: quoted-printable\r\n`
      content += `\r\n`
      content += `${message.body}\r\n`
      content += `\r\n`
      content += `--${boundary}\r\n`
      content += `Content-Type: text/html; charset=UTF-8\r\n`
      content += `Content-Transfer-Encoding: quoted-printable\r\n`
      content += `\r\n`
      content += `${message.html}\r\n`
      content += `\r\n`
      content += `--${boundary}--\r\n`
    } else {
      content += `Content-Type: text/plain; charset=UTF-8\r\n`
      content += `Content-Transfer-Encoding: quoted-printable\r\n`
      content += `\r\n`
      content += `${message.body}\r\n`
    }

    content += `.\r\n`
    return content
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    console.log("🔍 Testando conexão SMTP...")

    try {
      const conn = await Deno.connect({
        hostname: this.config.host,
        port: this.config.port,
      })

      await this.readResponse(conn)
      await this.sendCommand(conn, `EHLO ${this.config.host}\r\n`)
      await this.sendCommand(conn, "STARTTLS\r\n")

      const tlsConn = await Deno.startTls(conn, {
        hostname: this.config.host,
      })

      await this.sendCommand(tlsConn, `EHLO ${this.config.host}\r\n`)
      await this.sendCommand(tlsConn, "AUTH LOGIN\r\n")
      await this.sendCommand(tlsConn, `${btoa(this.config.username)}\r\n`)
      await this.sendCommand(tlsConn, `${btoa(this.config.password)}\r\n`)

      try {
        await this.sendCommand(tlsConn, "QUIT\r\n")
        await this.readResponse(tlsConn)
      } catch (_) {}

      tlsConn.close()

      return { success: true, message: "Conexão SMTP estabelecida com sucesso" }
    } catch (error) {
      console.error("❌ Falha na conexão SMTP:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }
}
