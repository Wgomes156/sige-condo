import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateVaga,
  useUpdateVaga,
  useDeleteVaga,
  type VagaGaragem,
} from "@/hooks/useUnidadesCompleto";
import { Plus, Save, X, Trash2, Car, Pencil } from "lucide-react";

interface VagasInlineFormProps {
  unidadeId: string;
  vagas: VagaGaragem[];
}

const tipoVagaOptions = [
  { value: "simples", label: "Simples" },
  { value: "dupla", label: "Dupla" },
  { value: "moto", label: "Moto" },
  { value: "pcd", label: "PCD" },
  { value: "idoso", label: "Idoso" },
];

export function VagasInlineForm({ unidadeId, vagas }: VagasInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const createVaga = useCreateVaga();
  const updateVaga = useUpdateVaga();
  const deleteVaga = useDeleteVaga();

  const [formData, setFormData] = useState({
    numero_vaga: "",
    tipo: "simples",
    localizacao: "",
    coberta: true,
    observacoes: "",
  });

  const resetForm = () => {
    setFormData({
      numero_vaga: "",
      tipo: "simples",
      localizacao: "",
      coberta: true,
      observacoes: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (vaga: VagaGaragem) => {
    setFormData({
      numero_vaga: vaga.numero_vaga,
      tipo: vaga.tipo,
      localizacao: vaga.localizacao || "",
      coberta: vaga.coberta,
      observacoes: vaga.observacoes || "",
    });
    setEditingId(vaga.id);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.numero_vaga.trim()) return;

    const payload = {
      unidade_id: unidadeId,
      numero_vaga: formData.numero_vaga,
      tipo: formData.tipo,
      localizacao: formData.localizacao || null,
      coberta: formData.coberta,
      observacoes: formData.observacoes || null,
    };

    if (editingId) {
      await updateVaga.mutateAsync({ id: editingId, ...payload });
    } else {
      await createVaga.mutateAsync(payload);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover esta vaga?")) {
      await deleteVaga.mutateAsync(id);
    }
  };

  const isFormOpen = isAdding || editingId !== null;

  return (
    <div className="space-y-3">
      {vagas.length > 0 && (
        <div className="space-y-2">
          {vagas.map((v) => (
            <div key={v.id} className="flex items-center justify-between text-sm border-b pb-2">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    Vaga {v.numero_vaga}
                    {v.localizacao && <span className="text-muted-foreground"> • {v.localizacao}</span>}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {tipoVagaOptions.find(t => t.value === v.tipo)?.label || v.tipo}
                    {v.coberta ? " • Coberta" : " • Descoberta"}
                    {v.observacoes && ` • ${v.observacoes}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={v.coberta ? "default" : "secondary"}>
                  {v.coberta ? "Coberta" : "Descoberta"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleEdit(v)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => handleDelete(v.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isFormOpen ? (
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Vaga
        </Button>
      ) : (
        <div className="border rounded-lg p-3 space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            {editingId ? "Editar Vaga" : "Nova Vaga"}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Número da Vaga *</Label>
              <Input
                placeholder="Ex: G1-001, A-12"
                value={formData.numero_vaga}
                onChange={(e) => setFormData({ ...formData, numero_vaga: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoVagaOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Localização</Label>
              <Input
                placeholder="Ex: Subsolo 1, Térreo"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Input
                placeholder="Ex: Próxima ao elevador"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="vaga-coberta"
              checked={formData.coberta}
              onCheckedChange={(checked) => setFormData({ ...formData, coberta: !!checked })}
            />
            <Label htmlFor="vaga-coberta" className="text-xs">Vaga coberta</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={(createVaga.isPending || updateVaga.isPending) || !formData.numero_vaga.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              {editingId ? "Atualizar" : "Salvar"}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
