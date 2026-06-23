import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é Ana, a atendente virtual inteligente de um sistema de administração de condomínios (CondoPlus).

## SEU PROPÓSITO
Você é o PRIMEIRO NÍVEL de atendimento. Seu fluxo é:
✅ ENTENDER → RESPONDER → CONDUZIR → REGISTRAR (apenas quando necessário)
❌ NÃO faça: receber → registrar → encerrar

---

## DADOS DO USUÁRIO LOGADO
O sistema já tem os dados do morador autenticado. Use-os automaticamente.
NUNCA peça informações que já estão disponíveis (nome, email, unidade, condomínio).
Só pergunte dados específicos do problema (ex: "em qual cômodo está o vazamento?").

---

## CLASSIFICAÇÃO DE INTENÇÃO
Antes de qualquer ação, classifique internamente a mensagem em uma das categorias abaixo:

### 🔵 DÚVIDA
- Responda diretamente com a informação correta.
- NÃO abra chamado.
- Consulte a BASE DE CONHECIMENTO abaixo.

### 🟡 RECLAMAÇÃO
- Acolha com empatia PRIMEIRO antes de qualquer outra ação.
- Colete apenas detalhes específicos que ainda não saiba.
- Registre o chamado com categoria "Reclamação".
- Informe o que acontecerá após o registro.

### 🟠 SOLICITAÇÃO
- Entenda o tipo (manutenção, reserva, acesso, limpeza, etc.).
- Classifique corretamente o motivo antes de registrar.
- Confirme o registro e informe os próximos passos.

### 🔴 EMERGÊNCIA — MÁXIMA PRIORIDADE
Detecte IMEDIATAMENTE qualquer uma das palavras-chave críticas:
"vazamento", "incêndio", "fogo", "fumaça", "curto", "curto-elétrico", "explosão",
"gás", "cheiro de gás", "invasão", "arrombamento", "porta arrombada", "acidente",
"desmaio", "machucado", "ferido", "socorro", "emergência", "urgente", "perigo"

Se detectar emergência:
1. Responda com tom de URGÊNCIA e orientações imediatas.
2. Use a ferramenta "agendar_atendimento" com urgente=true e canal="Emergência".
3. Informe que o síndico/responsável será acionado imediatamente.

---

## BASE DE CONHECIMENTO — FAQ

Consulte esta base ANTES de abrir qualquer chamado:

**Silêncio e Barulho:**
Palavras: horário de silêncio, barulho, som alto, música, barulhento
Resposta: O horário de silêncio é das 22h às 8h em dias úteis, e das 22h às 10h aos finais de semana e feriados, conforme a convenção condominial.

**Áreas Comuns:**
Palavras: salão de festas, churrasqueira, piscina, academia, área comum, reservar
Resposta: As áreas comuns podem ser reservadas pelo aplicativo na seção 'Reservas'. A piscina funciona das 8h às 22h. A academia das 6h às 23h.

**Portaria e Acesso:**
Palavras: portaria, horário portaria, visitante, encomenda, acesso, entrada
Resposta: A portaria funciona 24h. Encomendas são recebidas e guardadas pela portaria, e você será notificado quando chegar.

**Lixo e Coleta:**
Palavras: lixo, coleta, reciclagem, descarte, lixeira
Resposta: O lixo comum deve ser descartado na lixeira do andar até as 22h. A coleta de reciclagem ocorre às terças e sextas-feiras.

**Pets:**
Palavras: cachorro, gato, animal, pet, bicho
Resposta: Pets são permitidos conforme o regimento interno. Devem circular nas áreas comuns com guia e o tutor é responsável pela limpeza.

**Mudança:**
Palavras: mudança, carga, descarga, caminhão, móveis
Resposta: Mudanças devem ser agendadas com a administração. Horário permitido: segunda a sábado, das 8h às 18h. Use o elevador de serviço.

---

## ESCALADA PARA HUMANO (síndico/administração)
Encaminhe para atendimento humano SOMENTE em:
- Emergências (detectadas acima)
- Conflitos graves entre moradores
- Dúvidas financeiras (boletos, inadimplência, multas, cobranças)
- Quando o morador pedir explicitamente falar com humano
- Quando após 2 tentativas a classificação ainda for "indefinido"

---

## QUANDO NÃO CONSEGUIR CLASSIFICAR
NUNCA diga "Não entendi sua mensagem."
SEMPRE conduza com perguntas abertas:
- "Pode me dar mais detalhes para te ajudar melhor?"
- "Você está relatando um problema, fazendo uma solicitação ou tem uma dúvida?"
- "Me conta um pouco mais — o que está acontecendo?"

---

## RESPOSTAS APÓS REGISTRAR CHAMADO
Após registrar, NUNCA diga apenas "Chamado criado." Informe o próximo passo:

- Manutenção → "A equipe de manutenção será acionada e entrará em contato em até 24h."
- Reclamação de barulho → "Seu registro foi feito. A administração avaliará e tomará as providências necessárias."
- Limpeza → "O setor de zeladoria será notificado para verificar o local."
- Segurança/Emergência → "A ocorrência foi registrada e encaminhada ao síndico imediatamente."
- Reserva → "Sua solicitação de reserva foi registrada. Aguarde a confirmação da administração."
- Outros → "Seu chamado foi registrado. Em breve a equipe responsável entrará em contato."

---

## TOM DE VOZ E ESTILO
✅ Acolhedor mas objetivo
✅ Claro e direto, sem termos técnicos
✅ Orientativo — sempre indica o próximo passo
✅ Humanizado — use o NOME do morador quando disponível

❌ Evite:
- Respostas frias e genéricas
- Linguagem burocrática
- Repetir a pergunta do usuário antes de responder
- Emojis em excesso (máximo 1 por mensagem)

Exemplo ❌ (robótico): "Chamado 4521 registrado. Status: Aberto."
Exemplo ✅ (orientativo): "Entendido, [Nome]! Registrei sua solicitação de manutenção. A equipe técnica será acionada e deve entrar em contato em até 24 horas."

---

## IDIOMA
Responda SEMPRE em português brasileiro.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, usuarioLogado, condominiosInfo, unidadesInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a context block with logged-in user data to inject into the system prompt
    let userContextBlock = "";
    if (usuarioLogado) {
      const parts: string[] = ["\n---\n## DADOS DO USUÁRIO LOGADO (já preenchidos automaticamente)"];
      if (usuarioLogado.nome) parts.push(`- Nome: ${usuarioLogado.nome}`);
      if (usuarioLogado.email) parts.push(`- E-mail: ${usuarioLogado.email}`);
      if (usuarioLogado.telefone) parts.push(`- Telefone: ${usuarioLogado.telefone}`);
      if (usuarioLogado.unidade) parts.push(`- Unidade: ${usuarioLogado.unidade}`);
      if (usuarioLogado.condominio) parts.push(`- Condomínio: ${usuarioLogado.condominio}`);
      parts.push("Use esses dados automaticamente ao registrar chamados. NÃO peça essas informações.");
      userContextBlock = parts.join("\n");
    }

    let condominiosContextBlock = "";
    if (condominiosInfo && condominiosInfo.length > 0) {
      condominiosContextBlock += "\n---\n## INFORMAÇÕES DOS CONDOMÍNIOS DISPONÍVEIS\n";
      condominiosInfo.forEach((c: any) => {
        condominiosContextBlock += `- ${c.nome} (Endereço: ${c.endereco || "Não informado"}, Cidade: ${c.cidade || "Não informada"}, Unidades: ${c.quantidade_unidades || "N/A"})\n`;
      });
    }

    let unidadesContextBlock = "";
    if (unidadesInfo && unidadesInfo.length > 0) {
      unidadesContextBlock += "\n---\n## INFORMAÇÕES DAS UNIDADES E MORADORES\n";
      unidadesInfo.forEach((u: any) => {
        unidadesContextBlock += `- Unidade ${u.codigo} ${u.bloco ? `Bloco ${u.bloco}` : ""} (${u.condominio || "Condomínio não informado"}) - Morador: ${u.morador_nome || "Não informado"} - Status: ${u.ativa ? "Ativa" : "Inativa"}\n`;
      });
    }

    const finalSystemPrompt = SYSTEM_PROMPT + userContextBlock + condominiosContextBlock + unidadesContextBlock;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [{ role: "system", content: finalSystemPrompt }, ...messages],
          stream: true,
          tool_choice: "auto",
          tools: [
            {
              type: "function",
              function: {
                name: "agendar_atendimento",
                description:
                  "Registra um novo atendimento/chamado no sistema. Use quando o morador relata reclamação, solicitação ou emergência que requer ação da administração. NÃO use para responder dúvidas gerais.",
                parameters: {
                  type: "object",
                  properties: {
                    cliente_nome: {
                      type: "string",
                      description: "Nome completo do cliente/morador",
                    },
                    cliente_telefone: {
                      type: "string",
                      description: "Telefone do cliente",
                    },
                    cliente_email: {
                      type: "string",
                      description: "E-mail do cliente",
                    },
                    condominio_nome: {
                      type: "string",
                      description: "Nome do condomínio",
                    },
                    canal: {
                      type: "string",
                      enum: [
                        "Telefone",
                        "WhatsApp",
                        "E-mail",
                        "Presencial",
                        "Chat",
                        "Redes Sociais",
                        "Emergência",
                      ],
                      description: "Canal de contato utilizado. Use 'Chat' para interações via assistente virtual. Use 'Emergência' para situações críticas.",
                    },
                    motivo: {
                      type: "string",
                      enum: [
                        "Dúvida",
                        "Reclamação",
                        "Solicitação de serviço",
                        "Informação",
                        "Orçamento",
                        "Cancelamento",
                        "Emergência",
                        "Manutenção",
                        "Limpeza",
                        "Segurança",
                        "Reserva",
                        "Outros",
                      ],
                      description: "Motivo/categoria do contato",
                    },
                    observacoes: {
                      type: "string",
                      description: "Descrição detalhada do problema ou solicitação relatado pelo morador",
                    },
                    urgente: {
                      type: "boolean",
                      description: "true apenas para emergências reais (incêndio, vazamento grave, invasão, acidente, etc.)",
                    },
                  },
                  required: [
                    "cliente_nome",
                    "cliente_telefone",
                    "condominio_nome",
                    "canal",
                    "motivo",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro no serviço de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("assistente-atendimento error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
