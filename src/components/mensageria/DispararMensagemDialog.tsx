import { useState, useEffect } from "react";
import { Mail, MessageSquare, Bell, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCondominios } from "@/hooks/useCondominios";
import { useDispararMensagem, type CanalMensageria } from "@/hooks/useMensageria";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comunicado_id?: string;
  comunicado_titulo?: string;
}

const MAX_CHARS = 1000;

export function DispararMensagemDialog({
  open,
  onOpenChange,
  comunicado_id,
  comunicado_titulo,
}: Props) {
  const [escopo, setEscopo] = useState<"todos" | "condominio">("todos");
  const [condominioId, setCondominioId] = useState<string>("");
  const [canais, setCanais] = useState<CanalMensageria[]>(["inapp"]);
  const [assunto, setAssunto] = useState(comunicado_titulo ?? "");
  const [mensagem, setMensagem] = useState("");

  const { data: condominios = [], isLoading: loadingCondominios } = useCondominios();
  const disparar = useDispararMensagem();

  // Sincroniza título quando muda via props
  useEffect(() => {
    if (comunicado_titulo) setAssunto(comunicado_titulo);
  }, [comunicado_titulo]);

  // Limpa ao fechar
  useEffect(() => {
    if (!open) {
      setEscopo("todos");
      setCondominioId("");
      setCanais(["inapp"]);
      setAssunto(comunicado_titulo ?? "");
      setMensagem("");
    }
  }, [open, comunicado_titulo]);

  const toggleCanal = (canal: CanalMensageria) => {
    setCanais((prev) =>
      prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal],
    );
  };

  const podeEnviar =
    canais.length > 0 &&
    assunto.trim().length > 0 &&
    mensagem.trim().length > 0 &&
    (escopo === "todos" ? true : condominioId !== "");

  const handleEnviar = async () => {
    if (!podeEnviar) return;

    // Se escopo=todos mas sem filtro de condomínio não temos condominio_id —
    // iterar por todos os condomínios em sequência
    if (escopo === "todos") {
      for (const condo of condominios) {
        await disparar.mutateAsync({
          condominio_id: condo.id,
          canais,
          assunto: assunto.trim(),
          mensagem: mensagem.trim(),
          comunicado_id,
        });
      }
    } else {
      await disparar.mutateAsync({
        condominio_id: condominioId,
        canais,
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        comunicado_id,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Disparar Mensagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Destinatários */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Destinatários</Label>
            <RadioGroup
              value={escopo}
              onValueChange={(v) => setEscopo(v as "todos" | "condominio")}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="todos" id="r-todos" />
                <Label htmlFor="r-todos" className="cursor-pointer font-normal">
                  Todos os moradores
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="condominio" id="r-condo" />
                <Label htmlFor="r-condo" className="cursor-pointer font-normal">
                  Por condomínio
                </Label>
              </div>
            </RadioGroup>

            {escopo === "condominio" && (
              <Select value={condominioId} onValueChange={setCondominioId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingCondominios ? "Carregando..." : "Selecione um condomínio"} />
                </SelectTrigger>
                <SelectContent>
                  {condominios.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Canais */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Canais de envio</Label>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  { key: "email", label: "E-mail", icon: Mail },
                  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                  { key: "inapp", label: "In-app", icon: Bell },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={canais.includes(key)}
                    onCheckedChange={() => toggleCanal(key)}
                  />
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Assunto */}
          <div className="space-y-1.5">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Aviso importante do condomínio"
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="mensagem">Mensagem</Label>
              <span
                className={`text-xs ${mensagem.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground"}`}
              >
                {mensagem.length}/{MAX_CHARS}
              </span>
            </div>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Digite o conteúdo da mensagem..."
              rows={5}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleEnviar} disabled={!podeEnviar || disparar.isPending}>
            {disparar.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
