import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Handshake,
  Plus,
  Search,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Eye,
} from "lucide-react";
import { useAcordos, AcordoStatus } from "@/hooks/useAcordos";
import { useCondominios } from "@/hooks/useCondominios";
import { NovoAcordoWizard } from "@/components/acordos/NovoAcordoWizard";
import { AcordoDetalhesDialog } from "@/components/acordos/AcordoDetalhesDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<AcordoStatus, { label: string; color: string; icon: React.ElementType }> = {
  em_negociacao: { label: "Em Negociação", color: "bg-yellow-500/20 text-yellow-600", icon: Clock },
  ativo: { label: "Ativo", color: "bg-blue-500/20 text-blue-600", icon: FileText },
  quitado: { label: "Quitado", color: "bg-green-500/20 text-green-600", icon: CheckCircle2 },
  rompido: { label: "Rompido", color: "bg-red-500/20 text-red-600", icon: XCircle },
  cancelado: { label: "Cancelado", color: "bg-gray-500/20 text-gray-600", icon: XCircle },
};

export default function Acordos() {
  const [filtroCondominio, setFiltroCondominio] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [novoAcordoOpen, setNovoAcordoOpen] = useState(false);
  const [acordoDetalhesId, setAcordoDetalhesId] = useState<string | null>(null);
  const { userRole } = useAuth();

  const { data: condominios } = useCondominios();
  const canCreate = userRole !== "morador";
  const { acordos, isLoading, stats } = useAcordos({
    condominioId: filtroCondominio || undefined,
    status: (filtroStatus as AcordoStatus) || undefined,
    busca: busca || undefined,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Handshake className="h-8 w-8" />
              Acordos de Pagamento
            </h1>
            <p className="text-muted-foreground">
              Gerencie negociações e acordos de pagamento com inadimplentes
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setNovoAcordoOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Acordo
            </Button>
          )}
        </div>

        {/* Cards de Indicadores */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acordos Ativos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.acordosAtivos ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                de {stats?.totalAcordos ?? 0} acordos totais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Recuperado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.valorRecuperado ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa: {(stats?.taxaRecuperacao ?? 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Pendente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.valorPendente ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                a receber dos acordos ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Risco</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.emRisco ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                acordos com risco de rompimento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, nome ou CPF/CNPJ..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroCondominio || "__none__"} onValueChange={(val) => setFiltroCondominio(val === "__none__" ? "" : val)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Condomínio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todos</SelectItem>
                  {condominios?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus || "__none__"} onValueChange={(val) => setFiltroStatus(val === "__none__" ? "" : val)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todos</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Acordos */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Valor Negociado</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : acordos?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Handshake className="h-8 w-8" />
                        <p>Nenhum acordo encontrado</p>
                        <Button variant="link" onClick={() => setNovoAcordoOpen(true)}>
                          Criar novo acordo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  acordos?.map((acordo) => {
                    const status = statusConfig[acordo.status];
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={acordo.id}>
                        <TableCell className="font-medium">
                          {acordo.numero_acordo}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{acordo.cliente_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {acordo.cliente_cpf_cnpj}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{acordo.unidade?.codigo}</p>
                            <p className="text-xs text-muted-foreground">
                              {acordo.condominio?.nome}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {formatCurrency(acordo.valor_total_negociado)}
                            </p>
                            {acordo.percentual_desconto && acordo.percentual_desconto > 0 && (
                              <p className="text-xs text-green-600">
                                -{acordo.percentual_desconto.toFixed(0)}% desconto
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{acordo.parcelas_pagas}</span>
                            <span className="text-muted-foreground">/</span>
                            <span>{acordo.qtd_parcelas}</span>
                            {acordo.parcelas_atrasadas > 0 && (
                              <Badge variant="destructive" className="ml-1 text-xs">
                                {acordo.parcelas_atrasadas} atrasada(s)
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(acordo.data_criacao), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAcordoDetalhesId(acordo.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Novo Acordo */}
      <Dialog open={novoAcordoOpen} onOpenChange={setNovoAcordoOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Acordo de Pagamento</DialogTitle>
            <DialogDescription>
              Inicie o processo de negociação de dívidas para a unidade selecionada.
            </DialogDescription>
          </DialogHeader>
          <NovoAcordoWizard onClose={() => setNovoAcordoOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes do Acordo */}
      <AcordoDetalhesDialog
        acordoId={acordoDetalhesId}
        open={!!acordoDetalhesId}
        onOpenChange={(open) => !open && setAcordoDetalhesId(null)}
      />
    </MainLayout>
  );
}
