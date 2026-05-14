import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEntregasInApp, useMarcarLida } from "@/hooks/useMensageria";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatarData(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
  } catch {
    return "";
  }
}

export function NotificacaoInAppBadge() {
  const { data: entregas = [], isLoading } = useEntregasInApp();
  const marcarLida = useMarcarLida();

  const naoLidas = entregas.filter((e) => e.status !== "lido");
  const contagem = naoLidas.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 sm:h-10 sm:w-10"
          aria-label={`Notificações${contagem > 0 ? ` — ${contagem} não lidas` : ""}`}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {contagem > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center rounded-full pointer-events-none"
            >
              {contagem > 99 ? "99+" : contagem}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {contagem > 0 && (
            <span className="text-xs text-muted-foreground">{contagem} não lida{contagem !== 1 ? "s" : ""}</span>
          )}
        </div>

        <Separator />

        {isLoading ? (
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : entregas.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Nenhuma notificação
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <ul className="divide-y divide-border">
              {entregas.map((entrega) => {
                const lida = entrega.status === "lido";
                return (
                  <li
                    key={entrega.id}
                    className={`px-4 py-3 flex gap-3 ${lida ? "opacity-60" : "bg-accent/5"}`}
                  >
                    <div
                      className={`mt-1 h-2 w-2 rounded-full shrink-0 ${lida ? "bg-transparent" : "bg-primary"}`}
                    />
                    <div className="flex-1 min-w-0">
                      {entrega.assunto && (
                        <p className="text-sm font-medium truncate leading-tight">
                          {entrega.assunto}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {entrega.mensagem}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {formatarData(entrega.criado_em)}
                        </span>
                        {!lida && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-primary hover:text-primary"
                            disabled={marcarLida.isPending}
                            onClick={() => marcarLida.mutate(entrega.id)}
                          >
                            {marcarLida.isPending && marcarLida.variables === entrega.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Lida
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
