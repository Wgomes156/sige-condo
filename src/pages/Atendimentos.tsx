import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Bot } from "lucide-react";
import { NovoAtendimentoForm } from "@/components/atendimentos/NovoAtendimentoForm";
import { AssistenteIAChat } from "@/components/atendimentos/AssistenteIAChat";
import { AtendimentosTable } from "@/components/atendimentos/AtendimentosTable";
import { AtendimentoDetalhes } from "@/components/atendimentos/AtendimentoDetalhes";
import { EditarAtendimentoDialog } from "@/components/atendimentos/EditarAtendimentoDialog";
import { FiltrosAvancados } from "@/components/atendimentos/FiltrosAvancados";
import type { AtendimentoFilters, Atendimento } from "@/hooks/useAtendimentos";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";

export default function Atendimentos() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssistenteOpen, setIsAssistenteOpen] = useState(false);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const [filters, setFilters] = useState<AtendimentoFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const { userRole } = useAuth();

  const debouncedSearch = useDebounce(searchInput, 300);
  const canCreate = userRole !== "morador";

  const activeFilters = useMemo(() => ({
    ...filters,
    busca: debouncedSearch || undefined,
  }), [filters, debouncedSearch]);

  const handleFiltersChange = (newFilters: AtendimentoFilters) => {
    setFilters(newFilters);
  };

  const handleView = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento);
    setIsDetalhesOpen(true);
  };

  const handleEdit = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Atendimentos</h2>
          <p className="text-muted-foreground">
            Gerencie todos os atendimentos do sistema
          </p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAssistenteOpen(true)}
            >
              <Bot className="h-4 w-4 mr-2" />
              Assistente IA
            </Button>
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Atendimento
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, telefone, condomínio, operador..."
                  className="pl-10"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <FiltrosAvancados
                filters={activeFilters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AtendimentosTable filters={activeFilters} onView={handleView} onEdit={handleEdit} />
        </CardContent>
      </Card>

      <NovoAtendimentoForm open={isFormOpen} onOpenChange={setIsFormOpen} />
      <AssistenteIAChat open={isAssistenteOpen} onOpenChange={setIsAssistenteOpen} />
      <AtendimentoDetalhes 
        open={isDetalhesOpen} 
        onOpenChange={setIsDetalhesOpen} 
        atendimento={selectedAtendimento} 
      />
      <EditarAtendimentoDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        atendimento={selectedAtendimento}
      />
    </div>
  );
}
