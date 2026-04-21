import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bot, Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useCreateAtendimento } from "@/hooks/useAtendimentos";
import { useAuth } from "@/hooks/useAuth";
import { useUnidadesMorador } from "@/hooks/usePortalMorador";
import { useCondominios } from "@/hooks/useCondominios";
import { useUnidades } from "@/hooks/useUnidades";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string; urgente?: boolean };

interface AssistenteIAChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UsuarioLogado {
  nome?: string;
  email?: string;
  telefone?: string;
  unidade?: string;
  condominio?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistente-atendimento`;

export function AssistenteIAChat({ open, onOpenChange }: AssistenteIAChatProps) {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [atendimentoCriado, setAtendimentoCriado] = useState(false);
  const [ultimoAtendimentoUrgente, setUltimoAtendimentoUrgente] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const createAtendimento = useCreateAtendimento();
  const { user, profile } = useAuth();
  const { data: unidadesMorador } = useUnidadesMorador();
  const condominioId = unidadesMorador?.[0]?.condominio_id;
  
  const { data: condominiosData } = useCondominios();
  const { data: unidadesData } = useUnidades(condominioId);

  // Build logged-in user data object
  const usuarioLogado: UsuarioLogado = {
    nome: profile?.nome || user?.user_metadata?.nome || user?.email?.split("@")[0] || undefined,
    email: profile?.email || user?.email || undefined,
    telefone: user?.user_metadata?.telefone || undefined,
    unidade: unidadesMorador && unidadesMorador.length > 0
      ? [unidadesMorador[0].bloco, unidadesMorador[0].numero_unidade].filter(Boolean).join(" - ") || unidadesMorador[0].codigo
      : undefined,
    condominio: unidadesMorador && unidadesMorador.length > 0
      ? unidadesMorador[0].condominios?.nome
      : undefined,
  };

  const nomeExibicao = usuarioLogado.nome || "morador(a)";

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Olá, ${nomeExibicao}! 👋 Sou a Ana, sua assistente virtual do CondoPlus.\n\nPosso te ajudar com dúvidas, registrar solicitações ou reclamações. Como posso te ajudar hoje?`,
        },
      ]);
      setAtendimentoCriado(false);
      setUltimoAtendimentoUrgente(false);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToolCall = useCallback(
    async (toolArgs: Record<string, unknown>) => {
      try {
        const isUrgente = toolArgs.urgente === true;
        const now = new Date();

        // Auto-fill from logged-in user when the AI didn't collect them
        const clienteNome = (toolArgs.cliente_nome as string) || usuarioLogado.nome || "";
        const clienteTelefone = (toolArgs.cliente_telefone as string) || usuarioLogado.telefone || "";
        const clienteEmail = (toolArgs.cliente_email as string) || usuarioLogado.email || undefined;
        const condominioNome = (toolArgs.condominio_nome as string) || usuarioLogado.condominio || "";

        // For urgencies, override the status
        const statusFinal = isUrgente ? "Urgente" : "Em andamento";
        const canalFinal = (toolArgs.canal as string) || "Chat";
        const motivoFinal = isUrgente && (!toolArgs.motivo || toolArgs.motivo === "Outros")
          ? "Emergência"
          : (toolArgs.motivo as string) || "Outros";

        await createAtendimento.mutateAsync({
          data: now.toISOString().split("T")[0],
          hora: now.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          operador_nome: usuarioLogado.nome || user?.email?.split("@")[0] || "",
          canal: canalFinal,
          status: statusFinal,
          motivo: motivoFinal,
          observacoes: (toolArgs.observacoes as string) || undefined,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          cliente_email: clienteEmail,
          condominio_nome: condominioNome,
        });

        setAtendimentoCriado(true);
        setUltimoAtendimentoUrgente(isUrgente);
        return true;
      } catch {
        return false;
      }
    },
    [createAtendimento, usuarioLogado, user]
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
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          usuarioLogado,
          condominiosInfo: condominiosData?.map(c => ({
            id: c.id,
            nome: c.nome,
            endereco: c.endereco,
            cidade: c.cidade,
            quantidade_unidades: c.quantidade_unidades,
            tipo_imovel: c.tipo_imovel,
          })) || [],
          unidadesInfo: unidadesData?.map(u => ({
            codigo: u.codigo,
            bloco: u.bloco,
            morador_nome: u.morador_nome,
            condominio: u.condominios?.nome,
            ativa: u.ativa,
          })) || [],
        }),
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

            if (
              choice?.finish_reason === "tool_calls" &&
              toolCallName === "agendar_atendimento"
            ) {
              try {
                const args = JSON.parse(toolCallData);
                const isUrgente = args.urgente === true;
                const success = await handleToolCall(args);
                if (success) {
                  const successMsg = isUrgente
                    ? "🚨 **SITUAÇÃO DE EMERGÊNCIA REGISTRADA!** O síndico e a administração foram notificados imediatamente. Por favor, mantenha a calma e siga as orientações de segurança. Posso te ajudar com mais alguma coisa?"
                    : "✅ **Atendimento registrado com sucesso!** Em breve a equipe responsável entrará em contato. Posso te ajudar com mais alguma coisa?";
                  upsertAssistant(successMsg);
                } else {
                  upsertAssistant(
                    "Ocorreu um erro ao registrar o atendimento. Por favor, tente novamente ou entre em contato diretamente com a administração."
                  );
                }
              } catch {
                upsertAssistant(
                  "Ocorreu um erro ao processar os dados. Poderia repetir as informações?"
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
          content: "Desculpe, ocorreu um erro. Por favor, tente novamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setAtendimentoCriado(false);
    setUltimoAtendimentoUrgente(false);
    onOpenChange(false);
  };

  const handleNovaConversa = () => {
    setMessages([]);
    setAtendimentoCriado(false);
    setUltimoAtendimentoUrgente(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "flex flex-col p-0 gap-0 overflow-hidden shadow-2xl",
        isMobile ? "w-screen h-[100dvh] max-w-none rounded-none border-none" : "max-w-2xl w-full h-[750px] max-h-[85vh] rounded-2xl"
      )}>
        <DialogHeader className={cn(
          "px-4 py-3 border-b flex-row items-center gap-3 space-y-0",
          isMobile ? "h-14" : ""
        )}>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="-ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <DialogTitle className="flex items-center gap-3 text-primary text-base sm:text-lg">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-orange-200 shrink-0">
              <img src="/ana-avatar.png" alt="Ana" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                Ana — Assistente Virtual
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none text-[10px] font-bold px-1.5 py-0">
                  IA
                </Badge>
              </div>
              <span className="text-[10px] text-slate-500 font-normal">Sempre pronta para ajudar</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div 
          className={cn(
            "flex-1 px-4 py-4 overflow-y-auto custom-scrollbar",
            isMobile ? "h-full" : "min-h-[400px]"
          )} 
          ref={scrollRef}
        >
          <div className="space-y-4 pb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    msg.role === "user"
                      ? "bg-orange-500 text-white rounded-tr-none font-medium"
                      : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-2 border border-slate-200 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Ana está digitando...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "p-4 border-t bg-background sticky bottom-0",
          isMobile ? "pb-8" : ""
        )}>
          {atendimentoCriado && (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-md text-sm mb-3",
                ultimoAtendimentoUrgente
                  ? "bg-destructive/10 text-destructive border border-destructive/30"
                  : "bg-accent text-accent-foreground"
              )}
            >
              {ultimoAtendimentoUrgente ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <span className="font-medium">
                {ultimoAtendimentoUrgente
                  ? "Emergência registrada — síndico notificado!"
                  : "Atendimento criado com sucesso!"}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              disabled={isLoading}
              className="h-12 sm:h-10 text-base sm:text-sm shadow-sm"
            />
            <Button
              size="icon"
              className="h-12 w-12 sm:h-10 sm:w-10 shrink-0"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {atendimentoCriado && (
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={handleNovaConversa} className="flex-1 h-11 sm:h-9">
                Nova conversa
              </Button>
              {!isMobile && (
                <Button variant="default" onClick={handleReset} className="flex-1 h-11 sm:h-9">
                  Fechar
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
