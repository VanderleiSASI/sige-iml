# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

**SIGE-IML** — Sistema de Gestão de Encaminhamentos ao Instituto Médico Legal do Amazonas.

Digitalização da "Ficha de Encaminhamento de Cadáver ao IML" do Departamento de Polícia Técnico-Científica do Estado do Amazonas (IML "Dr. Antônio Hosannah da Silva Filho"). O sistema cobre cadastro de encaminhamentos, geração de PDF oficial, dashboard com KPIs, relatórios institucionais, gestão de usuários e trilha de auditoria.

## Runtime e Dependências

- **Node.js**: v20+ (único runtime — sem Python, sem Xcode, sem dependências nativas)
- **Gerenciador de pacotes**: npm

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15+ (App Router) |
| Banco de dados | Supabase (PostgreSQL) |
| Auth | Supabase Auth + `@supabase/ssr` |
| Storage | Supabase Storage (anexos PDF/imagem) |
| Estilo | Tailwind CSS + shadcn/ui |
| PDF | jsPDF + html2canvas (client-side) |
| Gráficos | Recharts |
| Deploy | Vercel |
| Idioma | Português Brasileiro em toda a interface |

## Comandos

```bash
npm install          # instalar dependências
npm run dev          # servidor de desenvolvimento (http://localhost:3000)
npm run build        # build de produção (inclui type-check)
npm run lint         # ESLint
npx tsc --noEmit     # type-check sem build

# Supabase CLI (após instalar: npm i -g supabase)
supabase start                        # banco local (Docker)
supabase db push                      # aplicar migrations ao projeto remoto
supabase migration new <nome>         # criar nova migration
supabase gen types typescript --local # regenerar tipos TypeScript do schema
```

## Variáveis de Ambiente

```bash
# .env.local (nunca commitar)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-side only (Server Actions / Route Handlers)
```

## Arquitetura Macro

O sistema tem **6 módulos**:

| Módulo | Responsabilidade |
|--------|-----------------|
| 1 — Formulário (5 steps) | Stepper com campos condicionais por tipo/causa de morte |
| 2 — Geração de PDF | Ficha oficial, protocolo `IML-AAAA-NNNNNN`, QR Code, hash SHA-256 |
| 3 — Dashboard / KPIs | Gráficos de volume, causas, perfil vítimas, alertas |
| 4 — Relatórios | Mensal, Epidemiológico, Produtividade, Autoridades — export PDF/CSV |
| 5 — Usuários e Acesso | 4 perfis: Administrador, Gestor IML, Médico/Responsável, Auditor |
| 6 — Auditoria | Log imutável, versionamento de fichas, verificação de integridade |

## Padrões Next.js + Supabase

**Dois clientes Supabase distintos:**
- `lib/supabase/server.ts` — usa `createServerClient` de `@supabase/ssr`, para Server Components, Server Actions e Route Handlers
- `lib/supabase/client.ts` — usa `createBrowserClient`, para Client Components

**Auth middleware** (`middleware.ts` na raiz):
- Usa `createServerClient` para renovar tokens de sessão em cada request
- Protege todas as rotas exceto `/login`

**Mutações** sempre via Server Actions (`'use server'`), nunca direto do cliente:
- Geração do protocolo único no servidor
- Cálculo do hash SHA-256 do PDF no servidor
- Insert em `auditoria_logs` dentro da mesma transação da mutation principal

## Banco de Dados (Supabase)

### Tabelas principais

- `encaminhamentos` — registro central do encaminhamento
- `instituicoes` — hospitais, UPAs, maternidades
- `medicos` — vinculados a `instituicoes`, com CRM validado
- `usuarios` — espelha `auth.users`, guarda o campo `perfil`
- `auditoria_logs` — append-only; usar trigger Postgres ou insert explícito na transação
- `anexos` — metadados de arquivos no Supabase Storage

### RLS (Row Level Security)

RLS habilitado em todas as tabelas. Perfil lido de `usuarios.perfil` via `auth.uid()`:

| Perfil | Acesso |
|--------|--------|
| `administrador` | total |
| `gestor_iml` | leitura total + pode validar fichas |
| `medico` | leitura/escrita apenas de `created_by = auth.uid()` |
| `auditor` | somente leitura em todas as tabelas |

## Regras de Negócio Críticas

1. **Campos condicionais**: obrigatoriedade muda conforme `motivo` (`morte_violenta` | `morte_suspeita`) e `causa_principal`. Validação dinâmica via Zod discriminated unions.
2. **Arma de Fogo**: campos de exames de imagem, cirurgia e projéteis tornam-se obrigatórios.
3. **Consistência temporal**: `data_admissao ≤ data_obito ≤ data_preenchimento`. Validar no schema Zod e revalidar no servidor.
4. **Protocolo único**: gerado exclusivamente em Server Action, formato `IML-AAAA-NNNNNN` com sequência atômica no banco.
5. **Registros confirmados**: sem DELETE — apenas `status = 'cancelado'` com justificativa em `auditoria_logs`.
6. **Corpo não identificado**: `caracteristicas_fisicas` obrigatório quando `identificado = false`.

## Convenções de Código

- Datas armazenadas em ISO 8601 UTC; exibidas como `dd/MM/yyyy` ou `dd/MM/yyyy HH:mm` (date-fns + locale `pt-BR`).
- Tipos TypeScript do Supabase gerados automaticamente via `supabase gen types` — nunca escrever manualmente.
- `auditoria_logs`: preferir trigger Postgres para garantir atomicidade; insert explícito apenas quando o trigger não capturar o contexto necessário.

## Design

- Paleta institucional: azul `#003366` (primário), verde `#006633` (acento)
- Tipografia: Geist Sans (interface) + Geist Mono (protocolos, hashes, timestamps)
- Responsivo a partir de 768px (tablets em ambiente hospitalar)
- WCAG 2.1 AA obrigatório
