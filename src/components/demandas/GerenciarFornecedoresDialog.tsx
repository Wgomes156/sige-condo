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
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Trash2, Plus, Save, X, Truck, Loader2 } from "lucide-react";
import {
  Fornecedor,
  useFornecedores,
  useCreateFornecedor,
  useUpdateFornecedor,
} from "@/hooks/useDemandas";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


const TIPOS_SERVICO = [
  { value: "eletrica", label: "Elétrica" },
  { value: "limpeza_caixa_dagua", label: "Limpeza Caixa D'água" },
  { value: "dedetizacao", label: "Dedetização" },
  { value: "cameras", label: "Câmeras/CFTV" },
  { value: "manutencao_portao", label: "Manutenção Portão" },
  { value: "engenheiro", label: "Engenheiro" },
  { value: "pintor", label: "Pintor" },
  { value: "obras_geral", label: "Obras em Geral" },
  { value: "extintor_incendios", label: "Extintor de Incêndios" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "juridico", label: "Jurídico" },
  { value: "despachante", label: "Despachante" },
  { value: "motoboy", label: "Motoboy" },
  { value: "outros", label: "Outros" },
];

interface FormState {
  nome: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  email: string;
  dados_bancarios: string;
  tipos_servico: string[];
  observacoes: string;
}

const FORM_INICIAL: FormState = {
  nome: "",
  cnpj: "",
  telefone: "",
  endereco: "",
  email: "",
  dados_bancarios: "",
  tipos_servico: [],
  observacoes: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarFornecedoresDialog({ open, onOpenChange }: Props) {
  const { data: fornecedores = [], isLoading } = useFornecedores();
  const createMutation = useCreateFornecedor();
  const updateMutation = useUpdateFornecedor();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [numeroEditando, setNumeroEditando] = useState<number | undefined>(undefined);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [deletandoFornecedor, setDeletandoFornecedor] = useState<Fornecedor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setNumeroEditando(undefined);
    setMostrarForm(false);
  };

  const handleNovoFornecedor = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setNumeroEditando(undefined);
    setMostrarForm(true);
  };

  const handleEditar = (forn: Fornecedor) => {
    setForm({
      nome: forn.nome,
      cnpj: forn.cnpj || "",
      telefone: forn.telefone || "",
      endereco: forn.endereco || "",
      email: forn.email || "",
      dados_bancarios: forn.dados_bancarios || "",
      tipos_servico: forn.tipos_servico || [],
      observacoes: forn.observacoes || "",
    });
    setEditandoId(forn.id);
    setNumeroEditando(forn.numero_fornecedor);
    setMostrarForm(true);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      toast.error("O nome do fornecedor é obrigatório.");
      return;
    }
    
    try {
      if (editandoId) {
        await updateMutation.mutateAsync({ id: editandoId, ...form });
      } else {
        await createMutation.mutateAsync({ ...form, contato_nome: null, cidade: null, uf: null });
      }
      resetForm();
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleConfirmarDelete = async () => {
    if (!deletandoFornecedor) return;
    setIsDeleting(true);
    try {
      // Soft delete: set ativo to false
      const { error } = await supabase
        .from("fornecedores")
        .update({ ativo: false })
        .eq("id", deletandoFornecedor.id);
        
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success("Fornecedor removido com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover fornecedor");
    } finally {
      setIsDeleting(false);
      setDeletandoFornecedor(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-5 w-5 text-primary" />
              Cadastro de Fornecedores
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!mostrarForm && (
              <Button onClick={handleNovoFornecedor} className="w-full sm:w-auto gap-2">
                <Plus className="h-4 w-4" />
                Novo Fornecedor
              </Button>
            )}

            {mostrarForm && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-primary">
                    {editandoId ? "Editar Fornecedor" : "Novo Fornecedor"}
                  </p>
                  {numeroEditando && (
                    <Badge variant="outline" className="font-mono">
                      Nº {numeroEditando}
                    </Badge>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Nome <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Nome do fornecedor ou empresa"
                      value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>CNPJ/CPF</Label>
                    <Input
                      placeholder="00.000.000/0000-00"
                      value={form.cnpj}
                      onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Tipos de Serviço</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 border rounded-md p-3 bg-background/50">
                      {TIPOS_SERVICO.map((ts) => (
                        <div key={ts.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`ts-${ts.value}`}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={form.tipos_servico.includes(ts.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm((f) => ({ ...f, tipos_servico: [...f.tipos_servico, ts.value] }));
                              } else {
                                setForm((f) => ({ ...f, tipos_servico: f.tipos_servico.filter(v => v !== ts.value) }));
                              }
                            }}
                          />
                          <label
                            htmlFor={`ts-${ts.value}`}
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {ts.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={form.telefone}
                      onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      placeholder="contato@empresa.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label>Endereço</Label>
                    <Input
                      placeholder="Rua, número, bairro, cidade..."
                      value={form.endereco}
                      onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label>Dados Bancários / PIX</Label>
                    <Input
                      placeholder="Chave PIX ou Banco/Ag/CC"
                      value={form.dados_bancarios}
                      onChange={(e) => setForm((f) => ({ ...f, dados_bancarios: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Observações adicionais..."
                      value={form.observacoes}
                      onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>

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

            <div className="rounded-md border">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando fornecedores...
                </div>
              ) : fornecedores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
                  <Truck className="h-10 w-10 opacity-30" />
                  <p className="font-medium">Nenhum fornecedor cadastrado</p>
                  <p className="text-sm">Clique em "Novo Fornecedor" para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Nº</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Tipos de Serviço</TableHead>
                      <TableHead className="w-20 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedores.map((forn) => (
                      <TableRow key={forn.id} className="group">
                        <TableCell className="text-muted-foreground text-sm font-mono">
                          {forn.numero_fornecedor ? forn.numero_fornecedor.toString().padStart(4, '0') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{forn.nome}</div>
                          {forn.cnpj && <div className="text-xs text-muted-foreground">{forn.cnpj}</div>}
                        </TableCell>
                        <TableCell>
                          {forn.telefone && <div className="text-sm">{forn.telefone}</div>}
                          {forn.email && <div className="text-xs text-muted-foreground">{forn.email}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {forn.tipos_servico?.slice(0, 2).map((t) => (
                              <Badge key={t} variant="secondary" className="text-[10px] py-0">
                                {TIPOS_SERVICO.find(s => s.value === t)?.label || t}
                              </Badge>
                            ))}
                            {(forn.tipos_servico?.length || 0) > 2 && (
                              <Badge variant="secondary" className="text-[10px] py-0">
                                +{(forn.tipos_servico?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditar(forn)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletandoFornecedor(forn)}
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
              {fornecedores.length} fornecedor{fornecedores.length !== 1 ? "es" : ""} cadastrado{fornecedores.length !== 1 ? "s" : ""}.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletandoFornecedor} onOpenChange={(v) => !v && setDeletandoFornecedor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor{" "}
              <span className="font-semibold">"{deletandoFornecedor?.nome}"</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
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
