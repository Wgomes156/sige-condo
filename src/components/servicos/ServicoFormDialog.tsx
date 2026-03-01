import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Servico, CategoriaServico } from "@/hooks/useServicos";

interface ServicoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico: Servico | null;
  categorias: CategoriaServico[];
  onSubmit: (data: Partial<Servico>) => void;
  loading?: boolean;
}

export function ServicoFormDialog({
  open,
  onOpenChange,
  servico,
  categorias,
  onSubmit,
  loading,
}: ServicoFormDialogProps) {
  const [formData, setFormData] = useState({
    nome_servico: "",
    descricao: "",
    valor: "",
    tipo_valor: "fixo" as "fixo" | "percentual" | "variavel",
    categoria_id: "",
    observacoes: "",
    ativo: true,
  });

  useEffect(() => {
    if (servico) {
      setFormData({
        nome_servico: servico.nome_servico,
        descricao: servico.descricao || "",
        valor: servico.valor,
        tipo_valor: servico.tipo_valor || "fixo",
        categoria_id: servico.categoria_id || "",
        observacoes: servico.observacoes || "",
        ativo: servico.ativo ?? true,
      });
    } else {
      setFormData({
        nome_servico: "",
        descricao: "",
        valor: "",
        tipo_valor: "fixo",
        categoria_id: categorias[0]?.id || "",
        observacoes: "",
        ativo: true,
      });
    }
  }, [servico, categorias, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tiposValor = [
    { value: "fixo", label: "Valor Fixo" },
    { value: "percentual", label: "Percentual" },
    { value: "variavel", label: "Variável" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {servico ? "Editar Serviço" : "Novo Serviço"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_servico">Nome do Serviço *</Label>
            <Input
              id="nome_servico"
              value={formData.nome_servico}
              onChange={(e) =>
                setFormData({ ...formData, nome_servico: e.target.value })
              }
              placeholder="Ex: Taxa de Administração"
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria_id">Categoria *</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) =>
                setFormData({ ...formData, categoria_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome_categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descreva o serviço..."
              required
              minLength={10}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                value={formData.valor}
                onChange={(e) =>
                  setFormData({ ...formData, valor: e.target.value })
                }
                placeholder="Ex: R$ 500,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_valor">Tipo de Valor</Label>
              <Select
                value={formData.tipo_valor}
                onValueChange={(value: "fixo" | "percentual" | "variavel") =>
                  setFormData({ ...formData, tipo_valor: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposValor.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ativo: checked })
              }
            />
            <Label htmlFor="ativo">Serviço ativo</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : servico ? "Salvar" : "Criar Serviço"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
