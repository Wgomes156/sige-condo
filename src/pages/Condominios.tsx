import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { CondominiosTable } from "@/components/condominios/CondominiosTable";
import { CondominioForm } from "@/components/condominios/CondominioForm";
import { CondominioDetalhes } from "@/components/condominios/CondominioDetalhes";
import { DashboardCondominiosCards } from "@/components/condominios/DashboardCondominiosCards";
import { Condominio, CondominioFilters } from "@/hooks/useCondominios";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";

export default function Condominios() {
  const [busca, setBusca] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [condominioSelecionado, setCondominioSelecionado] = useState<Condominio | null>(null);
  const { userRole } = useAuth();
  
  const buscaDebounced = useDebounce(busca, 300);
  const canCreate = userRole !== "morador";

  const filters: CondominioFilters = {
    busca: buscaDebounced || undefined,
  };

  const handleNovoCondominio = () => {
    setCondominioSelecionado(null);
    setFormOpen(true);
  };

  const handleEdit = (condominio: Condominio) => {
    setCondominioSelecionado(condominio);
    setFormOpen(true);
  };

  const handleView = (condominio: Condominio) => {
    setCondominioSelecionado(condominio);
    setDetalhesOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setCondominioSelecionado(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Condomínios</h2>
          <p className="text-muted-foreground">
            Gerencie os condomínios cadastrados
          </p>
        </div>
        {canCreate && (
          <Button 
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={handleNovoCondominio}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Condomínio
          </Button>
        )}
      </div>

      <DashboardCondominiosCards />

      <Card className="bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ, endereço, cidade, síndico..."
                className="pl-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CondominiosTable
            filters={filters}
            onEdit={handleEdit}
            onView={handleView}
          />
        </CardContent>
      </Card>

      <CondominioForm
        open={formOpen}
        onOpenChange={handleFormClose}
        condominio={condominioSelecionado}
      />

      <CondominioDetalhes
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        condominio={condominioSelecionado}
      />
    </div>
  );
}
