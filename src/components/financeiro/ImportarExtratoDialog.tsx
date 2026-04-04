import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Upload, FileSpreadsheet, FileText, Loader2, AlertCircle, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useCategorias, useCreateTransacao } from "@/hooks/useFinanceiro";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface ImportarExtratoDialogProps {
  trigger?: React.ReactNode;
}

interface TransacaoImportada {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria?: string;
  status?: string;
  valido: boolean;
  erro?: string;
}

export function ImportarExtratoDialog({ trigger }: ImportarExtratoDialogProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [condominioId, setCondominioId] = useState<string>("");
  const [transacoes, setTransacoes] = useState<TransacaoImportada[]>([]);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "done">("upload");
  const [importResult, setImportResult] = useState({ success: 0, errors: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: condominios } = useCondominios({});
  const { data: categorias } = useCategorias();
  const createTransacao = useCreateTransacao();
  const { profile } = useAuth();

  const resetState = () => {
    setTransacoes([]);
    setImportStep("upload");
    setImportResult({ success: 0, errors: 0 });
    setCondominioId("");
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateTransacao = (t: Partial<TransacaoImportada>): { valido: boolean; erro?: string } => {
    const erros: string[] = [];
    if (!t.tipo || (t.tipo !== "receita" && t.tipo !== "despesa")) erros.push("Tipo inválido");
    if (!t.descricao?.trim()) erros.push("Descrição obrigatória");
    if (!t.valor || t.valor <= 0) erros.push("Valor inválido");
    if (!t.data_vencimento) erros.push("Data inválida");
    
    return {
      valido: erros.length === 0,
      erro: erros.length > 0 ? erros.join(", ") : undefined,
    };
  };

  const parseCSV = (content: string): TransacaoImportada[] => {
    const cleaned = content.replace(/\r/g, "");

    // Formato 1 (antigo): separado por ;
    if (cleaned.includes(";")) {
      const lines = cleaned.split("\n").filter((line) => line.trim());
      if (lines.length < 2) return [];

      const dataLines = lines.slice(1);

      return dataLines.map((line) => {
        const columns = line.split(";").map((col) => col.trim().replace(/"/g, ""));
        const [tipo, descricao, valorStr, dataVencimento, categoria, status] = columns;

        const tipoNormalizado = tipo?.toLowerCase()?.trim();
        const tipoValido = [
          "receita",
          "despesa",
          "entrada",
          "saida",
          "saída",
          "crédito",
          "credito",
          "débito",
          "debito",
          "c",
          "d",
        ].includes(tipoNormalizado);

        const tipoFinal: "receita" | "despesa" = [
          "receita",
          "entrada",
          "crédito",
          "credito",
          "c",
        ].includes(tipoNormalizado)
          ? "receita"
          : "despesa";

        const valorLimpo = valorStr?.replace(/[^\d,.-]/g, "").replace(",", ".");
        const valor = parseFloat(valorLimpo) || 0;

        let dataFormatada = "";
        if (dataVencimento) {
          const dateMatch = dataVencimento.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (dateMatch) {
            dataFormatada = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
          } else if (dataVencimento.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dataFormatada = dataVencimento;
          }
        }

        const validation = validateTransacao({
          tipo: tipoValido ? tipoFinal : undefined,
          descricao: descricao?.trim(),
          valor,
          data_vencimento: dataFormatada,
        });

        return {
          id: generateId(),
          tipo: tipoFinal,
          descricao: descricao?.trim() || "",
          valor,
          data_vencimento: dataFormatada,
          categoria: categoria?.trim() || undefined,
          status: status?.trim() || "pendente",
          ...validation,
        };
      });
    }

    // Formato 2 (extrato por espaço):
    // Ex.: "02 Condomínio 01/2026 Apto 202 1.022,83" e seções "[Receitas]" / "[Despesas]"
    const lines = cleaned
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let currentTipo: "receita" | "despesa" | null = null;
    const items: TransacaoImportada[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.includes("[receitas]")) {
        currentTipo = "receita";
        continue;
      }
      if (lower.includes("[despesas]")) {
        currentTipo = "despesa";
        continue;
      }

      // ignorar cabeçalhos e totais
      if (
        lower.startsWith("dia ") ||
        lower.startsWith("total") ||
        lower.startsWith("condom") ||
        lower.includes("referencia descr")
      ) {
        continue;
      }

      if (!currentTipo) continue;

      // Regex: DIA + CONTA (até referência) + REFERÊNCIA mm/yyyy + DESCRIÇÃO + VALOR
      const m = line.match(/^\s*(\d{1,2})\s+(.+?)\s+(\d{2}\/\d{4})\s+(.+?)\s+(-?[\d.]+,\d{2})\s*$/);
      if (!m) continue;

      const dia = Number(m[1]);
      const conta = m[2].trim();
      const referencia = m[3].trim();
      const descricaoRaw = m[4].trim();
      const valorStr = m[5].trim();

      const [mesStr, anoStr] = referencia.split("/");
      const mes = Number(mesStr);
      const ano = Number(anoStr);

      const valor = Number(valorStr.replace(/\./g, "").replace(",", ".")) || 0;
      const data_vencimento =
        ano && mes && dia
          ? `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
          : "";

      const descricao = `${conta} - ${descricaoRaw}`.trim();

      const validation = validateTransacao({
        tipo: currentTipo,
        descricao,
        valor,
        data_vencimento,
      });

      items.push({
        id: generateId(),
        tipo: currentTipo,
        descricao,
        valor,
        data_vencimento,
        status: "pendente",
        ...validation,
      });
    }

    return items;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    
    if (isPDF) {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const { data, error } = await supabase.functions.invoke("parse-pdf", {
          body: formData,
        });
        
        if (error) throw error;
        
        if (data?.transacoes && data.transacoes.length > 0) {
          const parsed: TransacaoImportada[] = data.transacoes.map((t: any) => {
            const validation = validateTransacao(t);
            return {
              id: generateId(),
              tipo: t.tipo,
              descricao: t.descricao,
              valor: t.valor,
              data_vencimento: t.data_vencimento,
              status: "pendente",
              ...validation,
            };
          });
          setTransacoes(parsed);
          setImportStep("preview");
        } else {
          toast.error("Não foi possível extrair transações do PDF. Tente um arquivo CSV.");
        }
      } catch (error: any) {
        console.error("Erro ao processar PDF:", error);
        toast.error("Erro ao processar PDF: " + (error.message || "Tente novamente"));
      } finally {
        setIsLoading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsed = parseCSV(content);
        setTransacoes(parsed);
        setImportStep("preview");
      };
      // Muitos extratos/CSVs do Brasil vêm em ISO-8859-1 (latin1)
      reader.readAsText(file, "ISO-8859-1");
    }
  };

  const handleUpdateTransacao = (id: string, field: keyof TransacaoImportada, value: any) => {
    setTransacoes(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const updated = { ...t, [field]: value };
      const validation = validateTransacao(updated);
      return { ...updated, ...validation };
    }));
  };

  const handleDeleteTransacao = (id: string) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTransacao = () => {
    const newTransacao: TransacaoImportada = {
      id: generateId(),
      tipo: "despesa",
      descricao: "",
      valor: 0,
      data_vencimento: format(new Date(), "yyyy-MM-dd"),
      status: "pendente",
      valido: false,
      erro: "Preencha os campos",
    };
    setTransacoes(prev => [...prev, newTransacao]);
    setEditingId(newTransacao.id);
  };

  const handleImport = async () => {
    if (!condominioId) {
      toast.error("Selecione um condomínio");
      return;
    }

    const validTransacoes = transacoes.filter((t) => t.valido);
    if (validTransacoes.length === 0) {
      toast.error("Nenhuma transação válida para importar");
      return;
    }

    setIsLoading(true);
    let success = 0;
    let errors = 0;

    for (const transacao of validTransacoes) {
      try {
        let categoriaId: string | undefined;
        if (transacao.categoria && categorias) {
          const cat = categorias.find(
            (c) => c.nome.toLowerCase() === transacao.categoria?.toLowerCase()
          );
          categoriaId = cat?.id;
        }

        await createTransacao.mutateAsync({
          condominio_id: condominioId,
          tipo: transacao.tipo,
          descricao: transacao.descricao,
          valor: transacao.valor,
          data_vencimento: transacao.data_vencimento,
          status: transacao.status || "pendente",
          categoria_id: categoriaId,
          criado_por_nome: profile?.nome || "Sistema",
        });
        success++;
      } catch (error) {
        console.error("Erro ao importar transação:", error);
        errors++;
      }
    }

    setImportResult({ success, errors });
    setImportStep("done");
    setIsLoading(false);

    if (success > 0) {
      toast.success(`${success} transação(ões) importada(s) com sucesso!`);
    }
    if (errors > 0) {
      toast.error(`${errors} transação(ões) com erro na importação`);
    }
  };

  const validCount = transacoes.filter((t) => t.valido).length;
  const invalidCount = transacoes.filter((t) => !t.valido).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetState();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar Extrato
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn(
        "max-h-[95vh] overflow-hidden p-0 flex flex-col",
        isMobile ? "max-w-[95vw] rounded-lg" : "sm:max-w-3xl"
      )}>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Importar Extrato Financeiro</DialogTitle>
          <DialogDescription>
            Importe transações financeiras a partir de um arquivo CSV e edite antes de salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">

        {importStep === "upload" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Condomínio *</Label>
              <Select value={condominioId} onValueChange={setCondominioId}>
                <SelectTrigger className="h-11 sm:h-10">
                  <SelectValue placeholder="Selecione o condomínio" />
                </SelectTrigger>
                <SelectContent>
                  {condominios?.map((cond) => (
                    <SelectItem key={cond.id} value={cond.id}>
                      {cond.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <FileText className="h-4 w-4" />
              </div>
              <AlertDescription>
                <strong>Formatos aceitos: CSV ou PDF</strong>
                <br />
                <span className="text-xs text-muted-foreground">
                  CSV: tipo;descricao;valor;data_vencimento;categoria;status
                  <br />
                  PDF: Extratos bancários com datas, descrições e valores serão detectados automaticamente.
                </span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Arquivo (CSV ou PDF)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.pdf"
                onChange={handleFileChange}
                disabled={isLoading}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer disabled:opacity-50"
              />
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando PDF...
                </div>
              )}
            </div>
          </div>
        )}

        {importStep === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {validCount} válidas
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {invalidCount} com erro
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size={isMobile ? "default" : "sm"} 
                onClick={handleAddTransacao}
                className={isMobile ? "h-11 shadow-sm" : ""}
              >
                + Adicionar Linha
              </Button>
            </div>

            <ScrollArea className="h-[350px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[120px]">Valor</TableHead>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes.map((t) => (
                    <TableRow key={t.id} className={!t.valido ? "bg-destructive/10" : ""}>
                      <TableCell>
                        {t.valido ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <span title={t.erro}>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === t.id ? (
                          <div>
                            <Select
                              value={t.tipo}
                              onValueChange={(v) => handleUpdateTransacao(t.id, "tipo", v)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="receita">Entrada</SelectItem>
                                <SelectItem value="despesa">Saída</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <Badge
                            variant={t.tipo === "receita" ? "default" : "secondary"}
                            className={
                              t.tipo === "receita"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                            }
                          >
                            {t.tipo === "receita" ? "Entrada" : "Saída"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === t.id ? (
                          <Input
                            value={t.descricao}
                            onChange={(e) => handleUpdateTransacao(t.id, "descricao", e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="truncate max-w-[200px] block">{t.descricao || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === t.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={t.valor}
                            onChange={(e) => handleUpdateTransacao(t.id, "valor", parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        ) : (
                          t.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === t.id ? (
                          <Input
                            type="date"
                            value={t.data_vencimento}
                            onChange={(e) => handleUpdateTransacao(t.id, "data_vencimento", e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          t.data_vencimento
                            ? format(new Date(t.data_vencimento + "T12:00:00"), "dd/MM/yyyy")
                            : "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingId === t.id ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingId(null)}
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingId(t.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDeleteTransacao(t.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={resetState}
                className="h-12 sm:h-10 text-base sm:text-sm"
              >
                Voltar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isLoading || validCount === 0}
                className="h-12 sm:h-10 text-base sm:text-sm font-bold shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar {validCount} transação(ões)
              </Button>
            </div>
          </div>
        )}

        {importStep === "done" && (
          <div className="space-y-4 py-8 text-center px-6">
            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600" />
            <div>
              <p className="text-lg font-semibold">Importação concluída!</p>
              <p className="text-muted-foreground">
                {importResult.success} transação(ões) importada(s) com sucesso
                {importResult.errors > 0 && `, ${importResult.errors} com erro`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                As transações aparecem na tabela principal onde podem ser editadas.
              </p>
            </div>
            <Button 
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm font-bold"
            >
              Fechar
            </Button>
          </div>
        )}
      </div>
      </DialogContent>
    </Dialog>
  );
}
