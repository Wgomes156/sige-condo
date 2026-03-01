import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Upload, Trash2, Download, Users } from "lucide-react";
import {
  useUnidades,
  useCreateUnidade,
  useCreateUnidadesBatch,
  useDeleteUnidade,
  UnidadeInput,
} from "@/hooks/useUnidades";
import { toast } from "sonner";

interface UnidadesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominioId: string;
  condominioNome: string;
}

export function UnidadesManager({
  open,
  onOpenChange,
  condominioId,
  condominioNome,
}: UnidadesManagerProps) {
  const { data: unidades, isLoading } = useUnidades(condominioId);
  const createUnidade = useCreateUnidade();
  const createBatch = useCreateUnidadesBatch();
  const deleteUnidade = useDeleteUnidade();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [novaUnidade, setNovaUnidade] = useState({
    codigo: "",
    bloco: "",
    morador_nome: "",
    morador_email: "",
    morador_telefone: "",
  });

  const handleAddUnidade = async () => {
    if (!novaUnidade.codigo) {
      toast.error("Informe o código da unidade");
      return;
    }

    await createUnidade.mutateAsync({
      condominio_id: condominioId,
      codigo: novaUnidade.codigo,
      bloco: novaUnidade.bloco || undefined,
      morador_nome: novaUnidade.morador_nome || undefined,
      morador_email: novaUnidade.morador_email || undefined,
      morador_telefone: novaUnidade.morador_telefone || undefined,
    });

    setNovaUnidade({
      codigo: "",
      bloco: "",
      morador_nome: "",
      morador_email: "",
      morador_telefone: "",
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteUnidade.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const parseCSV = (content: string): UnidadeInput[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("codigo") || header.includes("unidade");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const values = line.split(";").map((v) => v.trim().replace(/"/g, ""));
      const [codigo = "", bloco = "", morador_nome = "", morador_email = "", morador_telefone = ""] = values;

      return {
        condominio_id: condominioId,
        codigo,
        bloco: bloco || undefined,
        morador_nome: morador_nome || undefined,
        morador_email: morador_email || undefined,
        morador_telefone: morador_telefone || undefined,
      };
    }).filter((u) => u.codigo);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const unidadesImport = parseCSV(content);

      if (unidadesImport.length === 0) {
        toast.error("Nenhuma unidade válida encontrada no arquivo");
        return;
      }

      await createBatch.mutateAsync(unidadesImport);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  const downloadTemplate = () => {
    const header = "codigo;bloco;morador_nome;morador_email;morador_telefone";
    const example1 = "101;A;João Silva;joao@email.com;11999990000";
    const example2 = "102;A;Maria Santos;maria@email.com;11999990001";

    const content = [header, example1, example2].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_unidades.csv";
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Unidades - {condominioNome}
          </DialogTitle>
          <DialogDescription>
            Gerencie as unidades e moradores para geração automática de boletos
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lista" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lista">Lista ({unidades?.length || 0})</TabsTrigger>
            <TabsTrigger value="adicionar">Adicionar</TabsTrigger>
            <TabsTrigger value="importar">Importar CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !unidades || unidades.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma unidade cadastrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione unidades manualmente ou importe via CSV
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Bloco</TableHead>
                      <TableHead>Morador</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unidades.map((unidade) => (
                      <TableRow key={unidade.id}>
                        <TableCell className="font-medium">{unidade.codigo}</TableCell>
                        <TableCell>{unidade.bloco || "-"}</TableCell>
                        <TableCell>{unidade.morador_nome || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {unidade.morador_email && (
                              <div className="text-muted-foreground">{unidade.morador_email}</div>
                            )}
                            {unidade.morador_telefone && (
                              <div className="text-muted-foreground">{unidade.morador_telefone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={unidade.ativa ? "default" : "secondary"}>
                            {unidade.ativa ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(unidade.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="adicionar" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Código da Unidade *</Label>
                <Input
                  placeholder="Ex: 101, Apto 1"
                  value={novaUnidade.codigo}
                  onChange={(e) => setNovaUnidade({ ...novaUnidade, codigo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bloco</Label>
                <Input
                  placeholder="Ex: A, Torre 1"
                  value={novaUnidade.bloco}
                  onChange={(e) => setNovaUnidade({ ...novaUnidade, bloco: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Nome do Morador</Label>
                <Input
                  placeholder="Nome completo"
                  value={novaUnidade.morador_nome}
                  onChange={(e) => setNovaUnidade({ ...novaUnidade, morador_nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={novaUnidade.morador_email}
                  onChange={(e) => setNovaUnidade({ ...novaUnidade, morador_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={novaUnidade.morador_telefone}
                  onChange={(e) =>
                    setNovaUnidade({ ...novaUnidade, morador_telefone: e.target.value })
                  }
                />
              </div>
            </div>
            <Button onClick={handleAddUnidade} disabled={createUnidade.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              {createUnidade.isPending ? "Adicionando..." : "Adicionar Unidade"}
            </Button>
          </TabsContent>

          <TabsContent value="importar" className="mt-4 space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-unidades"
              />
              <label htmlFor="csv-unidades" className="cursor-pointer flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Clique para selecionar um arquivo CSV</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Formato: codigo; bloco; morador_nome; morador_email; morador_telefone
                  </p>
                </div>
              </label>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Baixar modelo CSV
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir unidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
