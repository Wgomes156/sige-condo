import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateVisitante, useDeleteVisitante, type VisitanteAutorizado } from "@/hooks/useUnidadesCompleto";
import { Plus, Save, X, Trash2, UserCheck } from "lucide-react";
import { formatCpf, formatTelefone, validateCpf, validateTelefone } from "@/lib/masks";

interface VisitantesInlineFormProps {
  unidadeId: string;
  visitantes: VisitanteAutorizado[];
}

export function VisitantesInlineForm({ unidadeId, visitantes }: VisitantesInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createVisitante = useCreateVisitante();
  const deleteVisitante = useDeleteVisitante();

  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    telefone: "",
    parentesco: "",
    observacoes: "",
    ativo: true,
  });

  const [cpfError, setCpfError] = useState("");
  const [telefoneError, setTelefoneError] = useState("");

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      cpf: "",
      telefone: "",
      parentesco: "",
      observacoes: "",
      ativo: true,
    });
    setCpfError("");
    setTelefoneError("");
    setIsAdding(false);
  };

  const handleCpfChange = (value: string) => {
    setFormData({ ...formData, cpf: formatCpf(value) });
    if (cpfError) setCpfError("");
  };

  const handleCpfBlur = () => {
    if (formData.cpf && !validateCpf(formData.cpf)) {
      setCpfError("CPF inválido");
    } else {
      setCpfError("");
    }
  };

  const handleTelefoneChange = (value: string) => {
    setFormData({ ...formData, telefone: formatTelefone(value) });
    if (telefoneError) setTelefoneError("");
  };

  const handleTelefoneBlur = () => {
    if (formData.telefone && !validateTelefone(formData.telefone)) {
      setTelefoneError("Telefone inválido");
    } else {
      setTelefoneError("");
    }
  };

  const hasErrors = !!cpfError || !!telefoneError;

  const handleSave = async () => {
    if (!formData.nome_completo.trim()) return;
    if (hasErrors) return;

    await createVisitante.mutateAsync({
      unidade_id: unidadeId,
      nome_completo: formData.nome_completo,
      cpf: formData.cpf || null,
      telefone: formData.telefone || null,
      parentesco: formData.parentesco || null,
      observacoes: formData.observacoes || null,
      ativo: formData.ativo,
    });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este visitante?")) {
      await deleteVisitante.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-3">
      {visitantes.length > 0 && (
        <div className="space-y-2">
          {visitantes.map((v) => (
            <div key={v.id} className="flex items-center justify-between text-sm border-b pb-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{v.nome_completo}</p>
                  <p className="text-muted-foreground text-xs">
                    {v.parentesco || "Sem parentesco"} {v.telefone && `• ${v.telefone}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={v.ativo ? "default" : "secondary"}>
                  {v.ativo ? "Ativo" : "Inativo"}
                </Badge>
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

      {!isAdding ? (
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Visitante
        </Button>
      ) : (
        <div className="border rounded-lg p-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome Completo *</Label>
              <Input
                placeholder="Nome do visitante"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Parentesco</Label>
              <Input
                placeholder="Ex: Mãe, Irmão"
                value={formData.parentesco}
                onChange={(e) => setFormData({ ...formData, parentesco: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => handleTelefoneChange(e.target.value)}
                onBlur={handleTelefoneBlur}
                className={telefoneError ? "border-destructive" : ""}
              />
              {telefoneError && <p className="text-xs text-destructive">{telefoneError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CPF</Label>
              <Input
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                onBlur={handleCpfBlur}
                className={cpfError ? "border-destructive" : ""}
              />
              {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="visitante-ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: !!checked })}
            />
            <Label htmlFor="visitante-ativo" className="text-xs">Visitante ativo</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createVisitante.isPending || !formData.nome_completo.trim() || hasErrors}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar
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
