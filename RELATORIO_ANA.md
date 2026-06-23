# RELATÓRIO DE DIAGNÓSTICO — ASSISTENTE ANA (CondoPlus)

**Data:** 2026-06-21  
**Projeto:** D:\sige-condo (condoplus.solutions)  
**Origem:** Migrado do Lovable.dev → Hostinger + Supabase próprio

---

## 1. STACK IDENTIFICADO

| Item | Valor |
|------|-------|
| Framework | **React 18 + TypeScript** |
| Bundler | **Vite 8.0.8** (SWC plugin) |
| Routing | React Router v6 |
| UI | shadcn/ui + TailwindCSS 3 |
| Backend | Supabase (Auth + PostgreSQL + Edge Functions) |
| State | TanStack React Query v5 |
| IA (antes) | Gateway Lovable (`ai.gateway.lovable.dev`) → modelo `google/gemini-2.0-flash-001` |

### Scripts disponíveis (`package.json`)

| Script | Comando |
|--------|---------|
| `npm run dev` | Sync de versão + servidor Vite (porta 8080) |
| `npm run build` | Build produção + copia `.htaccess` → `dist/` |
| `npm run build:dev` | Build modo development |
| `npm run lint` | ESLint |
| `npm run preview` | Preview local do build |
| `npm run test` | Vitest (uma vez) |
| `npm run test:watch` | Vitest (modo watch) |
| `npm run zip` | Gera zip do dist |
| `npm run deploy` | Deploy FTP para Hostinger |

---

## 2. VARIÁVEIS DE AMBIENTE

### Arquivo `.env` (variáveis encontradas)

| Variável | Status | Finalidade |
|----------|--------|------------|
| `VITE_SUPABASE_PROJECT_ID` | ✅ Preenchida | ID do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Preenchida | Anon key do Supabase |
| `VITE_SUPABASE_URL` | ✅ Preenchida | URL do projeto Supabase |
| `FTP_HOST` | ✅ Preenchida | Deploy Hostinger |
| `FTP_USER` | ✅ Preenchida | Deploy Hostinger |
| `FTP_PASSWORD` | ✅ Preenchida | Deploy Hostinger |
| `FTP_REMOTE_PATH` | ✅ Preenchida | Deploy Hostinger |
| **`LOVABLE_API_KEY`** | ❌ **AUSENTE** | **Chave da IA da Ana — CRÍTICO** |

### Secrets nas Edge Functions do Supabase

Executado: `npx supabase secrets list`

| Secret | Status |
|--------|--------|
| SUPABASE_ANON_KEY | ✅ Presente |
| SUPABASE_DB_URL | ✅ Presente |
| SUPABASE_JWKS | ✅ Presente |
| SUPABASE_PUBLISHABLE_KEYS | ✅ Presente |
| SUPABASE_SECRET_KEYS | ✅ Presente |
| SUPABASE_SERVICE_ROLE_KEY | ✅ Presente |
| SUPABASE_URL | ✅ Presente |
| **LOVABLE_API_KEY** | ❌ **AUSENTE** |

---

## 3. ARQUIVOS CRÍTICOS DO FLUXO DA ANA

### Frontend → Supabase (chamada HTTP)

```
src/components/atendimentos/AssistenteIAChat.tsx  (linha 38)
  CHAT_URL = `${VITE_SUPABASE_URL}/functions/v1/assistente-atendimento`
  → POST com Bearer VITE_SUPABASE_PUBLISHABLE_KEY
  → body: { messages, usuarioLogado, condominiosInfo, unidadesInfo }
  → processa SSE (streaming) da resposta
  → ao receber finish_reason="tool_calls", chama handleToolCall()
  → handleToolCall() → useCreateAtendimento() → tabela Supabase
```

### Edge Function (Supabase Deno)

```
supabase/functions/assistente-atendimento/index.ts
  1. Lê LOVABLE_API_KEY via Deno.env.get("LOVABLE_API_KEY")
  2. Se ausente → throw Error("LOVABLE_API_KEY is not configured")  ← FALHA AQUI
  3. POST para https://ai.gateway.lovable.dev/v1/chat/completions
     model: google/gemini-2.0-flash-001  (Gemini Flash via gateway Lovable)
  4. Retorna stream SSE para o frontend
```

### Outras referências

| Arquivo | Linha | Referência |
|---------|-------|------------|
| `src/components/layout/MainLayout.tsx` | — | Renderiza o componente AssistenteIAChat |
| `src/integrations/supabase/client.ts` | — | Init do @supabase/supabase-js |
| `src/hooks/useAuth.ts` | — | Import @supabase/supabase-js |

### Sem referências a:
- OpenAI API (`openai`, `OPENAI_API_KEY`) — ❌ nenhuma
- Anthropic API (`anthropic`, `ANTHROPIC_API_KEY`) — ❌ nenhuma
- URLs hardcoded `.supabase.co` no código de negócio — ❌ nenhuma (apenas em strings de documentação em `escopoExportUtils.ts:205-207`)

---

## 4. EDGE FUNCTIONS ENCONTRADAS

```
supabase/functions/
├── assistente-atendimento/index.ts   ← Ana (IA) — NÃO DEPLOYADA
├── enviar-email-cobranca/index.ts
├── enviar-mensagem/index.ts
├── gerar-boletos-recorrentes/index.ts
├── marcar-mensagem-lida/index.ts
├── parse-pdf/index.ts
├── processar-fila-mensageria/index.ts
├── admin-create-user/index.ts
└── admin-manage-user/index.ts
```

---

## 5. ERROS NO BUILD / INSTALL

### `npm install` — FALHA (peer dependency)

```
npm error ERESOLVE could not resolve
npm error Found: vite@8.0.8
npm error peer vite@"^4 || ^5 || ^6 || ^7" from @vitejs/plugin-react-swc@3.11.0
```

**Vite 8** foi lançado e `@vitejs/plugin-react-swc@3.11.0` ainda não tem suporte declarado.  
Workaround: `npm install --legacy-peer-deps` (funciona corretamente).

### `npm run build` — ✅ SUCESSO

Build completou em 3.33s. Warnings apenas:
- Chunk `index.js` com 2.8MB (> 500KB recomendado) — não impede funcionamento
- Dynamic import ineficaz em `BoletoTemplate.tsx`/`BoletoPreviewModal.tsx`

---

## 6. TESTE DO ENDPOINT DA ANA

```
POST https://efmfyuewgtejsmwiusgn.supabase.co/functions/v1/assistente-atendimento
Authorization: Bearer <anon-key>
Content-Type: application/json
Body: {"messages":[{"role":"user","content":"oi"}],...}
```

**Resposta:**
```
HTTP 404
{"code":"NOT_FOUND","message":"Requested function was not found"}
```

A Edge Function `assistente-atendimento` **não existe no Supabase** — nunca foi deployada após a migração do Lovable.

---

## 7. HIPÓTESE PRINCIPAL DA FALHA

A Ana para de funcionar por **duas falhas encadeadas**, ambas consequência da migração do Lovable:

### Falha 1 — Edge Function não deployada (causa imediata)
O Supabase retorna HTTP 404. A função `assistente-atendimento` existe apenas localmente em `supabase/functions/`, mas **nunca foi publicada** no Supabase após a migração. No Lovable, o deploy das funções era automático.

### Falha 2 — Gateway de IA bloqueado (causa raiz)
Mesmo que a função fosse deployada, ela usaria `LOVABLE_API_KEY` para chamar `https://ai.gateway.lovable.dev/v1/chat/completions` — **um gateway proprietário do Lovable**. Esse acesso provavelmente foi revogado ou está condicionado a uma conta ativa na plataforma Lovable. Essa chave não está em nenhum arquivo `.env` nem nos secrets do Supabase.

---

## 8. PRÓXIMOS PASSOS SUGERIDOS

### Passo 1 — Substituir o gateway Lovable por Claude ou OpenAI

A forma mais limpa é atualizar `supabase/functions/assistente-atendimento/index.ts` para chamar a API Anthropic (Claude) ou OpenAI diretamente, eliminando a dependência do gateway Lovable.

**Opção recomendada — Anthropic (Claude Haiku):**
```typescript
// Trocar:
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
// fetch("https://ai.gateway.lovable.dev/v1/chat/completions", ...)

// Por:
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
// fetch("https://api.anthropic.com/v1/messages", ...)
// model: "claude-haiku-4-5-20251001"  ← rápido e barato, ideal para chat
```

**Ou — OpenAI (GPT-4o-mini):**
```typescript
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
// fetch("https://api.openai.com/v1/chat/completions", ...)
// model: "gpt-4o-mini"
```

### Passo 2 — Adicionar o secret no Supabase

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# ou
npx supabase secrets set OPENAI_API_KEY=sk-...
```

### Passo 3 — Fazer deploy da Edge Function

```bash
npx supabase functions deploy assistente-atendimento
```

### Passo 4 — Corrigir peer dependency do Vite (opcional, mas recomendado)

Fixar a versão do Vite para 7 ou aguardar atualização do plugin:
```bash
npm install vite@^7 --save-dev --legacy-peer-deps
```

### Passo 5 — Testar o endpoint

```bash
curl -X POST "https://efmfyuewgtejsmwiusgn.supabase.co/functions/v1/assistente-atendimento" \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"oi"}],"usuarioLogado":{"nome":"Teste"},"condominiosInfo":[],"unidadesInfo":[]}'
```

---

## RESUMO EXECUTIVO

| # | Problema | Severidade | Ação |
|---|----------|-----------|------|
| 1 | Edge Function `assistente-atendimento` não deployada no Supabase | 🔴 Crítico | `supabase functions deploy` |
| 2 | `LOVABLE_API_KEY` ausente — gateway Lovable inacessível pós-migração | 🔴 Crítico | Migrar para Anthropic/OpenAI + set secret |
| 3 | `npm install` falha sem `--legacy-peer-deps` (vite@8 vs plugin) | 🟡 Médio | Fixar vite para `^7` |
| 4 | Chunk JS principal com 2.8MB (performance) | 🟢 Baixo | Code splitting (futuro) |
