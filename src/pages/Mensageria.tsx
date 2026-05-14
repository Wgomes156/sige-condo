import { useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MensageriaStats } from "@/components/mensageria/MensageriaStats";
import { EntregasTable } from "@/components/mensageria/EntregasTable";
import { DispararMensagemDialog } from "@/components/mensageria/DispararMensagemDialog";
import { ConfiguracaoCanaisForm } from "@/components/mensageria/ConfiguracaoCanaisForm";
import {
  useEstatisticasMensageria,
  useMensageriaEntregas,
  type CanalMensageria,
  type StatusEntrega,
} from "@/hooks/useMensageria";
import { useCondominios } from "@/hooks/useCondominios";
import { useAuth } from "@/hooks/useAuth";

export default function Mensageria() {
  const [novaMensagemOpen, setNovaMensagemOpen] = useState(false);
  const [filtroCondominio, setFiltroCondominio] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroCanal, setFiltroCanal] = useState<string>("todos");

  const { userRole } = useAuth();
  const podeConfigurar = ["admin", "sindico"].includes(userRole ?? "");

  const condominioIdFiltro = filtroCondominio !== "todos" ? filtroCondominio : undefined;

  const { data: stats, isLoading: loadingStats } = useEstatisticasMensageria(condominioIdFiltro);
  const { data: entregas = [], isLoading: loadingEntregas } = useMensageriaEntregas({
    condominioId: condominioIdFiltro,
    status: filtroStatus !== "todos" ? (filtroStatus as StatusEntrega) : undefined,
    canal: filtroCanal !== "todos" ? (filtroCanal as CanalMensageria) : undefined,
  });
  const { data: condominios = [] } = useCondominios();

  // Para o ConfiguracaoCanaisForm precisamos de um condomínio selecionado
  const condominioConfig = condominioIdFiltro ?? condominios[0]?.id ?? "";

  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: "todos", label: "Todos os status" },
    { value: "pendente", label: "Pendente" },
    { value: "enviando", label: "Enviando" },
    { value: "enviado", label: "Enviado" },
    { value: "falhou", label: "Falhou" },
    { value: "lido", label: "Lido" },
  ];

  const CANAL_OPTIONS: { value: string; label: string }[] = [
    { value: "todos", label: "Todos os canais" },
    { value: "email", label: "E-mail" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "inapp", label: "In-app" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mensageria</h1>
          <p className="text-muted-foreground">
            Dispare e acompanhe mensagens para moradores por e-mail, WhatsApp e notificações in-app
          </p>
        </div>
        <Button onClick={() => setNovaMensagemOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Mensagem
        </Button>
      </div>

      {/* Stats */}
      <MensageriaStats dados={stats} isLoading={loadingStats} />

      {/* Tabs */}
      <Tabs defaultValue="entregas">
        <TabsList>
          <TabsTrigger value="entregas" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Entregas
          </TabsTrigger>
          {podeConfigurar && (
            <TabsTrigger value="configuracao">
              Configuração
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Entregas */}
        <TabsContent value="entregas" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base">Histórico de Entregas</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Select value={filtroCondominio} onValueChange={setFiltroCondominio}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Condomínio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os condomínios</SelectItem>
                      {condominios.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroCanal} onValueChange={setFiltroCanal}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANAL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EntregasTable entregas={entregas} isLoading={loadingEntregas} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuração */}
        {podeConfigurar && (
          <TabsContent value="configuracao" className="mt-4">
            {condominioConfig ? (
              <ConfiguracaoCanaisForm condominioId={condominioConfig} />
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm border rounded-lg">
                Selecione um condomínio no filtro acima para configurar os canais.
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <DispararMensagemDialog
        open={novaMensagemOpen}
        onOpenChange={setNovaMensagemOpen}
      />
    </div>
  );
}
