import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  FileText, 
  Bell, 
  MessageSquarePlus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { useUnidadesMorador, useBoletosMorador, useResumoMorador } from "@/hooks/usePortalMorador";
import { useComunicadosMorador } from "@/hooks/useComunicados";
import { MeusBoletos } from "@/components/portal-morador/MeusBoletos";
import { MeusComunicados } from "@/components/portal-morador/MeusComunicados";
import { NovoChamadoForm } from "@/components/portal-morador/NovoChamadoForm";
import { MinhasUnidades } from "@/components/portal-morador/MinhasUnidades";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PortalMorador() {
  const [showChamadoForm, setShowChamadoForm] = useState(false);
  const { data: unidades, isLoading: loadingUnidades } = useUnidadesMorador();
  const { data: boletos, isLoading: loadingBoletos } = useBoletosMorador();
  const { data: comunicados, isLoading: loadingComunicados } = useComunicadosMorador();
  const resumo = useResumoMorador();

  const comunicadosUrgentes = comunicados?.filter(c => c.tipo === "urgente") || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Portal do Morador</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Acompanhe seus boletos, comunicados e abra chamados
            </p>
          </div>
          <Button 
            onClick={() => setShowChamadoForm(true)}
            className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm font-bold shadow-md"
          >
            <MessageSquarePlus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
            Novo Chamado
          </Button>
        </div>

        {/* Alertas Urgentes */}
        {comunicadosUrgentes.length > 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Comunicados Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {comunicadosUrgentes.slice(0, 2).map(c => (
                  <div key={c.id} className="flex items-start gap-2">
                    <Bell className="h-4 w-4 mt-0.5 text-destructive" />
                    <div>
                      <p className="font-medium">{c.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(c.data_publicacao), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de Resumo */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minhas Unidades</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unidades?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Unidades vinculadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boletos Abertos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.boletosAbertos}</div>
              <p className="text-xs text-muted-foreground">
                Pendentes de pagamento
              </p>
            </CardContent>
          </Card>

          <Card className={resumo.boletosAtrasados > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boletos Atrasados</CardTitle>
              <Clock className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${resumo.boletosAtrasados > 0 ? "text-destructive" : ""}`}>
                {resumo.boletosAtrasados}
              </div>
              <p className="text-xs text-muted-foreground">
                Vencimento ultrapassado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(resumo.valorTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                Em aberto
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="boletos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="boletos" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Meus Boletos</span>
              <span className="sm:hidden">Boletos</span>
            </TabsTrigger>
            <TabsTrigger value="comunicados" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Comunicados</span>
              <span className="sm:hidden">Avisos</span>
              {comunicados && comunicados.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {comunicados.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unidades" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Minhas Unidades</span>
              <span className="sm:hidden">Unidades</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boletos">
            <MeusBoletos boletos={boletos || []} isLoading={loadingBoletos} />
          </TabsContent>

          <TabsContent value="comunicados">
            <MeusComunicados comunicados={comunicados || []} isLoading={loadingComunicados} />
          </TabsContent>

          <TabsContent value="unidades">
            <MinhasUnidades unidades={unidades || []} isLoading={loadingUnidades} />
          </TabsContent>
        </Tabs>

        {/* Modal de Novo Chamado */}
        <NovoChamadoForm 
          open={showChamadoForm} 
          onOpenChange={setShowChamadoForm}
          unidades={unidades || []}
        />
      </div>
    </MainLayout>
  );
}
