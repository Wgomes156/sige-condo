# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CondoPlus** — a SaaS condominium management system (SIGE-Condo) built with React + TypeScript, backed by Supabase. Manages billing (boletos), maintenance orders, residents (moradores), financial reports, service requests (atendimentos), and more.

## Commands

```bash
npm run dev        # Dev server on http://localhost:8080
npm run build      # Production build (copies .htaccess to dist/ for Hostinger SPA routing)
npm run build:dev  # Development-mode build
npm run lint       # ESLint checks
npm run preview    # Preview production build locally
npm run test       # Vitest unit tests (run once)
npm run test:watch # Vitest in watch mode
```

## Architecture

### Tech Stack
- **React 18 + TypeScript + Vite 5** (SWC plugin)
- **Routing**: React Router v6
- **UI**: shadcn/ui (Radix UI primitives) + TailwindCSS 3
- **Server state**: TanStack React Query v5
- **Backend**: Supabase (auth, PostgreSQL, storage, edge functions)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **PDF**: jsPDF + jsPDF-AutoTable (client-side export)
- **PWA**: Service Worker + Web App Manifest

### Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

### Route & Layout Structure
`src/App.tsx` defines all routes. Two layout contexts:
- **MainLayout** (Admin/Sindico/Gerente/Operador): sidebar + header + protected content
- **Portal do Morador** (`/portal`): stripped layout for residents

`ProtectedRoute` redirects unauthenticated users to `/auth`. The sidebar adapts its menu items based on user role (Admin, Sindico, Gerente, Operador, Morador).

### Data Layer Pattern
All server state goes through **React Query hooks** in `src/hooks/`. Each hook:
1. Fetches from Supabase via `useQuery` with filters as query key deps
2. Exposes mutations via `useMutation` + invalidates queries on success
3. Shows toast notifications on error/success

Example: `useBoletos.ts` → `useFinanceiro.ts` → `useAtendimentos.ts`

Never bypass hooks to call Supabase directly in components — keep data logic in hooks.

### Supabase Integration
- Client init: `src/integrations/supabase/client.ts`
- Generated TypeScript types: `src/integrations/supabase/types.ts`
- Edge Functions (Deno): `supabase/functions/`
  - `gerar-boletos-recorrentes` — monthly billing generation
  - `enviar-email-cobranca` — billing email notifications
  - `admin-manage-user` — user creation/role assignment
  - `assistente-atendimento` — AI chat assistant ("Ana")
  - `parse-pdf` — PDF document parsing

### Audit Logging
Every mutation must call `useAuditLogger()` and log via `auditLog({ userId, userEmail, userRole, action, entityType, details })`. This is a compliance requirement — all CRUD actions are tracked in the `audit_logs` table.

### TypeScript Config
Relaxed: `noImplicitAny: false`, `strictNullChecks: false`. Do not tighten these without user confirmation, as many components rely on the loose typing.

### CSS / Design Tokens
HSL design tokens defined in `src/index.css`. Brand colors:
- Sidebar/Primary: dark blue (`hsl(210 60% 20-25%)`)
- Accent/CTA: orange (`hsl(35 92% 55%)`)
- Dark mode via `next-themes` class strategy

### Responsive Design
Tables convert to cards on mobile — this is a consistent pattern across all list pages. The sidebar becomes a drawer on mobile via `MobileMenuContext` in `MainLayout`.

### Deployment
Targets **Hostinger** static hosting. The `build` script copies `public/.htaccess` to `dist/` to handle React Router SPA redirects. The Vite base is `/` (root domain).

---

## TAREFA: DADOS BANCÁRIOS + EMISSÃO DE BOLETOS POR CONDÔMINO — SIGE-CONDO

Implementar no sistema duas funcionalidades integradas:
1. Cadastro de dados bancários dentro do perfil de cada condomínio
2. Módulo de emissão de boletos por condômino com base nesses dados

---

## PARTE 1 — DADOS BANCÁRIOS NO CADASTRO DO CONDOMÍNIO

### 1.1 Onde adicionar
No cadastro/perfil de cada condomínio, criar uma nova seção chamada:
"Dados Bancários" (após os dados gerais do condomínio)

### 1.2 Campos a implementar

| Campo               | Tipo        | Validação                          |
|---------------------|-------------|------------------------------------|
| Número do Banco     | Text/Select | Obrigatório - aceitar código + nome|
| Nome do Banco       | Text        | Preenchido automaticamente         |
| Agência             | Text        | Obrigatório - formato: 0000 ou 0000-0 |
| Conta Corrente      | Text        | Obrigatório - formato: 00000-0     |
| Dígito Verificador  | Text        | Obrigatório - 1 caractere          |
| Tipo de Conta       | Select      | Conta Corrente / Conta Poupança    |
| Nome do Titular     | Text        | Obrigatório                        |
| CPF / CNPJ Titular  | Text        | Obrigatório - validação de CPF/CNPJ|
| Chave Pix           | Text        | Opcional - CPF, CNPJ, e-mail, telefone ou chave aleatória |

### 1.3 Comportamento dos campos

- Campo "Número do Banco": ao digitar o código (ex: 341), preencher automaticamente o nome do banco (ex: Itaú).
  Usar lista com os principais bancos brasileiros:
  001 - Banco do Brasil, 033 - Santander, 104 - Caixa Econômica Federal,
  237 - Bradesco, 341 - Itaú, 756 - Sicoob, 748 - Sicredi,
  077 - Inter, 260 - Nubank, 336 - C6 Bank (e demais bancos do sistema financeiro brasileiro)

- Campos de Agência e Conta: aceitar apenas números, formatar automaticamente com hífen no dígito verificador.

- CPF/CNPJ: validar matematicamente (não apenas formato), formatar automaticamente enquanto digita.

- Chave Pix: detectar o tipo automaticamente ao digitar (CPF, CNPJ, e-mail, telefone, aleatória) e exibir label indicando o tipo identificado.

### 1.4 Segurança
- Dados bancários visíveis apenas para: Síndico e Administrador
- Ocultar para: Moradores e usuários sem permissão
- Exibir campos de conta com máscara parcial para visualização (ex: ****-5 ao listar, revelando ao clicar em "mostrar")
- Registrar log de acesso sempre que os dados forem visualizados ou editados

### 1.5 Persistência
Criar tabela `condominio_dados_bancarios` no Supabase:
```
condominio_id: string (FK)
numero_banco: string
nome_banco: string
agencia: string
agencia_digito: string
conta_corrente: string
conta_digito: string
tipo_conta: "corrente" | "poupança"
nome_titular: string
cpf_cnpj_titular: string
chave_pix: string (opcional)
tipo_chave_pix: "cpf"|"cnpj"|"email"|"telefone"|"aleatoria"
criado_em: timestamp
atualizado_em: timestamp
atualizado_por: string (user_id)
```

---

## PARTE 2 — EMISSÃO DE BOLETOS POR CONDÔMINO

### 2.1 Onde acessar
Criar novo módulo "Boletos" no menu principal, acessível para Síndico e Administrador.

### 2.2 Fluxo de emissão individual

**Passo 1 — Selecionar condômino:**
- Busca por nome, unidade (apto/bloco) ou CPF
- Exibir: nome, unidade, e-mail e status de adimplência

**Passo 2 — Preencher dados do boleto:**

| Campo              | Tipo     | Observação                          |
|--------------------|----------|-------------------------------------|
| Condomínio         | Auto     | Preenchido automaticamente          |
| Condômino          | Auto     | Vem do passo anterior               |
| Descrição          | Text     | Ex: "Taxa condominial - Janeiro/2026"|
| Valor              | Currency | Obrigatório - formato R$ 0.000,00   |
| Data de Vencimento | Date     | Obrigatório - não permitir data passada |
| Multa por atraso   | %        | Default: 2%                         |
| Juros ao dia       | %        | Default: 0,033% ao dia              |
| Desconto até       | Date     | Opcional                            |
| Valor do desconto  | Currency | Opcional                            |
| Instruções         | Textarea | Texto livre para o banco            |
| Nosso número       | Auto     | Gerado automaticamente pelo sistema |

**Passo 3 — Revisão e confirmação:** resumo completo antes de gerar.

**Passo 4 — Boleto gerado:** código de barras + linha digitável. Opções: Baixar PDF, Copiar linha digitável, Enviar por e-mail, Enviar por WhatsApp.

### 2.3 Emissão em lote
- Selecionar: todos os condôminos ou por bloco/torre
- Preencher: descrição, valor padrão, vencimento
- Permitir editar individualmente antes de confirmar
- Exportar todos em PDF único ou ZIP com PDFs individuais
- Enviar automaticamente por e-mail e/ou WhatsApp para cada condômino

### 2.4 Dados bancários no boleto
Os dados do cedente devem ser puxados automaticamente de `condominio_dados_bancarios`:
- Nome do Titular → Cedente
- CPF/CNPJ → CPF/CNPJ do cedente
- Banco, Agência, Conta → dados para compensação
- Chave Pix → exibir QR Code Pix no boleto (se cadastrada)

### 2.5 Estrutura de dados do boleto
Tabela `boletos` no Supabase:
```
id: string
condominio_id: string
condomino_id: string
descricao: string
valor: number
data_vencimento: date
data_emissao: date
multa_percentual: number (default: 2)
juros_dia: number (default: 0.033)
desconto_valor: number
desconto_ate: date
instrucoes: string
nosso_numero: string (gerado automaticamente)
linha_digitavel: string
codigo_barras: string
status: "emitido"|"pago"|"vencido"|"cancelado"
pago_em: timestamp
enviado_email: boolean
enviado_whatsapp: boolean
criado_por: string
criado_em: timestamp
```

### 2.6 Listagem e gestão de boletos
- Filtros: condomínio, condômino, status, período de vencimento
- Colunas: condômino, unidade, descrição, valor, vencimento, status
- Status com cores: Emitido (amarelo), Pago (verde), Vencido (vermelho), Cancelado (cinza)
- Ações por boleto: visualizar, baixar PDF, reenviar, cancelar, registrar pagamento manual
- Totalizadores no topo: total emitido, total pago, total vencido

### 2.7 Responsividade
- Desktop: tabela completa + formulário em 2 colunas
- Tablet: colunas reduzidas + formulário em 1 coluna
- Mobile: cards + formulário em 1 coluna com botões em largura total

---

## REGRAS GERAIS (Boletos e Dados Bancários)

- Preservar identidade visual, paleta de cores e arquitetura atual do projeto
- Dados bancários: visíveis apenas para Síndico e Administrador
- Boletos: emissão apenas para Síndico e Administrador; condômino visualiza apenas os seus
- Validar todos os campos obrigatórios antes de salvar ou gerar
- Exibir feedback visual em cada ação (loading, sucesso, erro)
- Seguir padrão responsivo já definido no sistema (mobile, tablet, desktop)
- Usar `useAuditLogger()` em todas as mutações conforme padrão do projeto
