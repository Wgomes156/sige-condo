import { useState } from "react";
import { Plus, Megaphone } from "lucide-react";
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
import { ComunicadosTable } from "@/components/comunicados/ComunicadosTable";
import { NovoComunicadoForm } from "@/components/comunicados/NovoComunicadoForm";
import { EntregasTable } from "@/components/mensageria/EntregasTable";
import { DispararMensagemDialog } from "@/components/mensageria/DispararMensagemDialog";
import { useComunicados, Comunicado } from "@/hooks/useComunicados";
import { useCondominios } from "@/hooks/useCondominios";
import { useMensageriaEntregas } from "@/hooks/useMensageria";
import { useAuth } from "@/hooks/useAuth";

export default function Comunicados() {
  const [showForm, setShowForm] = useState(false);
  const [comunicadoEdit, setComunicadoEdit] = useState<Comunicado | null>(null);
  const [filtroCondominio, setFiltroCondominio] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [activeTab, setActiveTab] = useState("lista");

  // Estado para o disparo de mensagem via Mensageria
  const [dispararOpen, setDispararOpen] = useState(false);
  const [comunicadoParaEnvio, setComunicadoParaEnvio] = useState<Comunicado | null>(null);

  // Estado para aba "Histórico de Envios" — comunicado selecionado para ver histórico
  const [comunicadoHistorico, setComunicadoHistorico] = useState<Comunicado | null>(null);

  const { userRole } = useAuth();
  const { data: condominios } = useCondominios();
  const canCreate = userRole !== "morador";

  const { data: comunicados, isLoading } = useComunicados(
    filtroCondominio !== "todos" ? filtroCondominio : undefined,
  );

  const { data: entregasHistorico = [], isLoading: loadingHistorico } = useMensageriaEntregas(
    comunicadoHistorico ? { condominioId: comunicadoHistorico.condominio_id } : undefined,
  );

  // Filtrar entregasHistorico pelo comunicado_id selecionado
  const entregasFiltradas = comunicadoHistorico
    ? entregasHistorico.filter((e) => e.comunicado_id === comunicadoHistorico.id)
    : [];

  const tipoOptions = [
    { value: "aviso", label: "Aviso" },
    { value: "urgente", label: "Urgente" },
    { value: "manutencao", label: "Manutenção" },
    { value: "assembleia", label: "Assembleia" },
    { value: "financeiro", label: "Financeiro" },
  ];

  const comunicadosFiltrados = comunicados?.filter((c) => {
    if (filtroTipo !== "todos" && c.tipo !== filtroTipo) return false;
    return true;
  });

  const handleEdit = (comunicado: Comunicado) => {
    setComunicadoEdit(comunicado);
    setShowForm(true);
  };

  const handleCloseForm = (open: boolean) => {
    setShowForm(open);
    if (!open) setComunicadoEdit(null);
  };

  const handleEnviarMoradores = (comunicado: Comunicado) => {
    setComunicadoParaEnvio(comunicado);
    setDispararOpen(true);
  };

  const handleVerHistorico = (comunicado: Comunicado) => {
    setComunicadoHistorico(comunicado);
    setActiveTab("historico");
  };

  const comunicadosAtivos = comunicadosFiltrados?.filter((c) => c.ativo).length || 0;
  const comunicadosUrgentes =
    comunicadosFiltrados?.filter((c) => c.tipo === "urgente" && c.ativo).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comunicados</h1>
          <p className="text-muted-foreground">
            Gerencie os comunicados para os moradores
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Comunicado
          </Button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comunicadosFiltrados?.length || 0}</div>
            <p className="text-xs text-muted-foreground">comunicados cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Megaphone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comunicadosAtivos}</div>
            <p className="text-xs text-muted-foreground">visíveis para moradores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <Megaphone className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comunicadosUrgentes}</div>
            <p className="text-xs text-muted-foreground">requerem atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista de Comunicados</TabsTrigger>
          <TabsTrigger value="historico" disabled={!comunicadoHistorico}>
            {comunicadoHistorico
              ? `Envios: ${comunicadoHistorico.titulo.slice(0, 30)}${comunicadoHistorico.titulo.length > 30 ? "…" : ""}`
              : "Histórico de Envios"}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Lista */}
        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle>Lista de Comunicados</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      {tipoOptions.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filtroCondominio} onValueChange={setFiltroCondominio}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Filtrar por condomínio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os condomínios</SelectItem>
                      {condominios?.map((cond) => (
                        <SelectItem key={cond.id} value={cond.id}>
                          {cond.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : (
                <ComunicadosTable
                  comunicados={comunicadosFiltrados || []}
                  onEdit={handleEdit}
                  onEnviarMoradores={canCreate ? handleEnviarMoradores : undefined}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Histórico de Envios */}
        <TabsContent value="historico" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Histórico de Envios — {comunicadoHistorico?.titulo}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Entregas registradas via Mensageria para este comunicado
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setComunicadoHistorico(null);
                    setActiveTab("lista");
                  }}
                >
                  Voltar à lista
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EntregasTable entregas={entregasFiltradas} isLoading={loadingHistorico} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Novo Comunicado */}
      <NovoComunicadoForm
        open={showForm}
        onOpenChange={handleCloseForm}
        comunicadoEdit={comunicadoEdit}
      />

      {/* Dialog: Disparar Mensagem */}
      <DispararMensagemDialog
        open={dispararOpen}
        onOpenChange={(open) => {
          setDispararOpen(open);
          if (!open) setComunicadoParaEnvio(null);
        }}
        comunicado_id={comunicadoParaEnvio?.id}
        comunicado_titulo={comunicadoParaEnvio?.titulo}
      />
    </div>
  );
}
