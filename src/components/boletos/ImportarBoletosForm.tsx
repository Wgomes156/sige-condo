import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Upload, FileText, AlertCircle, CheckCircle, Download } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useCreateBoletosBatch, BoletoInput } from "@/hooks/useBoletos";
import { toast } from "sonner";

interface ImportarBoletosFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BoletoPreview {
  unidade: string;
  morador_nome: string;
  morador_email: string;
  morador_telefone: string;
  valor: number;
  data_vencimento: string;
  referencia: string;
  nosso_numero: string;
  valido: boolean;
  erro?: string;
}

export function ImportarBoletosForm({ open, onOpenChange }: ImportarBoletosFormProps) {
  const { data: condominios } = useCondominios();
  const createBoletosBatch = useCreateBoletosBatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [condominioId, setCondominioId] = useState("");
  const [boletosPreview, setBoletosPreview] = useState<BoletoPreview[]>([]);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const resetForm = () => {
    setCondominioId("");
    setBoletosPreview([]);
    setFileName("");
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const parseCSV = (content: string): BoletoPreview[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("unidade") || header.includes("valor");

    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const values = line.split(";").map((v) => v.trim().replace(/"/g, ""));
      
      // Expected format: unidade;morador_nome;morador_email;morador_telefone;valor;data_vencimento;referencia;nosso_numero
      const [
        unidade = "",
        morador_nome = "",
        morador_email = "",
        morador_telefone = "",
        valorStr = "0",
        data_vencimento = "",
        referencia = "",
        nosso_numero = "",
      ] = values;

      const valor = parseFloat(valorStr.replace(",", ".")) || 0;
      
      let valido = true;
      let erro = "";

      if (!unidade) {
        valido = false;
        erro = "Unidade obrigatória";
      } else if (valor <= 0) {
        valido = false;
        erro = "Valor inválido";
      } else if (!data_vencimento || !/^\d{4}-\d{2}-\d{2}$/.test(data_vencimento)) {
        valido = false;
        erro = "Data inválida (use YYYY-MM-DD)";
      } else if (!referencia) {
        valido = false;
        erro = "Referência obrigatória";
      }

      return {
        unidade,
        morador_nome,
        morador_email,
        morador_telefone,
        valor,
        data_vencimento,
        referencia,
        nosso_numero,
        valido,
        erro,
      };
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const boletos = parseCSV(content);
      setBoletosPreview(boletos);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    if (!condominioId) {
      toast.error("Selecione um condomínio");
      return;
    }

    const boletosValidos = boletosPreview.filter((b) => b.valido);
    if (boletosValidos.length === 0) {
      toast.error("Nenhum boleto válido para importar");
      return;
    }

    const boletosInput: BoletoInput[] = boletosValidos.map((b) => ({
      condominio_id: condominioId,
      unidade: b.unidade,
      morador_nome: b.morador_nome || undefined,
      morador_email: b.morador_email || undefined,
      morador_telefone: b.morador_telefone || undefined,
      valor: b.valor,
      data_vencimento: b.data_vencimento,
      referencia: b.referencia,
      nosso_numero: b.nosso_numero || undefined,
    }));

    await createBoletosBatch.mutateAsync(boletosInput);
    resetForm();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const header = "unidade;morador_nome;morador_email;morador_telefone;valor;data_vencimento;referencia;nosso_numero";
    const example1 = "Apto 101;João Silva;joao@email.com;11999990000;850.00;2026-02-10;Fevereiro/2026;00001";
    const example2 = "Apto 102;Maria Santos;maria@email.com;11999990001;850.00;2026-02-10;Fevereiro/2026;00002";
    
    const content = [header, example1, example2].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_boletos.csv";
    link.click();
  };

  const validCount = boletosPreview.filter((b) => b.valido).length;
  const invalidCount = boletosPreview.filter((b) => !b.valido).length;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Boletos em Lote</DialogTitle>
          <DialogDescription>
            Importe múltiplos boletos de uma vez usando um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Condomínio *</Label>
              <Select onValueChange={setCondominioId} value={condominioId}>
                <SelectTrigger>
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

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Clique para selecionar um arquivo CSV</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou arraste e solte aqui
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Formato esperado do CSV</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Colunas separadas por ponto e vírgula (;):<br />
                    unidade; morador_nome; morador_email; morador_telefone; valor; data_vencimento (YYYY-MM-DD); referencia; nosso_numero
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 mt-2"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Baixar modelo CSV
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="gap-1">
                  <FileText className="w-3 h-3" />
                  {fileName}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  {validCount} válidos
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {invalidCount} com erro
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={resetForm}>
                Escolher outro arquivo
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Morador</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Referência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boletosPreview.slice(0, 10).map((boleto, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {boleto.valido ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <span title={boleto.erro}>
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{boleto.unidade}</TableCell>
                      <TableCell>{boleto.morador_nome || "-"}</TableCell>
                      <TableCell className="text-right">
                        {boleto.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>
                        {boleto.data_vencimento
                          ? new Date(boleto.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>{boleto.referencia}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {boletosPreview.length > 10 && (
                <div className="px-4 py-2 bg-muted text-center text-sm text-muted-foreground">
                  ... e mais {boletosPreview.length - 10} registros
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={createBoletosBatch.isPending || validCount === 0}
              >
                {createBoletosBatch.isPending
                  ? "Importando..."
                  : `Importar ${validCount} boleto${validCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
