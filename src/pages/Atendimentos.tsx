import { useState, useMemo, useRef, useEffect } from "react";
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

  // Estado separado para o painel de detalhes (visualização)
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);

  // Estado dedicado para o dialog de edição — preservado durante animação de fechamento
  const [editAtendimento, setEditAtendimento] = useState<Atendimento | null>(null);
  const editAtendimentoRef = useRef<Atendimento | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Contador incremental: garante remontagem total do dialog a cada clique no lápis,
  // independente de qual registro foi selecionado (corrige o bug do "primeiro registro").
  const [editKey, setEditKey] = useState(0);

  // Limpa timeouts e fecha todos os paineis ao desmontar (evita erro removeChild no Radix UI)
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      // Força fechamento imediato dos Sheets para o Radix UI não tentar limpar portals
      // em nós de DOM que já foram removidos pelo React Router na troca de página
      setIsFormOpen(false);
      setIsAssistenteOpen(false);
      setIsDetalhesOpen(false);
      setIsEditOpen(false);
    };
  }, []);

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
    // Cancela todos os timeouts pendentes
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    editAtendimentoRef.current = atendimento;
    setEditAtendimento(atendimento);
    // Incrementa o contador: FORÇA remontagem do dialog independente da ID do registro.
    // Isso corrige o bug onde clicar no 2º/3º/4º registro abria o 1º.
    setEditKey(k => k + 1);

    setIsEditOpen(false);
    setIsDetalhesOpen(false);
    setSelectedAtendimento(null);

    const delay = isDetalhesOpen ? 320 : 50;
    const t1 = setTimeout(() => {
      setIsEditOpen(true);
    }, delay);
    timeoutsRef.current.push(t1);
  };

  const handleEditOpenChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      // Mantém os dados por tempo suficiente para a animação de saída (~400ms)
      const t2 = setTimeout(() => {
        setEditAtendimento(null);
        editAtendimentoRef.current = null;
      }, 400);
      timeoutsRef.current.push(t2);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-orange-600 uppercase tracking-tight italic">
            ATENDIMENTOS
          </h2>
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
      {/* editKey incrementa a cada clique no lápis, forçando remontagem total
          do componente (e do useForm) para cada registro selecionado. */}
      <EditarAtendimentoDialog
        key={editKey}
        open={isEditOpen}
        onOpenChange={handleEditOpenChange}
        atendimento={editAtendimento}
      />
    </div>
  );
}
