import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DemandaCondominio, getStatusInfo } from "@/hooks/useDemandas";
import { cn } from "@/lib/utils";

interface Props {
  demandas: DemandaCondominio[];
  condominioNome?: string;
}

interface DemandaCalendario {
  data: Date;
  demanda: DemandaCondominio;
  tipo: "proxima" | "ultima";
}

const STATUS_COLOR: Record<string, string> = {
  urgente:    "bg-red-500",
  atencao:    "bg-yellow-500",
  vencido:    "bg-gray-800",
  em_dia:     "bg-green-500",
  sob_demanda:"bg-gray-400",
};

export function CalendarioDemandas({ demandas, condominioNome }: Props) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  // Monta o mapa de demandas por dia
  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, DemandaCalendario[]>();

    demandas.forEach((d) => {
      const adicionar = (dataStr: string | null, tipo: "proxima" | "ultima") => {
        if (!dataStr) return;
        try {
          const data = parseISO(dataStr);
          const key = format(data, "yyyy-MM-dd");
          if (!mapa.has(key)) mapa.set(key, []);
          mapa.get(key)!.push({ data, demanda: d, tipo });
        } catch {
          // data inválida
        }
      };
      adicionar(d.proxima_execucao, "proxima");
      adicionar(d.ultima_execucao, "ultima");
    });

    return mapa;
  }, [demandas]);

  // Dias do calendário (inclui dias do mês anterior/próximo para completar a grade)
  const diasCalendario = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 });
    const fim = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 });
    const dias: Date[] = [];
    let d = inicio;
    while (d <= fim) {
      dias.push(d);
      d = addDays(d, 1);
    }
    return dias;
  }, [mesAtual]);

  const eventosDodia = diaSelecionado
    ? eventosPorDia.get(format(diaSelecionado, "yyyy-MM-dd")) ?? []
    : [];

  const getDemandaNoBadge = (dia: Date) => {
    const key = format(dia, "yyyy-MM-dd");
    return eventosPorDia.get(key) ?? [];
  };

  const MAX_BADGES = 3; // máx de bolinhas visíveis por dia

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Calendário de Demandas
              {condominioNome && (
                <span className="text-sm font-normal text-muted-foreground">— {condominioNome}</span>
              )}
            </CardTitle>

            {/* Navegação de meses */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMesAtual((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[130px] text-center capitalize">
                {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMesAtual((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setMesAtual(new Date()); setDiaSelecionado(null); }}
              >
                Hoje
              </Button>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Urgente / Vencido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 inline-block" /> Atenção (≤30 dias)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" /> Em dia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400 inline-block" /> Última execução
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-4">
          <div className="px-4">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 mb-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div
                  key={d}
                  className="h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grade de dias */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
              {diasCalendario.map((dia, idx) => {
                const eventos = getDemandaNoBadge(dia);
                const isMesAtual = isSameMonth(dia, mesAtual);
                const isHoje = isToday(dia);
                const isSelecionado = diaSelecionado ? isSameDay(dia, diaSelecionado) : false;
                const temEventos = eventos.length > 0;

                // Cor de fundo se dia selecionado ou hoje
                const bgClass = cn(
                  "bg-background min-h-[72px] p-1.5 cursor-pointer transition-colors hover:bg-muted/50 flex flex-col gap-0.5",
                  !isMesAtual && "opacity-40",
                  isSelecionado && "bg-primary/10 hover:bg-primary/15",
                );

                return (
                  <div
                    key={idx}
                    className={bgClass}
                    onClick={() => {
                      if (temEventos) {
                        setDiaSelecionado(isSelecionado ? null : dia);
                      }
                    }}
                  >
                    {/* Número do dia */}
                    <div className="flex justify-end">
                      <span
                        className={cn(
                          "h-6 w-6 flex items-center justify-center rounded-full text-xs font-medium",
                          isHoje && "bg-primary text-primary-foreground font-bold",
                          !isHoje && isSelecionado && "bg-primary/20 text-primary",
                          !isHoje && !isSelecionado && "text-foreground",
                        )}
                      >
                        {format(dia, "d")}
                      </span>
                    </div>

                    {/* Bolinhas de eventos */}
                    {eventos.length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {eventos.slice(0, MAX_BADGES).map((ev, i) => {
                          const corStatus =
                            ev.tipo === "ultima"
                              ? "bg-gray-400"
                              : STATUS_COLOR[ev.demanda.status] ?? "bg-gray-400";
                          const catCor = ev.demanda.categoria?.cor;

                          return (
                            <Tooltip key={i}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "rounded text-[10px] leading-tight px-1 py-px text-white truncate cursor-default",
                                    corStatus,
                                  )}
                                  style={
                                    catCor && ev.tipo === "proxima"
                                      ? { backgroundColor: catCor }
                                      : undefined
                                  }
                                >
                                  {ev.demanda.categoria?.icone}{" "}
                                  <span className="hidden sm:inline">{ev.demanda.nome}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px]">
                                <p className="font-semibold">{ev.demanda.nome}</p>
                                <p className="text-xs opacity-80">
                                  {ev.tipo === "proxima" ? "Próxima execução" : "Última execução"}:{" "}
                                  {format(ev.data, "dd/MM/yyyy")}
                                </p>
                                <p className="text-xs opacity-80">
                                  Status: {getStatusInfo(ev.demanda.status).label}
                                </p>
                                {ev.demanda.categoria && (
                                  <p className="text-xs opacity-80">
                                    Categoria: {ev.demanda.categoria.icone} {ev.demanda.categoria.nome}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                        {eventos.length > MAX_BADGES && (
                          <span className="text-[10px] text-muted-foreground pl-1">
                            +{eventos.length - MAX_BADGES} mais
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Painel lateral de detalhes do dia */}
          {diaSelecionado && eventosDodia.length > 0 && (
            <div className="mx-4 mt-4 rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold capitalize">
                  {format(diaSelecionado, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setDiaSelecionado(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="max-h-64">
                <div className="space-y-2 pr-2">
                  {eventosDodia.map((ev, i) => {
                    const info = getStatusInfo(ev.demanda.status);
                    const catCor = ev.demanda.categoria?.cor ?? "#6B7280";
                    return (
                      <div
                        key={i}
                        className="rounded-md border bg-background p-3 space-y-1.5 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold leading-tight">{ev.demanda.nome}</p>
                          <div className="flex gap-1.5 shrink-0">
                            <Badge
                              className="text-[10px] px-2 py-0"
                              style={{ backgroundColor: catCor, color: "#fff", border: "none" }}
                            >
                              {ev.demanda.categoria?.icone} {ev.demanda.categoria?.nome ?? "Sem categoria"}
                            </Badge>
                            <Badge
                              className={cn("text-[10px] px-2 py-0 text-white border-none", info.color)}
                            >
                              {info.label}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {ev.tipo === "proxima" ? "📅 Próxima execução" : "✅ Última execução"}:{" "}
                            <span className="text-foreground font-medium">
                              {format(ev.data, "dd/MM/yyyy")}
                            </span>
                          </span>
                          <span>
                            🔄 {ev.demanda.periodicidade === "sob_demanda"
                              ? "Sob demanda"
                              : ev.demanda.periodicidade}
                          </span>
                          {ev.demanda.custo_estimado > 0 && (
                            <span>
                              💰 R$ {ev.demanda.custo_estimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>

                        {ev.demanda.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ev.demanda.descricao}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
