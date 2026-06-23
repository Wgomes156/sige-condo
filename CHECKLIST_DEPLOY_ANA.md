# CHECKLIST DE DEPLOY — ASSISTENTE ANA (Migração Lovable → OpenAI)

**Data:** 2026-06-21  
**O que foi feito:** Edge Function `assistente-atendimento` migrada de  
`ai.gateway.lovable.dev` (Gemini Flash) → `api.openai.com` (gpt-4o-mini)  
**Backup da versão anterior:** `supabase/functions/assistente-atendimento/index.ts.bak`

---

## PRÉ-REQUISITOS

- [ ] Você tem uma chave de API da OpenAI (`sk-proj-...` ou `sk-...`)
  - Obter em: https://platform.openai.com/api-keys
  - Conta com crédito ativo (mínimo US$5 recomendado para testes)
- [ ] CLI do Supabase instalada e autenticada (`npx supabase --version`)
- [ ] Projeto Supabase linkado localmente (verifique com `npx supabase status`)

---

## PASSO 1 — SETAR A OPENAI_API_KEY NO SUPABASE

Execute no terminal dentro de `D:\sige-condo`:

```bash
npx supabase secrets set OPENAI_API_KEY=sk-proj-SUAKEYAQUI
```

**⚠️ Avisos:**
- Substitua `sk-proj-SUAKEYAQUI` pela chave real da OpenAI
- Não coloque a chave entre aspas no shell (pode causar problemas)
- A chave NÃO vai para o `.env` local — fica somente nos secrets do Supabase

**Verificar se foi salvo:**
```bash
npx supabase secrets list
```
Deve aparecer `OPENAI_API_KEY` na lista.

---

## PASSO 2 — FAZER DEPLOY DA EDGE FUNCTION

```bash
npx supabase functions deploy assistente-atendimento
```

**O que esperar:**
- Upload do arquivo `supabase/functions/assistente-atendimento/index.ts`
- Mensagem de sucesso: `Deployed Functions assistente-atendimento`
- Nenhum restart do frontend necessário

**⚠️ Avisos:**
- Se pedir para linkar projeto, execute antes:
  ```bash
  npx supabase link --project-ref efmfyuewgtejsmwiusgn
  ```
- Se der erro de autenticação, execute:
  ```bash
  npx supabase login
  ```

---

## PASSO 3 — TESTAR VIA CURL

```bash
curl -X POST "https://efmfyuewgtejsmwiusgn.supabase.co/functions/v1/assistente-atendimento" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWZ5dWV3Z3RlanNtd2l1c2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTQyNTUsImV4cCI6MjA5NjQ5MDI1NX0.EEJRj0ECRuwZ7-K3_4C9jlLKblLA3AV0-IFDJiucF2E" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"oi"}],"usuarioLogado":{"nome":"Teste"},"condominiosInfo":[],"unidadesInfo":[]}'
```

**Resposta esperada (streaming SSE):**
```
data: {"id":"chatcmpl-...","choices":[{"delta":{"content":"Olá"},...}]}
data: {"id":"chatcmpl-...","choices":[{"delta":{"content":", Teste!"},...}]}
...
data: [DONE]
```

**Respostas de erro e o que significam:**

| HTTP | Mensagem | Causa | Ação |
|------|----------|-------|------|
| 404 | `Requested function was not found` | Deploy não feito | Executar Passo 2 |
| 500 | `OPENAI_API_KEY is not configured` | Secret não setado | Executar Passo 1 |
| 401 | `Incorrect API key provided` | Chave OpenAI inválida | Verificar a chave |
| 429 | `Limite de requisições excedido` | Rate limit OpenAI | Aguardar ou upgrade de plano |
| 402 | `Créditos insuficientes` | Sem saldo OpenAI | Adicionar crédito na conta OpenAI |

---

## PASSO 4 — TESTAR NO FRONTEND

1. Acesse `https://condoplus.solutions` (ou `http://localhost:8080` em dev)
2. Faça login como morador ou usuário com acesso ao chat
3. Abra o assistente Ana (ícone de chat ou menu)
4. Envie a mensagem: **"Oi"**
5. Confirme que a Ana responde em streaming (texto aparecendo progressivamente)
6. Teste um segundo cenário: **"Tem barulho alto no apartamento 12"**
   - Espera-se que a Ana registre um atendimento automaticamente

**⚠️ O frontend (`AssistenteIAChat.tsx`) NÃO precisa de nenhuma alteração.**  
Ele chama `${VITE_SUPABASE_URL}/functions/v1/assistente-atendimento` — agnóstico ao modelo.

---

## PASSO 5 (OPCIONAL) — ATUALIZAR DOCUMENTAÇÃO

O arquivo `src/lib/escopoExportUtils.ts` (linha 165) ainda contém:
```
'Backend (Lovable Cloud)'
```
Isso é texto de um relatório de exportação de escopo — **não afeta o funcionamento**.  
Atualizar para `'Backend (Supabase)'` quando conveniente.

---

## ROLLBACK (se necessário)

Se algo der errado após o deploy, restaure o backup:

```bash
# Restaurar arquivo original
cp supabase/functions/assistente-atendimento/index.ts.bak \
   supabase/functions/assistente-atendimento/index.ts

# Re-deployar a versão anterior (ainda vai falhar por falta de LOVABLE_API_KEY,
# mas pelo menos reverte o código)
npx supabase functions deploy assistente-atendimento
```

---

## RESUMO DOS COMANDOS (copiar e colar na ordem)

```bash
# 1. Setar a chave
npx supabase secrets set OPENAI_API_KEY=sk-proj-SUAKEYAQUI

# 2. Confirmar que foi salvo
npx supabase secrets list

# 3. Deploy
npx supabase functions deploy assistente-atendimento

# 4. Teste rápido
curl -X POST "https://efmfyuewgtejsmwiusgn.supabase.co/functions/v1/assistente-atendimento" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWZ5dWV3Z3RlanNtd2l1c2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTQyNTUsImV4cCI6MjA5NjQ5MDI1NX0.EEJRj0ECRuwZ7-K3_4C9jlLKblLA3AV0-IFDJiucF2E" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"oi"}],"usuarioLogado":{"nome":"Teste"},"condominiosInfo":[],"unidadesInfo":[]}'
```
