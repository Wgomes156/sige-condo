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
  useCreateAcesso,
  useDeleteAcesso,
  type AcessoUnidade,
  type TipoAcesso,
} from "@/hooks/useUnidadesCompleto";
import { Plus, Save, X, Trash2, Key } from "lucide-react";

interface AcessosInlineFormProps {
  unidadeId: string;
  acessos: AcessoUnidade[];
}

const tipoAcessoLabels: Record<TipoAcesso, string> = {
  tag: "TAG",
  chip: "Chip",
  controle_remoto: "Controle Remoto",
  biometria: "Biometria",
};

const tipoAcessoIcons: Record<TipoAcesso, string> = {
  tag: "🏷️",
  chip: "📡",
  controle_remoto: "🔘",
  biometria: "👆",
};

export function AcessosInlineForm({ unidadeId, acessos }: AcessosInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAcesso = useCreateAcesso();
  const deleteAcesso = useDeleteAcesso();

  const [formData, setFormData] = useState({
    tipo_acesso: "tag" as TipoAcesso,
    codigo_identificacao: "",
    descricao: "",
    ativo: true,
  });

  const resetForm = () => {
    setFormData({
      tipo_acesso: "tag",
      codigo_identificacao: "",
      descricao: "",
      ativo: true,
    });
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formData.codigo_identificacao.trim()) return;

    await createAcesso.mutateAsync({
      unidade_id: unidadeId,
      tipo_acesso: formData.tipo_acesso,
      codigo_identificacao: formData.codigo_identificacao,
      descricao: formData.descricao || null,
      ativo: formData.ativo,
    });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este acesso?")) {
      await deleteAcesso.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-3">
      {acessos.length > 0 && (
        <div className="space-y-2">
          {acessos.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{tipoAcessoIcons[a.tipo_acesso]}</span>
                <div>
                  <p className="font-medium">
                    {tipoAcessoLabels[a.tipo_acesso]}: {a.codigo_identificacao}
                  </p>
                  {a.descricao && (
                    <p className="text-muted-foreground text-xs">{a.descricao}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.ativo ? "default" : "secondary"}>
                  {a.ativo ? "Ativo" : "Inativo"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => handleDelete(a.id)}
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
          Adicionar Acesso
        </Button>
      ) : (
        <div className="border rounded-lg p-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Acesso *</Label>
              <Select
                value={formData.tipo_acesso}
                onValueChange={(v) => setFormData({ ...formData, tipo_acesso: v as TipoAcesso })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tag">🏷️ TAG</SelectItem>
                  <SelectItem value="chip">📡 Chip</SelectItem>
                  <SelectItem value="controle_remoto">🔘 Controle Remoto</SelectItem>
                  <SelectItem value="biometria">👆 Biometria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Código/Identificação *</Label>
              <Input
                placeholder="Ex: TAG-001, BIO-12345"
                value={formData.codigo_identificacao}
                onChange={(e) => setFormData({ ...formData, codigo_identificacao: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Input
              placeholder="Ex: Portão garagem, Porta social..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="acesso-ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: !!checked })}
            />
            <Label htmlFor="acesso-ativo" className="text-xs">Acesso ativo</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createAcesso.isPending || !formData.codigo_identificacao.trim()}
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
