import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateMorador,
  useUpdateMorador,
  useDeleteMorador,
  type MoradorUnidade,
  type TipoVinculo,
} from "@/hooks/useUnidadesCompleto";
import { Plus, Save, X, Trash2, User, Search, Pencil } from "lucide-react";
import { formatCpf, formatTelefone, validateCpf, validateEmail, validateTelefone } from "@/lib/masks";

interface MoradoresInlineFormProps {
  unidadeId: string;
  moradores: MoradorUnidade[];
}

const vinculoLabels: Record<TipoVinculo, string> = {
  proprietario: "Proprietário",
  inquilino: "Inquilino",
};

export function MoradoresInlineForm({ unidadeId, moradores }: MoradoresInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const createMorador = useCreateMorador();
  const updateMorador = useUpdateMorador();
  const deleteMorador = useDeleteMorador();

  const [formData, setFormData] = useState({
    nome_completo: "",
    tipo_vinculo: "proprietario" as TipoVinculo,
    cpf: "",
    telefone: "",
    email: "",
    parentesco: "",
  });

  const filteredMoradores = useMemo(() => {
    if (!searchTerm.trim()) return moradores;
    const term = searchTerm.toLowerCase();
    return moradores.filter((m) =>
      m.nome_completo.toLowerCase().includes(term) ||
      (m.cpf?.toLowerCase().includes(term)) ||
      (m.telefone?.toLowerCase().includes(term)) ||
      (m.email?.toLowerCase().includes(term)) ||
      (m.parentesco?.toLowerCase().includes(term))
    );
  }, [moradores, searchTerm]);

  const [cpfError, setCpfError] = useState("");
  const [telefoneError, setTelefoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      tipo_vinculo: "proprietario",
      cpf: "",
      telefone: "",
      email: "",
      parentesco: "",
    });
    setCpfError("");
    setTelefoneError("");
    setEmailError("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (morador: MoradorUnidade) => {
    setFormData({
      nome_completo: morador.nome_completo,
      tipo_vinculo: morador.tipo_vinculo,
      cpf: morador.cpf || "",
      telefone: morador.telefone || "",
      email: morador.email || "",
      parentesco: morador.parentesco || "",
    });
    setEditingId(morador.id);
    setIsAdding(true);
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

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    if (emailError) setEmailError("");
  };

  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError("E-mail inválido");
    } else {
      setEmailError("");
    }
  };

  const hasErrors = !!cpfError || !!telefoneError || !!emailError;

  const handleSave = async () => {
    if (!formData.nome_completo.trim()) return;
    if (hasErrors) return;

    const payload = {
      unidade_id: unidadeId,
      nome_completo: formData.nome_completo,
      tipo_vinculo: formData.tipo_vinculo,
      cpf: formData.cpf || null,
      telefone: formData.telefone || null,
      email: formData.email || null,
      parentesco: formData.parentesco || null,
    };

    if (editingId) {
      await updateMorador.mutateAsync({ id: editingId, ...payload });
    } else {
      await createMorador.mutateAsync(payload);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este morador?")) {
      await deleteMorador.mutateAsync(id);
    }
  };

  const isFormOpen = isAdding || editingId !== null;

  return (
    <div className="space-y-3">
      {moradores.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {filteredMoradores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum morador encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {filteredMoradores.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{m.nome_completo}</p>
                  <p className="text-muted-foreground text-xs">
                    {vinculoLabels[m.tipo_vinculo]}
                    {m.parentesco && ` • ${m.parentesco}`}
                    {m.telefone && ` • ${m.telefone}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleEdit(m)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {!isFormOpen ? (
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Morador
        </Button>
      ) : (
        <div className="border rounded-lg p-3 space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            {editingId ? "Editar Morador" : "Novo Morador"}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome Completo *</Label>
              <Input
                placeholder="Nome do morador"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Vínculo</Label>
              <Select
                value={formData.tipo_vinculo}
                onValueChange={(v) => setFormData({ ...formData, tipo_vinculo: v as TipoVinculo })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proprietario">Proprietário</SelectItem>
                  <SelectItem value="inquilino">Inquilino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="space-y-1.5">
              <Label className="text-xs">Parentesco</Label>
              <Input
                placeholder="Ex: Filho, Cônjuge"
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
              <Label className="text-xs">E-mail</Label>
              <Input
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={(createMorador.isPending || updateMorador.isPending) || !formData.nome_completo.trim() || hasErrors}
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
