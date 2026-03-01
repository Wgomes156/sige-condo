import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTemplatesDemanda, useCategoriasDemanda, useImportarTemplates, DemandaCondominio, getPeriodicidadeLabel } from "@/hooks/useDemandas";
import { Loader2, CheckCircle2 } from "lucide-react";

interface ImportarTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominioId: string;
  demandasExistentes: DemandaCondominio[];
}

export function ImportarTemplatesDialog({ open, onOpenChange, condominioId, demandasExistentes }: ImportarTemplatesDialogProps) {
  const { data: templates = [] } = useTemplatesDemanda();
  const { data: categorias = [] } = useCategoriasDemanda();
  const importarTemplates = useImportarTemplates();

  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  // Agrupar templates por categoria
  const templatesPorCategoria = useMemo(() => {
    return categorias.map((cat) => ({
      ...cat,
      templates: templates.filter((t) => t.categoria_id === cat.id),
    })).filter((cat) => cat.templates.length > 0);
  }, [templates, categorias]);

  // IDs de templates já importados
  const templatesJaImportados = useMemo(() => {
    return new Set(demandasExistentes.map((d) => d.template_id).filter(Boolean));
  }, [demandasExistentes]);

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const disponíveis = templates
      .filter((t) => !templatesJaImportados.has(t.id))
      .map((t) => t.id);
    setSelectedTemplates(disponíveis);
  };

  const deselectAll = () => {
    setSelectedTemplates([]);
  };

  const handleImportar = async () => {
    if (selectedTemplates.length === 0) return;
    
    await importarTemplates.mutateAsync({
      condominioId,
      templateIds: selectedTemplates,
    });
    
    onOpenChange(false);
    setSelectedTemplates([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Templates de Serviços</DialogTitle>
          <DialogDescription>
            Selecione os serviços pré-cadastrados que deseja adicionar ao condomínio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {selectedTemplates.length} selecionado(s)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Selecionar Todos
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Limpar Seleção
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {templatesPorCategoria.map((cat) => (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: cat.cor }}>
                  <span className="text-lg">{getIconEmoji(cat.icone)}</span>
                  <span>{cat.nome}</span>
                  <span className="text-muted-foreground">({cat.templates.length})</span>
                </div>
                
                <div className="space-y-2 pl-6">
                  {cat.templates.map((template) => {
                    const jaImportado = templatesJaImportados.has(template.id);
                    const selecionado = selectedTemplates.includes(template.id);
                    
                    return (
                      <div
                        key={template.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          jaImportado ? "bg-muted/50 opacity-60" : selecionado ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <Checkbox
                          checked={selecionado || jaImportado}
                          onCheckedChange={() => !jaImportado && toggleTemplate(template.id)}
                          disabled={jaImportado}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{template.nome}</span>
                            {template.obrigatorio && (
                              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                            )}
                            {jaImportado && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Já importado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{getPeriodicidadeLabel(template.periodicidade)}</span>
                            {template.base_legal && <span>• {template.base_legal}</span>}
                          </div>
                          {template.descricao && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {template.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImportar}
            disabled={selectedTemplates.length === 0 || importarTemplates.isPending}
          >
            {importarTemplates.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importar {selectedTemplates.length} Serviço(s)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getIconEmoji(iconName: string): string {
  const iconMap: Record<string, string> = {
    Droplets: "💧",
    Bug: "🐛",
    Building2: "🏗️",
    Flame: "🔥",
    FileText: "📄",
    TreePine: "🌳",
    Sparkles: "✨",
    Settings: "⚙️",
    Wrench: "🔧",
  };
  return iconMap[iconName] || "📁";
}
