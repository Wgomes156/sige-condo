import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpsertProprietario, type ProprietarioUnidade } from "@/hooks/useUnidadesCompleto";
import { Plus, Save, X } from "lucide-react";

interface ProprietarioInlineFormProps {
  unidadeId: string;
  proprietario: ProprietarioUnidade | null;
}

export function ProprietarioInlineForm({ unidadeId, proprietario }: ProprietarioInlineFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const upsertProprietario = useUpsertProprietario();

  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    telefone: "",
    email: "",
    possui_procuracao: false,
  });

  useEffect(() => {
    if (proprietario) {
      setFormData({
        nome_completo: proprietario.nome_completo,
        cpf: proprietario.cpf || "",
        telefone: proprietario.telefone || "",
        email: proprietario.email || "",
        possui_procuracao: proprietario.possui_procuracao,
      });
    }
  }, [proprietario]);

  const handleSave = async () => {
    if (!formData.nome_completo.trim()) return;

    await upsertProprietario.mutateAsync({
      unidade_id: unidadeId,
      nome_completo: formData.nome_completo,
      cpf: formData.cpf || null,
      telefone: formData.telefone || null,
      email: formData.email || null,
      possui_procuracao: formData.possui_procuracao,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (proprietario) {
      setFormData({
        nome_completo: proprietario.nome_completo,
        cpf: proprietario.cpf || "",
        telefone: proprietario.telefone || "",
        email: proprietario.email || "",
        possui_procuracao: proprietario.possui_procuracao,
      });
    } else {
      setFormData({
        nome_completo: "",
        cpf: "",
        telefone: "",
        email: "",
        possui_procuracao: false,
      });
    }
    setIsEditing(false);
  };

  if (!isEditing && !proprietario) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Cadastrar Proprietário
      </Button>
    );
  }

  if (!isEditing && proprietario) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nome:</span>
          <span>{proprietario.nome_completo}</span>
        </div>
        {proprietario.cpf && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">CPF:</span>
            <span>{proprietario.cpf}</span>
          </div>
        )}
        {proprietario.telefone && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telefone:</span>
            <span>{proprietario.telefone}</span>
          </div>
        )}
        {proprietario.email && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span>{proprietario.email}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Procuração:</span>
          <span>{proprietario.possui_procuracao ? "Sim" : "Não"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="w-full mt-2">
          Editar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Nome Completo *</Label>
          <Input
            placeholder="Nome do proprietário"
            value={formData.nome_completo}
            onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">CPF</Label>
          <Input
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Telefone</Label>
          <Input
            placeholder="(00) 00000-0000"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">E-mail</Label>
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="procuracao"
          checked={formData.possui_procuracao}
          onCheckedChange={(checked) => setFormData({ ...formData, possui_procuracao: !!checked })}
        />
        <Label htmlFor="procuracao" className="text-xs">Possui procuração</Label>
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave} disabled={upsertProprietario.isPending || !formData.nome_completo.trim()}>
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
