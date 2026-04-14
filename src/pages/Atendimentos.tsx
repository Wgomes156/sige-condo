import { useState, useMemo, useRef } from "react";
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
  const editAtendimentoRef = useRef<Atendimento | null>(null);

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
    // Fechamos outros modais antes de abrir a edição para evitar conflitos de Sheet/Dialog
    setIsDetalhesOpen(false);
    setIsFormOpen(false);
    setIsAssistenteOpen(false);
    
    setTimeout(() => {
      setSelectedAtendimento(atendimento);
      setIsEditOpen(true);
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground uppercase tracking-tight">Atendimentos</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerencie o histórico e documentos de cada atendimento
          </p>
        </div>
        {canCreate && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto border-orange-200 hover:bg-orange-50 text-orange-700" onClick={() => setIsAssistenteOpen(true)}>
              <Bot className="h-4 w-4 mr-2" /> Assistente IA
            </Button>
            <Button className="w-full sm:w-auto bg-orange-500 text-white hover:bg-orange-600 shadow-md font-bold" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Novo Atendimento
            </Button>
          </div>
        )}
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar cliente, telefone, condomínio..."
                  className="pl-10 h-11 border-slate-200 focus-visible:ring-orange-500"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <FiltrosAvancados filters={activeFilters} onFiltersChange={handleFiltersChange} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AtendimentosTable filters={activeFilters} onView={handleView} onEdit={handleEdit} />
        </CardContent>
      </Card>

      {/* Modais e Paineis */}
      <NovoAtendimentoForm open={isFormOpen} onOpenChange={setIsFormOpen} />
      <AssistenteIAChat open={isAssistenteOpen} onOpenChange={setIsAssistenteOpen} />
      
      {/* Componente de Visualização (Olho) */}
      <AtendimentoDetalhes 
        open={isDetalhesOpen} 
        onOpenChange={setIsDetalhesOpen} 
        atendimento={selectedAtendimento} 
        onEdit={handleEdit} 
      />

      {/* Componente de Edição (Lápis) - O Painel Lateral moderno */}
      <EditarAtendimentoDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        atendimento={selectedAtendimento} 
      />
    </div>
  );
}
