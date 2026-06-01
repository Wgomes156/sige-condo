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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Save, X, Tag, Loader2 } from "lucide-react";
import {
  CategoriaDemanda,
  useCategoriasDemanda,
  useCreateCategoriaDemanda,
  useUpdateCategoriaDemanda,
  useDeleteCategoriaDemanda,
} from "@/hooks/useDemandas";

const CORES_PREDEFINIDAS = [
  { label: "Azul",      value: "#3B82F6" },
  { label: "Verde",     value: "#22C55E" },
  { label: "Amarelo",   value: "#EAB308" },
  { label: "Vermelho",  value: "#EF4444" },
  { label: "Laranja",   value: "#F97316" },
  { label: "Roxo",      value: "#A855F7" },
  { label: "Rosa",      value: "#EC4899" },
  { label: "Ciano",     value: "#06B6D4" },
  { label: "Cinza",     value: "#6B7280" },
  { label: "Lima",      value: "#84CC16" },
];

const ICONES_PREDEFINIDOS = [
  "🔧", "⚡", "🔥", "💧", "🌿", "🏗️", "🛡️", "🔒",
  "🧹", "🌡️", "🚗", "💡", "🔑", "🏊", "🌳", "📋",
];

interface FormState {
  nome: string;
  icone: string;
  cor: string;
  ordem: number;
}

const FORM_INICIAL: FormState = {
  nome: "",
  icone: "🔧",
  cor: "#3B82F6",
  ordem: 1,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarCategoriasDialogDemandas({ open, onOpenChange }: Props) {
  const { data: categorias = [], isLoading } = useCategoriasDemanda();
  const createMutation = useCreateCategoriaDemanda();
  const updateMutation = useUpdateCategoriaDemanda();
  const deleteMutation = useDeleteCategoriaDemanda();

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [deletandoCategoria, setDeletandoCategoria] = useState<CategoriaDemanda | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setForm({ ...FORM_INICIAL, ordem: (categorias.length || 0) + 1 });
    setEditandoId(null);
    setMostrarForm(false);
  };

  const handleNovaCategoria = () => {
    setForm({ ...FORM_INICIAL, ordem: (categorias.length || 0) + 1 });
    setEditandoId(null);
    setMostrarForm(true);
  };

  const handleEditar = (cat: CategoriaDemanda) => {
    setForm({
      nome: cat.nome,
      icone: cat.icone || "🔧",
      cor: cat.cor || "#3B82F6",
      ordem: cat.ordem || 1,
    });
    setEditandoId(cat.id);
    setMostrarForm(true);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) return;
    if (editandoId) {
      await updateMutation.mutateAsync({ id: editandoId, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    resetForm();
  };

  const handleConfirmarDelete = async () => {
    if (!deletandoCategoria) return;
    await deleteMutation.mutateAsync(deletandoCategoria.id);
    setDeletandoCategoria(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Tag className="h-5 w-5 text-primary" />
              Gerenciar Categorias — Demandas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Botão Nova Categoria */}
            {!mostrarForm && (
              <Button onClick={handleNovaCategoria} className="w-full sm:w-auto gap-2">
                <Plus className="h-4 w-4" />
                Nova Categoria
              </Button>
            )}

            {/* Formulário inline */}
            {mostrarForm && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <p className="text-sm font-semibold text-primary">
                  {editandoId ? "Editar Categoria" : "Nova Categoria"}
                </p>

                {/* Nome */}
                <div className="space-y-1">
                  <Label>Nome da Categoria <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Ex: Elétrica, Hidráulica, Segurança..."
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    maxLength={60}
                  />
                </div>

                {/* Ícone */}
                <div className="space-y-1">
                  <Label>Ícone</Label>
                  <div className="flex flex-wrap gap-2">
                    {ICONES_PREDEFINIDOS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, icone: ic }))}
                        className={`h-9 w-9 rounded-md border text-lg transition-all hover:scale-110 ${
                          form.icone === ic
                            ? "border-primary ring-2 ring-primary/40 bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cor */}
                <div className="space-y-1">
                  <Label>Cor</Label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {CORES_PREDEFINIDAS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        onClick={() => setForm((f) => ({ ...f, cor: c.value }))}
                        className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                          form.cor === c.value
                            ? "border-foreground scale-110 ring-2 ring-offset-1"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                    {/* Cor personalizada */}
                    <label className="cursor-pointer" title="Cor personalizada">
                      <input
                        type="color"
                        value={form.cor}
                        onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value }))}
                        className="sr-only"
                      />
                      <div
                        className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center text-xs hover:scale-110 transition-all"
                        style={{ backgroundColor: form.cor }}
                      >
                        <span className="text-white font-bold drop-shadow">+</span>
                      </div>
                    </label>
                    {/* Preview */}
                    <div className="ml-2 flex items-center gap-2">
                      <Badge
                        style={{ backgroundColor: form.cor, color: "#fff", border: "none" }}
                        className="text-sm px-3 py-1"
                      >
                        {form.icone} {form.nome || "Preview"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Ordem */}
                <div className="space-y-1 max-w-[120px]">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.ordem}
                    onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))}
                  />
                </div>

                {/* Ações do form */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSalvar}
                    disabled={!form.nome.trim() || isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="gap-2">
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Tabela de categorias */}
            <div className="rounded-md border">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando categorias...
                </div>
              ) : categorias.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
                  <Tag className="h-10 w-10 opacity-30" />
                  <p className="font-medium">Nenhuma categoria cadastrada</p>
                  <p className="text-sm">Clique em "Nova Categoria" para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Ord.</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="w-20 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...categorias]
                      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
                      .map((cat) => (
                        <TableRow key={cat.id} className="group">
                          <TableCell className="text-muted-foreground text-sm">{cat.ordem}</TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: cat.cor || "#6B7280",
                                color: "#fff",
                                border: "none",
                              }}
                              className="text-sm px-3 py-1 gap-1.5"
                            >
                              {cat.icone} {cat.nome}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditar(cat)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeletandoCategoria(cat)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {categorias.length} categoria{categorias.length !== 1 ? "s" : ""} cadastrada{categorias.length !== 1 ? "s" : ""}.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deletandoCategoria} onOpenChange={(v) => !v && setDeletandoCategoria(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria{" "}
              <span className="font-semibold">"{deletandoCategoria?.nome}"</span>?
              <br />
              As demandas vinculadas a ela perderão a associação com esta categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
