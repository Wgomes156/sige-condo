import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { supabase } from "@/integrations/supabase/client";
import { exportExtratoCSV, exportExtratoPDF } from "@/lib/financeiroExportUtils";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface ExportarExtratoDialogProps {
  trigger?: React.ReactNode;
}

export function ExportarExtratoDialog({ trigger }: ExportarExtratoDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [condominioId, setCondominioId] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState(
    format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd")
  );
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: condominios } = useCondominios({});

  const handleExport = async (formato: "csv" | "pdf") => {
    if (!dataInicio || !dataFim) {
      toast.error("Selecione o período para exportação");
      return;
    }

    setIsLoading(true);

    try {
      let query = supabase
        .from("transacoes_financeiras")
        .select(`
          *,
          condominios(nome),
          categorias_financeiras(nome)
        `)
        .gte("data_vencimento", dataInicio)
        .lte("data_vencimento", dataFim)
        .order("data_vencimento", { ascending: true });

      if (condominioId !== "todos") {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro na consulta:", error);
        throw new Error("Erro ao buscar transações: " + error.message);
      }

      if (!data || data.length === 0) {
        toast.error("Não há transações no período selecionado");
        return;
      }

      const transacoes = data.map((t: any) => ({
        data_vencimento: t.data_vencimento || "",
        data_pagamento: t.data_pagamento || null,
        tipo: t.tipo || "despesa",
        descricao: t.descricao || "Sem descrição",
        valor: Number(t.valor) || 0,
        status: t.status || "pendente",
        categoria: t.categorias_financeiras?.nome || undefined,
        condominio: t.condominios?.nome || undefined,
      }));

      const condominioNome =
        condominioId !== "todos"
          ? condominios?.find((c) => c.id === condominioId)?.nome
          : undefined;

      const exportData = {
        transacoes,
        periodo: { inicio: dataInicio, fim: dataFim },
        condominio: condominioNome,
      };

      try {
        if (formato === "csv") {
          exportExtratoCSV(exportData);
        } else {
          exportExtratoPDF(exportData);
        }
        toast.success(`Extrato exportado com sucesso!`);
        setOpen(false);
      } catch (exportError: any) {
        console.error("Erro na geração do arquivo:", exportError);
        toast.error(exportError.message || "Erro ao gerar arquivo");
      }
    } catch (error: any) {
      console.error("Erro ao exportar extrato:", error);
      toast.error(error.message || "Erro ao exportar extrato");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Extrato
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Extrato Financeiro</DialogTitle>
          <DialogDescription>
            Selecione o período e o condomínio para gerar o extrato com entradas e saídas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Condomínio</Label>
            <Select value={condominioId} onValueChange={setCondominioId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o condomínio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os condomínios</SelectItem>
                {condominios?.map((cond) => (
                  <SelectItem key={cond.id} value={cond.id}>
                    {cond.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleExport("csv")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Exportar CSV
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleExport("pdf")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Exportar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
