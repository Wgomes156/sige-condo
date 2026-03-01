import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCategoriasDemanda, useFornecedores, useCreateDemanda } from "@/hooks/useDemandas";
import { Loader2, Plus, X } from "lucide-react";

interface NovaDemandaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominioId: string;
}

export function NovaDemandaDialog({ open, onOpenChange, condominioId }: NovaDemandaDialogProps) {
  const { data: categorias = [] } = useCategoriasDemanda();
  const { data: fornecedores = [] } = useFornecedores();
  const createDemanda = useCreateDemanda();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria_id: "",
    periodicidade: "anual",
    periodicidade_meses: 12,
    obrigatorio: false,
    base_legal: "",
    documentos_necessarios: [] as string[],
    alertar_antecedencia_dias: 30,
    permite_prorrogacao: true,
    custo_estimado: 0,
    fornecedor_id: "",
    proxima_execucao: "",
    observacoes: "",
  });

  const [novoDocumento, setNovoDocumento] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createDemanda.mutateAsync({
      condominio_id: condominioId,
      template_id: null,
      categoria_id: formData.categoria_id || null,
      nome: formData.nome,
      descricao: formData.descricao || null,
      periodicidade: formData.periodicidade,
      periodicidade_meses: formData.periodicidade === "sob_demanda" ? null : formData.periodicidade_meses,
      obrigatorio: formData.obrigatorio,
      base_legal: formData.base_legal || null,
      documentos_necessarios: formData.documentos_necessarios,
      alertar_antecedencia_dias: formData.alertar_antecedencia_dias,
      permite_prorrogacao: formData.permite_prorrogacao,
      custo_estimado: formData.custo_estimado,
      fornecedor_id: formData.fornecedor_id || null,
      ultima_execucao: null,
      proxima_execucao: formData.proxima_execucao || null,
      status: formData.periodicidade === "sob_demanda" ? "sob_demanda" : "em_dia",
      ativo: true,
      observacoes: formData.observacoes || null,
      criado_por: null,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      categoria_id: "",
      periodicidade: "anual",
      periodicidade_meses: 12,
      obrigatorio: false,
      base_legal: "",
      documentos_necessarios: [],
      alertar_antecedencia_dias: 30,
      permite_prorrogacao: true,
      custo_estimado: 0,
      fornecedor_id: "",
      proxima_execucao: "",
      observacoes: "",
    });
    setNovoDocumento("");
  };

  const handlePeriodicidadeChange = (value: string) => {
    const mesesMap: Record<string, number | null> = {
      mensal: 1,
      trimestral: 3,
      semestral: 6,
      anual: 12,
      bienal: 24,
      sob_demanda: null,
      personalizada: 12,
    };
    setFormData({
      ...formData,
      periodicidade: value,
      periodicidade_meses: mesesMap[value] ?? 12,
    });
  };

  const addDocumento = () => {
    if (novoDocumento.trim()) {
      setFormData({
        ...formData,
        documentos_necessarios: [...formData.documentos_necessarios, novoDocumento.trim()],
      });
      setNovoDocumento("");
    }
  };

  const removeDocumento = (index: number) => {
    setFormData({
      ...formData,
      documentos_necessarios: formData.documentos_necessarios.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda Personalizada</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Informações Básicas</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nome">Nome do Serviço *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Limpeza de caixa d'água"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={formData.categoria_id} onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor Padrão</Label>
                <Select value={formData.fornecedor_id} onValueChange={(v) => setFormData({ ...formData, fornecedor_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o serviço..."
                rows={2}
              />
            </div>
          </div>

          {/* Periodicidade */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Periodicidade</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Periodicidade *</Label>
                <Select value={formData.periodicidade} onValueChange={handlePeriodicidadeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral (3 meses)</SelectItem>
                    <SelectItem value="semestral">Semestral (6 meses)</SelectItem>
                    <SelectItem value="anual">Anual (12 meses)</SelectItem>
                    <SelectItem value="bienal">Bienal (24 meses)</SelectItem>
                    <SelectItem value="personalizada">Personalizada</SelectItem>
                    <SelectItem value="sob_demanda">Sob demanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.periodicidade === "personalizada" && (
                <div className="space-y-2">
                  <Label htmlFor="periodicidade_meses">Repetir a cada (meses)</Label>
                  <Input
                    id="periodicidade_meses"
                    type="number"
                    min="1"
                    value={formData.periodicidade_meses || ""}
                    onChange={(e) => setFormData({ ...formData, periodicidade_meses: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="proxima_execucao">Próxima Execução</Label>
                <Input
                  id="proxima_execucao"
                  type="date"
                  value={formData.proxima_execucao}
                  onChange={(e) => setFormData({ ...formData, proxima_execucao: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertar">Alertar com antecedência de (dias)</Label>
                <Input
                  id="alertar"
                  type="number"
                  min="1"
                  value={formData.alertar_antecedencia_dias}
                  onChange={(e) => setFormData({ ...formData, alertar_antecedencia_dias: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
          </div>

          {/* Obrigatoriedade */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Obrigatoriedade</h3>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="obrigatorio"
                  checked={formData.obrigatorio}
                  onCheckedChange={(checked) => setFormData({ ...formData, obrigatorio: checked })}
                />
                <Label htmlFor="obrigatorio">Serviço obrigatório por lei/norma</Label>
              </div>
            </div>

            {formData.obrigatorio && (
              <div className="space-y-2">
                <Label htmlFor="base_legal">Base legal/normativa</Label>
                <Input
                  id="base_legal"
                  value={formData.base_legal}
                  onChange={(e) => setFormData({ ...formData, base_legal: e.target.value })}
                  placeholder="Ex: NBR 5419, NR-10, Portaria..."
                />
              </div>
            )}
          </div>

          {/* Custo e Documentos */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Custo e Documentos</h3>
            
            <div className="space-y-2">
              <Label htmlFor="custo">Custo Estimado (R$)</Label>
              <Input
                id="custo"
                type="number"
                step="0.01"
                min="0"
                value={formData.custo_estimado}
                onChange={(e) => setFormData({ ...formData, custo_estimado: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Documentos Necessários</Label>
              <div className="flex gap-2">
                <Input
                  value={novoDocumento}
                  onChange={(e) => setNovoDocumento(e.target.value)}
                  placeholder="Nome do documento"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDocumento())}
                />
                <Button type="button" variant="outline" onClick={addDocumento}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.documentos_necessarios.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.documentos_necessarios.map((doc, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                      {doc}
                      <button type="button" onClick={() => removeDocumento(i)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDemanda.isPending}>
              {createDemanda.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Demanda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
