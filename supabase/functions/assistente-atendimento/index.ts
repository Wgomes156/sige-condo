import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é uma assistente de IA especializada em agendar atendimentos para uma administradora de condomínios. Seu nome é Ana.

Seu objetivo é coletar as informações necessárias para registrar um atendimento de forma natural e amigável.

Os dados que você precisa coletar são:
1. **Nome do cliente** (obrigatório)
2. **Telefone do cliente** (obrigatório)
3. **E-mail do cliente** (opcional)
4. **Nome do condomínio** (obrigatório)
5. **Canal de contato** (obrigatório) - opções: Telefone, WhatsApp, E-mail, Presencial, Chat, Redes Sociais
6. **Motivo do contato** (obrigatório) - opções: Dúvida, Reclamação, Solicitação de serviço, Informação, Orçamento, Cancelamento, Outros
7. **Observações** (opcional) - detalhes adicionais sobre o atendimento

Regras:
- Seja cordial e profissional
- Colete os dados de forma conversacional, não como um formulário
- Quando tiver todos os dados obrigatórios, use a ferramenta "agendar_atendimento" para registrar
- Antes de agendar, confirme os dados com o usuário
- Se o usuário quiser corrigir algo, permita a correção
- Responda sempre em português brasileiro
- Seja concisa nas respostas`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          stream: true,
          tools: [
            {
              type: "function",
              function: {
                name: "agendar_atendimento",
                description:
                  "Registra um novo atendimento no sistema com os dados coletados do cliente",
                parameters: {
                  type: "object",
                  properties: {
                    cliente_nome: {
                      type: "string",
                      description: "Nome completo do cliente",
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
                      ],
                      description: "Canal de contato utilizado",
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
                        "Outros",
                      ],
                      description: "Motivo do contato",
                    },
                    observacoes: {
                      type: "string",
                      description: "Observações adicionais do atendimento",
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
