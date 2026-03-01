import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bot, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useCreateAtendimento } from "@/hooks/useAtendimentos";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface AssistenteIAChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistente-atendimento`;

export function AssistenteIAChat({ open, onOpenChange }: AssistenteIAChatProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [atendimentoCriado, setAtendimentoCriado] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const createAtendimento = useCreateAtendimento();
  const { user } = useAuth();

  const userName =
    user?.user_metadata?.nome || user?.email?.split("@")[0] || "";

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Olá! 👋 Sou a Ana, sua assistente virtual. Vou te ajudar a registrar um novo atendimento. Para começar, qual o **nome do cliente**?",
        },
      ]);
      setAtendimentoCriado(false);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToolCall = useCallback(
    async (toolArgs: Record<string, string>) => {
      try {
        const now = new Date();
        await createAtendimento.mutateAsync({
          data: now.toISOString().split("T")[0],
          hora: now.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          operador_nome: userName,
          canal: toolArgs.canal,
          status: "Em andamento",
          motivo: toolArgs.motivo,
          observacoes: toolArgs.observacoes || undefined,
          cliente_nome: toolArgs.cliente_nome,
          cliente_telefone: toolArgs.cliente_telefone,
          cliente_email: toolArgs.cliente_email || undefined,
          condominio_nome: toolArgs.condominio_nome,
        });
        setAtendimentoCriado(true);
        return true;
      } catch {
        return false;
      }
    },
    [createAtendimento, userName]
  );

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    let toolCallData = "";
    let toolCallName = "";
    let streamDone = false;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        throw new Error(errData?.error || "Erro na comunicação com a IA");
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length === updatedMessages.length + 1) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;

            if (delta?.content) {
              upsertAssistant(delta.content);
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function?.name) toolCallName = tc.function.name;
                if (tc.function?.arguments) toolCallData += tc.function.arguments;
              }
            }

            if (choice?.finish_reason === "tool_calls" && toolCallName === "agendar_atendimento") {
              try {
                const args = JSON.parse(toolCallData);
                const success = await handleToolCall(args);
                if (success) {
                  upsertAssistant(
                    "✅ **Atendimento registrado com sucesso!** O registro foi criado no sistema. Posso te ajudar com mais alguma coisa?"
                  );
                } else {
                  upsertAssistant(
                    "❌ Ocorreu um erro ao registrar o atendimento. Por favor, tente novamente."
                  );
                }
              } catch {
                upsertAssistant(
                  "❌ Erro ao processar os dados. Poderia repetir as informações?"
                );
              }
              toolCallData = "";
              toolCallName = "";
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      toast.error(e instanceof Error ? e.message : "Erro ao enviar mensagem");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setAtendimentoCriado(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Bot className="h-5 w-5" />
            Assistente IA - Novo Atendimento
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-[350px] max-h-[55vh] pr-2" ref={scrollRef}>
          <div className="space-y-3 pb-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {atendimentoCriado && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-accent text-accent-foreground text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Atendimento criado com sucesso!
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {atendimentoCriado && (
          <Button variant="outline" onClick={handleReset} className="w-full">
            Fechar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
