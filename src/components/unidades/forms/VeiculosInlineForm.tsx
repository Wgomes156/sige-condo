import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateVeiculo, useUpdateVeiculo, useDeleteVeiculo, type VeiculoUnidade, type TipoVeiculo, type ProprietarioVeiculo } from "@/hooks/useUnidadesCompleto";
import { Plus, Save, X, Trash2, Pencil, Search } from "lucide-react";
import { formatPlaca, validatePlaca } from "@/lib/masks";

interface VeiculosInlineFormProps {
  unidadeId: string;
  veiculos: VeiculoUnidade[];
}

const tipoVeiculoLabels: Record<TipoVeiculo, string> = {
  moto: "Moto",
  carro: "Carro",
  suv: "SUV",
  caminhonete: "Caminhonete",
  bicicleta: "Bicicleta",
  outro: "Outro",
};

export function VeiculosInlineForm({ unidadeId, veiculos }: VeiculosInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [placaError, setPlacaError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const createVeiculo = useCreateVeiculo();
  const updateVeiculo = useUpdateVeiculo();
  const deleteVeiculo = useDeleteVeiculo();

  const [formData, setFormData] = useState({
    placa: "",
    tipo: "carro" as TipoVeiculo,
    marca: "",
    modelo: "",
    cor: "",
    proprietario_veiculo: "proprietario" as ProprietarioVeiculo,
    nome_proprietario: "",
  });

  const filteredVeiculos = useMemo(() => {
    if (!searchTerm.trim()) return veiculos;
    const term = searchTerm.toLowerCase();
    return veiculos.filter((v) =>
      v.placa.toLowerCase().includes(term) ||
      (v.marca?.toLowerCase().includes(term)) ||
      (v.modelo?.toLowerCase().includes(term)) ||
      (v.cor?.toLowerCase().includes(term)) ||
      (v.nome_proprietario?.toLowerCase().includes(term))
    );
  }, [veiculos, searchTerm]);

  const resetForm = () => {
    setFormData({
      placa: "",
      tipo: "carro",
      marca: "",
      modelo: "",
      cor: "",
      proprietario_veiculo: "proprietario",
      nome_proprietario: "",
    });
    setIsAdding(false);
    setEditingId(null);
    setPlacaError("");
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlaca(e.target.value);
    setFormData({ ...formData, placa: formatted });
    if (placaError) setPlacaError("");
  };

  const handlePlacaBlur = () => {
    const value = formData.placa;
    if (value && !validatePlaca(value)) {
      setPlacaError("Placa inválida (ex: ABC-1234 ou ABC1D23)");
    } else {
      setPlacaError("");
    }
  };

  const handleEdit = (veiculo: VeiculoUnidade) => {
    setFormData({
      placa: veiculo.placa,
      tipo: veiculo.tipo || "carro",
      marca: veiculo.marca || "",
      modelo: veiculo.modelo || "",
      cor: veiculo.cor || "",
      proprietario_veiculo: veiculo.proprietario_veiculo as ProprietarioVeiculo || "proprietario",
      nome_proprietario: veiculo.nome_proprietario || "",
    });
    setEditingId(veiculo.id);
    setIsAdding(false);
  };

  const checkPlacaDuplicada = (placa: string): boolean => {
    const placaLimpa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return veiculos.some((v) => {
      // Se estamos editando, ignorar o veículo atual
      if (editingId && v.id === editingId) return false;
      const placaExistente = v.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return placaExistente === placaLimpa;
    });
  };

  const handleSave = async () => {
    if (!formData.placa.trim()) return;

    // Validar placa duplicada
    if (checkPlacaDuplicada(formData.placa)) {
      setPlacaError("Esta placa já está cadastrada nesta unidade");
      return;
    }

    if (editingId) {
      await updateVeiculo.mutateAsync({
        id: editingId,
        placa: formData.placa.toUpperCase().replace(/-/g, ''),
        tipo: formData.tipo,
        marca: formData.marca || null,
        modelo: formData.modelo || null,
        cor: formData.cor || null,
        proprietario_veiculo: formData.proprietario_veiculo,
        nome_proprietario: formData.nome_proprietario || null,
      });
    } else {
      await createVeiculo.mutateAsync({
        unidade_id: unidadeId,
        placa: formData.placa.toUpperCase().replace(/-/g, ''),
        tipo: formData.tipo,
        marca: formData.marca || null,
        modelo: formData.modelo || null,
        cor: formData.cor || null,
        proprietario_veiculo: formData.proprietario_veiculo,
        nome_proprietario: formData.nome_proprietario || null,
      });
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este veículo?")) {
      await deleteVeiculo.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-3">
      {veiculos.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa, marca, modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {filteredVeiculos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum veículo encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {filteredVeiculos.map((v) => (
            <div key={v.id} className="border rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{v.placa}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{tipoVeiculoLabels[v.tipo]}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleEdit(v)}
                    disabled={editingId === v.id}
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
              <p className="text-muted-foreground">
                {v.marca} {v.modelo} {v.cor && `- ${v.cor}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {v.nome_proprietario || v.proprietario_veiculo}
              </p>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {!isAdding && !editingId ? (
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Veículo
        </Button>
      ) : (
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {editingId ? "Editar Veículo" : "Novo Veículo"}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Placa *</Label>
              <Input
                placeholder="ABC-1234 ou ABC1D23"
                value={formData.placa}
                onChange={handlePlacaChange}
                onBlur={handlePlacaBlur}
                className={placaError ? "border-destructive" : ""}
              />
              {placaError && (
                <p className="text-xs text-destructive">{placaError}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v as TipoVeiculo })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moto">Moto</SelectItem>
                  <SelectItem value="carro">Carro</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="caminhonete">Caminhonete</SelectItem>
                  <SelectItem value="bicicleta">Bicicleta</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Marca</Label>
              <Input
                placeholder="Ex: Fiat"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Modelo</Label>
              <Input
                placeholder="Ex: Uno"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor</Label>
              <Input
                placeholder="Ex: Branco"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Proprietário</Label>
              <Select
                value={formData.proprietario_veiculo}
                onValueChange={(v) => setFormData({ ...formData, proprietario_veiculo: v as ProprietarioVeiculo })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proprietario">Proprietário</SelectItem>
                  <SelectItem value="inquilino">Inquilino</SelectItem>
                  <SelectItem value="morador">Morador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome (opcional)</Label>
              <Input
                placeholder="Nome do proprietário"
                value={formData.nome_proprietario}
                onChange={(e) => setFormData({ ...formData, nome_proprietario: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={(createVeiculo.isPending || updateVeiculo.isPending) || !formData.placa.trim() || !!placaError || !validatePlaca(formData.placa)}
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
