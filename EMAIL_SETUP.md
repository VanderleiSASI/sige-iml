# 📧 Configuração do Serviço de Email (AWS SES)

Este documento descreve como configurar o envio de emails no SIGE-IML usando AWS SES SMTP.

## Funcionalidades Implementadas

1. **Recuperação de Senha** (`send-password-reset`)
   - Rate limiting: 3 tentativas por email a cada 5 minutos
   - Não revela se o email existe (segurança)
   - Email com template profissional

2. **Convite de Usuários** (`invite-user`)
   - Apenas administradores podem convidar
   - Cria usuário no Auth automaticamente
   - Envia link para definição de senha

3. **Teste de Conexão** (`test-smtp-connection`)
   - Apenas administradores
   - Verifica configurações SMTP sem enviar email

## Configuração na AWS

### 1. Criar conta no AWS SES

1. Acesse: https://aws.amazon.com/ses/
2. Crie uma conta ou use uma existente
3. Verifique um domínio ou email para envio

### 2. Gerar credenciais SMTP

1. No console SES, vá em **SMTP Settings**
2. Clique em **Create SMTP credentials**
3. Anote:
   - **SMTP Username** (começa com AKIA...)
   - **SMTP Password**

### 3. Verificar email de envio

1. Em SES, vá em **Verified identities**
2. Adicione o email que será usado como remetente
3. Confirme o email recebido

> **Importante:** Em modo sandbox, você só pode enviar para emails verificados. Para produção, solicite saída do sandbox.

## Configuração no Supabase

### 1. Deploy das Edge Functions

```bash
# Instalar Supabase CLI se não tiver
npm install -g supabase

# Fazer login
supabase login

# Linkar projeto (se ainda não estiver linkado)
supabase link --project-ref fheupqnihgyekxrxcdtz

# Deploy das funções
supabase functions deploy send-email
supabase functions deploy send-password-reset
supabase functions deploy invite-user
supabase functions deploy test-smtp-connection
```

### 2. Configurar Secrets

No dashboard do Supabase (https://supabase.com/dashboard/project/fheupqnihgyekxrxcdtz/settings/functions):

Adicione estas secrets:

| Secret | Valor | Exemplo |
|--------|-------|---------|
| `SMTP_SERVER` | Endpoint SMTP SES | `email-smtp.us-east-1.amazonaws.com` |
| `SMTP_PORT` | Porta SMTP | `587` |
| `SMTP_USERNAME` | Username SES | `AKIA...` |
| `SMTP_PASSWORD` | Senha SES | `BDsa...` |
| `SMTP_SENDER_EMAIL` | Email verificado | `noreply@seudominio.com` |
| `FRONTEND_URL` | URL do frontend | `https://sige-iml.vercel.app` |

Ou via CLI:

```bash
supabase secrets set SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USERNAME=SEU_USERNAME
supabase secrets set SMTP_PASSWORD=SUA_SENHA
supabase secrets set SMTP_SENDER_EMAIL=noreply@seudominio.com
supabase secrets set FRONTEND_URL=https://sige-iml.vercel.app
```

## Testando a Configuração

### Testar via Dashboard

1. Acesse: https://supabase.com/dashboard/project/fheupqnihgyekxrxcdtz/functions
2. Selecione `test-smtp-connection`
3. Clique em **Invoke**
4. Verifique se retorna "Conexão SMTP estabelecida com sucesso"

### Testar via API

```bash
curl -X POST \
  https://fheupqnihgyekxrxcdtz.supabase.co/functions/v1/test-smtp-connection \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

## Uso no Frontend

### Recuperação de Senha

```typescript
import { requestPasswordReset } from '@/lib/services/email'

const resultado = await requestPasswordReset('usuario@email.com')
if (resultado.success) {
  toast.success(resultado.message)
}
```

### Convite de Usuário

```typescript
import { inviteUser } from '@/lib/services/email'

const resultado = await inviteUser(
  'novo@email.com', 
  'Nome do Usuário', 
  'medico'
)
if (resultado.success) {
  toast.success('Convite enviado!')
}
```

### Testar Conexão

```typescript
import { testSMTPConnection } from '@/lib/services/email'

const resultado = await testSMTPConnection()
console.log(resultado.config) // Status das configurações
```

## Troubleshooting

### Erro: "Configuração SMTP incompleta"

- Verifique se todas as secrets estão configuradas
- Verifique se os nomes das secrets estão corretos

### Erro: "SMTP Error 535"

- Credenciais SMTP incorretas
- Gere novas credenciais no console SES

### Erro: "SMTP Error 554"

- Email remetente não verificado
- Verifique o email em SES > Verified identities

### Emails não chegam

- Verifique pasta de spam
- Em sandbox, destinatário deve estar verificado
- Verifique logs da função no Supabase

## Segurança

- ✅ Secrets SMTP nunca são expostas no frontend
- ✅ Apenas service_role_key pode chamar send-email
- ✅ Rate limiting em recuperação de senha
- ✅ Verificação de perfil admin em funções sensíveis
- ✅ Não revela existência de email (timing attack protection)

## Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend      │────▶│  Edge Functions  │────▶│  AWS SES    │
│                 │     │                  │     │             │
│ requestPassword │     │ send-password-   │     │ SMTP Server │
│    Reset()      │     │    reset         │     │             │
│                 │     │                  │     │             │
│   inviteUser()  │────▶│  invite-user     │────▶│             │
│                 │     │                  │     │             │
└─────────────────┘     └──────────────────┘     └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │  send-email │
                        │  (interno)  │
                        └─────────────┘
```

## Suporte

Em caso de problemas:
1. Verifique logs no Supabase Dashboard > Functions > Logs
2. Teste a conexão SMTP usando `test-smtp-connection`
3. Verifique se as credenciais SES estão ativas
4. Confirme que o email remetente está verificado
