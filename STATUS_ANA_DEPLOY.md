# STATUS DEPLOY — Ana (assistente-atendimento)
**Data:** 21/06/2026 14:35 BRT  
**Executado por:** Claude Code

---

## Resultado por Passo

| Passo | Descrição | Status | Detalhe |
|-------|-----------|--------|---------|
| 1 | Verificar OPENAI_API_KEY nos secrets | ⚠️ ATENÇÃO | Secret existe, mas hash = SHA-256 de string vazia |
| 2 | Deploy `assistente-atendimento` | ✅ OK | Deployed com sucesso (sem Docker local — usou upload direto) |
| 3 | Leitura da ANON_KEY do `.env` | ✅ OK | Chave obtida via variável local (não logada) |
| 4 | Teste do endpoint via curl | ✅ Conectou | HTTP 500 recebido |
| 5 | Análise da resposta | ❌ FALHA | `{"error":"OPENAI_API_KEY is not configured"}` |

---

## Output do curl (chave anon mascarada)

```
POST https://efmfyuewgtejsmwiusgn.supabase.co/functions/v1/assistente-atendimento
Authorization: Bearer eyJ...****F2E

HTTP/1.1 500 Internal Server Error
Content-Type: application/json
sb-error-code: EDGE_FUNCTION_ERROR
x-sb-edge-region: sa-east-1

{"error":"OPENAI_API_KEY is not configured"}
```

---

## Diagnóstico

O secret `OPENAI_API_KEY` foi encontrado na listagem, **mas seu hash SHA-256 é:**

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

Este é o hash bem-conhecido de uma **string vazia** (`""`). Isso significa que o secret foi criado/atualizado com valor em branco — provavelmente um `supabase secrets set OPENAI_API_KEY=` sem o valor, ou uma entrada vazia no Dashboard.

A função detecta isso corretamente na linha de startup:
```ts
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
```

---

## Próxima Ação Necessária

**Você precisa setar a chave OpenAI corretamente.** Execute no terminal:

```bash
npx supabase secrets set OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXX --project-ref efmfyuewgtejsmwiusgn
```

Substitua `sk-proj-XXXXXXXXXXXXXXXX` pela sua chave real da OpenAI (obtida em https://platform.openai.com/api-keys).

Após setar, confirme:
```bash
npx supabase secrets list --project-ref efmfyuewgtejsmwiusgn
```
O hash de `OPENAI_API_KEY` deve mudar para algo diferente de `e3b0c44...`.

**Não é necessário novo deploy** — a função já está deployada e correta. Basta setar o secret com o valor real.

---

## Resumo

| Item | Status |
|------|--------|
| Código da função | ✅ Correto e deployado |
| Infraestrutura Supabase | ✅ Funcionando (HTTP conecta, função executa) |
| Secret OPENAI_API_KEY | ❌ Vazio (precisa ser setado com valor real) |
| **Ana está viva?** | ❌ Ainda não — aguardando a chave OpenAI válida |
