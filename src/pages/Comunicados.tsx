import { useState } from "react";
import { Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComunicadosTable } from "@/components/comunicados/ComunicadosTable";
import { NovoComunicadoForm } from "@/components/comunicados/NovoComunicadoForm";
import { useComunicados, Comunicado } from "@/hooks/useComunicados";
import { useCondominios } from "@/hooks/useCondominios";
import { useAuth } from "@/hooks/useAuth";

export default function Comunicados() {
  const [showForm, setShowForm] = useState(false);
  const [comunicadoEdit, setComunicadoEdit] = useState<Comunicado | null>(null);
  const [filtroCondominio, setFiltroCondominio] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const { userRole } = useAuth();

  const { data: condominios } = useCondominios();
  const canCreate = userRole !== "morador";
  const { data: comunicados, isLoading } = useComunicados(
    filtroCondominio !== "todos" ? filtroCondominio : undefined
  );

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
    if (!open) {
      setComunicadoEdit(null);
    }
  };

  const comunicadosAtivos = comunicadosFiltrados?.filter((c) => c.ativo).length || 0;
  const comunicadosUrgentes = comunicadosFiltrados?.filter((c) => c.tipo === "urgente" && c.ativo).length || 0;

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Comunicados</CardTitle>
            <div className="flex gap-2">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[250px]">
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
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <ComunicadosTable
              comunicados={comunicadosFiltrados || []}
              onEdit={handleEdit}
            />
          )}
        </CardContent>
      </Card>

      <NovoComunicadoForm
        open={showForm}
        onOpenChange={handleCloseForm}
        comunicadoEdit={comunicadoEdit}
      />
    </div>
  );
}
