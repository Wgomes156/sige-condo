import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  useAllCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from "@/hooks/useCategorias";

interface GerenciarCategoriasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CategoriaForm {
  nome: string;
  tipo: "receita" | "despesa";
  cor: string;
  descricao: string;
}

const CORES_DISPONIVEIS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#6b7280",
];

export function GerenciarCategoriasDialog({
  open,
  onOpenChange,
}: GerenciarCategoriasDialogProps) {
  const { data: categorias, isLoading } = useAllCategorias();
  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();
  const deleteCategoria = useDeleteCategoria();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<CategoriaForm>({
    nome: "",
    tipo: "despesa",
    cor: "#3b82f6",
    descricao: "",
  });

  const resetForm = () => {
    setForm({ nome: "", tipo: "despesa", cor: "#3b82f6", descricao: "" });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (categoria: any) => {
    setEditingId(categoria.id);
    setForm({
      nome: categoria.nome,
      tipo: categoria.tipo,
      cor: categoria.cor || "#3b82f6",
      descricao: categoria.descricao || "",
    });
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }

    try {
      if (editingId) {
        await updateCategoria.mutateAsync({ id: editingId, ...form });
      } else {
        await createCategoria.mutateAsync(form);
      }
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;
    try {
      await deleteCategoria.mutateAsync(id);
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
    }
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias Financeiras</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleStartAdd} size="sm" disabled={isAdding}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Categoria
            </Button>
          </div>

          {(isAdding || editingId) && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h4 className="font-medium">
                {editingId ? "Editar Categoria" : "Nova Categoria"}
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Manutenção"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={form.tipo}
                    onValueChange={(v) =>
                      setForm({ ...form, tipo: v as "receita" | "despesa" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {CORES_DISPONIVEIS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        form.cor === cor
                          ? "border-foreground scale-125"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: cor }}
                      onClick={() => setForm({ ...form, cor })}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={createCategoria.isPending || updateCategoria.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : categorias?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma categoria cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                categorias?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: cat.cor || "#6b7280" }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{cat.nome}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          cat.tipo === "receita"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {cat.tipo === "receita" ? "Receita" : "Despesa"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {cat.descricao || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
