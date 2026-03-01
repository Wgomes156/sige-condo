import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDemandaDetalhes, useFornecedores, useRegistrarExecucao, getPeriodicidadeLabel } from "@/hooks/useDemandas";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RegistrarExecucaoDialogProps {
  demandaId: string | null;
  onClose: () => void;
}

export function RegistrarExecucaoDialog({ demandaId, onClose }: RegistrarExecucaoDialogProps) {
  const { data: demanda, isLoading } = useDemandaDetalhes(demandaId);
  const { data: fornecedores = [] } = useFornecedores();
  const registrarExecucao = useRegistrarExecucao();

  const [formData, setFormData] = useState({
    data_execucao: new Date().toISOString().split("T")[0],
    fornecedor_id: "",
    fornecedor_nome: "",
    custo: 0,
    observacoes: "",
    documentos_anexados: [] as string[],
    calcularProxima: true,
  });

  // Preencher fornecedor padrão quando demanda carregar
  useEffect(() => {
    if (demanda?.fornecedor_id) {
      const fornecedor = fornecedores.find((f) => f.id === demanda.fornecedor_id);
      setFormData((prev) => ({
        ...prev,
        fornecedor_id: demanda.fornecedor_id || "",
        fornecedor_nome: fornecedor?.nome || "",
      }));
    }
  }, [demanda, fornecedores]);

  const handleFornecedorChange = (id: string) => {
    const fornecedor = fornecedores.find((f) => f.id === id);
    setFormData({
      ...formData,
      fornecedor_id: id,
      fornecedor_nome: fornecedor?.nome || "",
    });
  };

  const calcularProximaExecucao = () => {
    if (!demanda?.periodicidade_meses) return null;
    const data = new Date(formData.data_execucao);
    data.setMonth(data.getMonth() + demanda.periodicidade_meses);
    return data.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandaId) return;

    await registrarExecucao.mutateAsync({
      demandaId,
      execucao: {
        data_execucao: formData.data_execucao,
        fornecedor_id: formData.fornecedor_id || null,
        fornecedor_nome: formData.fornecedor_nome || null,
        custo: formData.custo,
        observacoes: formData.observacoes || null,
        documentos_anexados: formData.documentos_anexados,
        executado_por: null,
      },
      calcularProxima: formData.calcularProxima,
    });

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      data_execucao: new Date().toISOString().split("T")[0],
      fornecedor_id: "",
      fornecedor_nome: "",
      custo: 0,
      observacoes: "",
      documentos_anexados: [],
      calcularProxima: true,
    });
  };

  if (!demandaId) return null;

  return (
    <Dialog open={!!demandaId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Execução do Serviço</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : demanda ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium">{demanda.nome}</p>
              <p className="text-sm text-muted-foreground">
                Periodicidade: {getPeriodicidadeLabel(demanda.periodicidade)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data_execucao">Data de Execução *</Label>
                <Input
                  id="data_execucao"
                  type="date"
                  value={formData.data_execucao}
                  onChange={(e) => setFormData({ ...formData, data_execucao: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Select value={formData.fornecedor_id} onValueChange={handleFornecedorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custo">Custo da Execução (R$)</Label>
                <Input
                  id="custo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.custo}
                  onChange={(e) => setFormData({ ...formData, custo: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {/* TODO: Implementar upload de documentos */}
              {demanda.documentos_necessarios && demanda.documentos_necessarios.length > 0 && (
                <div className="space-y-2">
                  <Label>Documentos Necessários</Label>
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 text-sm">
                    <p className="text-yellow-800 dark:text-yellow-200 mb-2">
                      Documentos recomendados para anexar:
                    </p>
                    <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300">
                      {demanda.documentos_necessarios.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações sobre a execução</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações, pendências, etc..."
                  rows={3}
                />
              </div>

              {demanda.periodicidade !== "sob_demanda" && demanda.periodicidade_meses && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="calcularProxima"
                      checked={formData.calcularProxima}
                      onCheckedChange={(checked) => setFormData({ ...formData, calcularProxima: checked })}
                    />
                    <Label htmlFor="calcularProxima">
                      Calcular automaticamente próxima execução
                    </Label>
                  </div>
                  {formData.calcularProxima && (
                    <p className="text-sm text-muted-foreground">
                      Próxima execução será em: <strong>{calcularProximaExecucao()}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={registrarExecucao.isPending}>
                {registrarExecucao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar Execução
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
