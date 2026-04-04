import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, Download, Mail } from "lucide-react";
import { NovoBoletoForm } from "@/components/boletos/NovoBoletoForm";
import { ImportarBoletosForm } from "@/components/boletos/ImportarBoletosForm";
import { BoletosTable } from "@/components/boletos/BoletosTable";
import { FiltrosBoletos } from "@/components/boletos/FiltrosBoletos";
import { BoletosCards } from "@/components/boletos/BoletosCards";
import { EnvioEmailMassaPanel } from "@/components/boletos/EnvioEmailMassaPanel";
import { useBoletos, useResumoBoletos, BoletoFilters } from "@/hooks/useBoletos";
import { useAuth } from "@/hooks/useAuth";

export default function Boletos() {
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [filters, setFilters] = useState<BoletoFilters>({});
  const [activeTab, setActiveTab] = useState("boletos");
  const { userRole } = useAuth();

  const { data: boletos, isLoading } = useBoletos(filters);
  const { data: resumo, isLoading: isLoadingResumo } = useResumoBoletos(filters.condominio_id);
  const canCreate = userRole !== "morador";

  const handleExportCSV = () => {
    if (!boletos || boletos.length === 0) return;

    const headers = [
      "Condomínio",
      "Unidade",
      "Morador",
      "Email",
      "Telefone",
      "Valor",
      "Vencimento",
      "Pagamento",
      "Referência",
      "Nosso Número",
      "Status",
    ];

    const rows = boletos.map((b) => [
      b.condominios?.nome || "",
      b.unidade,
      b.morador_nome || "",
      b.morador_email || "",
      b.morador_telefone || "",
      b.valor.toString().replace(".", ","),
      b.data_vencimento,
      b.data_pagamento || "",
      b.referencia,
      b.nosso_numero || "",
      b.status,
    ]);

    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `boletos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Gestão de Boletos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Cadastre e gerencie boletos de cobrança por condomínio
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportCSV} 
              disabled={!boletos?.length}
              className="h-11 sm:h-10 text-xs sm:text-sm"
            >
              <Download className="mr-1 sm:mr-2 h-4 w-4" />
              Exportar
            </Button>
            {canCreate && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowImportForm(true)}
                  className="h-11 sm:h-10 text-xs sm:text-sm"
                >
                  <Upload className="mr-1 sm:mr-2 h-4 w-4" />
                  Importar
                </Button>
                <Button 
                  onClick={() => setShowNovoForm(true)}
                  className="col-span-2 sm:col-span-1 h-11 sm:h-10 text-xs sm:text-sm font-bold shadow-sm"
                >
                  <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                  Novo Boleto
                </Button>
              </>
            )}
          </div>
        </div>

        <BoletosCards resumo={resumo} isLoading={isLoadingResumo} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="boletos">Boletos</TabsTrigger>
            <TabsTrigger value="envio-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Envio de E-mails
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boletos" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Boletos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FiltrosBoletos filters={filters} onFiltersChange={setFilters} />
                <BoletosTable boletos={boletos || []} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="envio-email" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <EnvioEmailMassaPanel boletos={boletos || []} isLoading={isLoading} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Dicas para Envio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">📧 Cobrança Padrão</h4>
                    <p>Use para enviar o boleto de cobrança regular com todas as informações de pagamento.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">🔔 Lembrete de Vencimento</h4>
                    <p>Ideal para enviar alguns dias antes do vencimento como lembrete amigável.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">⚠️ Aviso de Inadimplência</h4>
                    <p>Para boletos vencidos, envia uma notificação formal solicitando a regularização.</p>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-amber-700 dark:text-amber-300">
                      <strong>Importante:</strong> Certifique-se de que os moradores têm e-mail cadastrado para receber as notificações.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <NovoBoletoForm open={showNovoForm} onOpenChange={setShowNovoForm} />
      <ImportarBoletosForm open={showImportForm} onOpenChange={setShowImportForm} />
    </>
  );
}
