import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpsertInquilino, useDeleteInquilino, type InquilinoUnidade } from "@/hooks/useUnidadesCompleto";
import { Plus, Save, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InquilinoInlineFormProps {
  unidadeId: string;
  inquilino: InquilinoUnidade | null;
}

export function InquilinoInlineForm({ unidadeId, inquilino }: InquilinoInlineFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const upsertInquilino = useUpsertInquilino();
  const deleteInquilino = useDeleteInquilino();

  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    telefone: "",
    email: "",
    data_inicio_contrato: "",
    data_termino_contrato: "",
  });

  useEffect(() => {
    if (inquilino) {
      setFormData({
        nome_completo: inquilino.nome_completo,
        cpf: inquilino.cpf || "",
        telefone: inquilino.telefone || "",
        email: inquilino.email || "",
        data_inicio_contrato: inquilino.data_inicio_contrato || "",
        data_termino_contrato: inquilino.data_termino_contrato || "",
      });
    }
  }, [inquilino]);

  const handleSave = async () => {
    if (!formData.nome_completo.trim()) return;

    await upsertInquilino.mutateAsync({
      unidade_id: unidadeId,
      nome_completo: formData.nome_completo,
      cpf: formData.cpf || null,
      telefone: formData.telefone || null,
      email: formData.email || null,
      data_inicio_contrato: formData.data_inicio_contrato || null,
      data_termino_contrato: formData.data_termino_contrato || null,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Remover inquilino desta unidade?")) {
      await deleteInquilino.mutateAsync(unidadeId);
      setFormData({
        nome_completo: "",
        cpf: "",
        telefone: "",
        email: "",
        data_inicio_contrato: "",
        data_termino_contrato: "",
      });
    }
  };

  const handleCancel = () => {
    if (inquilino) {
      setFormData({
        nome_completo: inquilino.nome_completo,
        cpf: inquilino.cpf || "",
        telefone: inquilino.telefone || "",
        email: inquilino.email || "",
        data_inicio_contrato: inquilino.data_inicio_contrato || "",
        data_termino_contrato: inquilino.data_termino_contrato || "",
      });
    } else {
      setFormData({
        nome_completo: "",
        cpf: "",
        telefone: "",
        email: "",
        data_inicio_contrato: "",
        data_termino_contrato: "",
      });
    }
    setIsEditing(false);
  };

  if (!isEditing && !inquilino) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Cadastrar Inquilino
      </Button>
    );
  }

  if (!isEditing && inquilino) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nome:</span>
          <span>{inquilino.nome_completo}</span>
        </div>
        {inquilino.cpf && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">CPF:</span>
            <span>{inquilino.cpf}</span>
          </div>
        )}
        {inquilino.telefone && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telefone:</span>
            <span>{inquilino.telefone}</span>
          </div>
        )}
        {inquilino.data_inicio_contrato && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Início:</span>
            <span>{format(new Date(inquilino.data_inicio_contrato), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        )}
        {inquilino.data_termino_contrato && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Término:</span>
            <span>{format(new Date(inquilino.data_termino_contrato), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="flex-1">
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Nome Completo *</Label>
          <Input
            placeholder="Nome do inquilino"
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Início do Contrato</Label>
          <Input
            type="date"
            value={formData.data_inicio_contrato}
            onChange={(e) => setFormData({ ...formData, data_inicio_contrato: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Término do Contrato</Label>
          <Input
            type="date"
            value={formData.data_termino_contrato}
            onChange={(e) => setFormData({ ...formData, data_termino_contrato: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave} disabled={upsertInquilino.isPending || !formData.nome_completo.trim()}>
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
