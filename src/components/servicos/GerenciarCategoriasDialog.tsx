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
import { Textarea } from "@/components/ui/textarea";
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
import { CategoriaServico, useServicos } from "@/hooks/useServicos";

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
  "💼", "📐", "🎨", "🏠", "🔨", "⚙️", "🌐", "📦",
];

interface FormState {
  nome_categoria: string;
  descricao: string;
  icone: string;
  cor: string;
  ordem_exibicao: number;
  ativo: boolean;
}

const FORM_INICIAL: FormState = {
  nome_categoria: "",
  descricao: "",
  icone: "🔧",
  cor: "#3B82F6",
  ordem_exibicao: 1,
  ativo: true,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarCategoriasDialogServicos({ open, onOpenChange }: Props) {
  const { categorias, criarCategoria, atualizarCategoria, excluirCategoria } = useServicos();

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [deletandoCategoria, setDeletandoCategoria] = useState<CategoriaServico | null>(null);

  const isSaving = criarCategoria.isPending || atualizarCategoria.isPending;

  const resetForm = () => {
    setForm({ ...FORM_INICIAL, ordem_exibicao: (categorias.length || 0) + 1 });
    setEditandoId(null);
    setMostrarForm(false);
  };

  const handleNovaCategoria = () => {
    setForm({ ...FORM_INICIAL, ordem_exibicao: (categorias.length || 0) + 1 });
    setEditandoId(null);
    setMostrarForm(true);
  };

  const handleEditar = (cat: CategoriaServico) => {
    setForm({
      nome_categoria: cat.nome_categoria,
      descricao: cat.descricao || "",
      icone: cat.icone || "🔧",
      cor: cat.cor || "#3B82F6",
      ordem_exibicao: cat.ordem_exibicao || 1,
      ativo: cat.ativo ?? true,
    });
    setEditandoId(cat.id);
    setMostrarForm(true);
  };

  const handleSalvar = async () => {
    if (!form.nome_categoria.trim()) return;
    if (editandoId) {
      await atualizarCategoria.mutateAsync({ id: editandoId, ...form });
    } else {
      await criarCategoria.mutateAsync(form);
    }
    resetForm();
  };

  const handleConfirmarDelete = async () => {
    if (!deletandoCategoria) return;
    await excluirCategoria.mutateAsync(deletandoCategoria.id);
    setDeletandoCategoria(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Tag className="h-5 w-5 text-primary" />
              Gerenciar Categorias — Serviços
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
                    placeholder="Ex: Limpeza, Segurança, Jardinagem..."
                    value={form.nome_categoria}
                    onChange={(e) => setForm((f) => ({ ...f, nome_categoria: e.target.value }))}
                    maxLength={80}
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-1">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o tipo de serviços desta categoria..."
                    value={form.descricao}
                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                    rows={2}
                    maxLength={200}
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
                        {form.icone} {form.nome_categoria || "Preview"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Ordem */}
                <div className="space-y-1 max-w-[120px]">
                  <Label>Ordem de Exibição</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.ordem_exibicao}
                    onChange={(e) => setForm((f) => ({ ...f, ordem_exibicao: Number(e.target.value) }))}
                  />
                </div>

                {/* Ações do form */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSalvar}
                    disabled={!form.nome_categoria.trim() || isSaving}
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
              {categorias.length === 0 ? (
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
                      <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                      <TableHead className="w-20 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...categorias]
                      .sort((a, b) => (a.ordem_exibicao ?? 0) - (b.ordem_exibicao ?? 0))
                      .map((cat) => (
                        <TableRow key={cat.id} className="group">
                          <TableCell className="text-muted-foreground text-sm">
                            {cat.ordem_exibicao ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: cat.cor || "#6B7280",
                                color: "#fff",
                                border: "none",
                              }}
                              className="text-sm px-3 py-1 gap-1.5 whitespace-nowrap"
                            >
                              {cat.icone} {cat.nome_categoria}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                            {cat.descricao || "—"}
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
            <AlertDialogTitle>Desativar Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar a categoria{" "}
              <span className="font-semibold">"{deletandoCategoria?.nome_categoria}"</span>?
              <br />
              Ela deixará de aparecer nas listas, mas os serviços vinculados não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {excluirCategoria.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
