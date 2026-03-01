import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays,
  Plus,
  Search,
  Eye,
  Settings,
  MoreHorizontal,
  XCircle,
  CheckCircle2,
  Clock,
  CalendarCheck,
  CalendarX,
  Users,
} from "lucide-react";
import { useReservas, useDeleteReserva, ReservaStatus } from "@/hooks/useReservas";
import { useCondominios } from "@/hooks/useCondominios";
import { useAuth } from "@/hooks/useAuth";
import { NovaReservaDialog } from "@/components/reservas/NovaReservaDialog";
import { ReservaDetalhesDialog } from "@/components/reservas/ReservaDetalhesDialog";
import { GerenciarAreasDialog } from "@/components/reservas/GerenciarAreasDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<ReservaStatus, { label: string; className: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-700", icon: Clock },
  confirmada: { label: "Confirmada", className: "bg-green-500/20 text-green-700", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", className: "bg-gray-500/20 text-gray-700", icon: CalendarX },
  concluida: { label: "Concluída", className: "bg-blue-500/20 text-blue-700", icon: CalendarCheck },
  recusada: { label: "Recusada", className: "bg-red-500/20 text-red-700", icon: XCircle },
};

export default function Reservas() {
  const { userRole } = useAuth();
  const canCreate = userRole !== "morador";
  const canManageAreas = userRole === "admin" || userRole === "gerente";

  const [filtroCondominio, setFiltroCondominio] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [novaReservaOpen, setNovaReservaOpen] = useState(false);
  const [reservaDetalhesId, setReservaDetalhesId] = useState<string | null>(null);
  const [gerenciarAreasOpen, setGerenciarAreasOpen] = useState(false);

  const { data: condominios } = useCondominios();
  const { data: reservas, isLoading } = useReservas({
    condominioId: filtroCondominio || undefined,
    status: (filtroStatus as ReservaStatus) || undefined,
    busca: busca || undefined,
  });
  const cancelarReserva = useDeleteReserva();

  // Stats
  const totalReservas = reservas?.length ?? 0;
  const pendentes = reservas?.filter((r) => r.status === "pendente").length ?? 0;
  const confirmadas = reservas?.filter((r) => r.status === "confirmada").length ?? 0;
  const comConvidados = reservas?.filter((r) => r.tem_convidados).reduce((acc, r) => acc + r.total_convidados, 0) ?? 0;

  const formatDate = (d: string) => {
    try { return format(new Date(d + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }); }
    catch { return d; }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-8 w-8" />
              Reservas de Áreas Comuns
            </h1>
            <p className="text-muted-foreground">
              Gerencie reservas e disponibilidade das áreas comuns
            </p>
          </div>
          <div className="flex gap-2">
            {canManageAreas && (
              <Button variant="outline" onClick={() => setGerenciarAreasOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Áreas Comuns
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => setNovaReservaOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Reserva
              </Button>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReservas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendentes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{confirmadas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convidados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{comConvidados}</div>
              <p className="text-xs text-muted-foreground">em todas as reservas</p>
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
                    placeholder="Buscar por número ou responsável..."
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
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus || "__none__"} onValueChange={(val) => setFiltroStatus(val === "__none__" ? "" : val)}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todos</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Reserva</TableHead>
                  <TableHead>Área Comum</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Convidados</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : reservas?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-8 w-8" />
                        <p>Nenhuma reserva encontrada</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reservas?.map((r) => {
                    const st = statusConfig[r.status];
                    const StIcon = st.icon;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.numero_reserva}</TableCell>
                        <TableCell>
                          <div>
                            <p>{r.area_comum?.nome}</p>
                            <p className="text-xs text-muted-foreground">{r.condominio?.nome}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{r.responsavel_nome}</p>
                            <p className="text-xs text-muted-foreground">{r.unidade?.codigo}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{formatDate(r.data_inicio)}</p>
                          {r.data_inicio !== r.data_fim && (
                            <p className="text-xs text-muted-foreground">a {formatDate(r.data_fim)}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.horario_inicio} – {r.horario_fim}
                        </TableCell>
                        <TableCell>
                          {r.tem_convidados ? (
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {r.total_convidados}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={st.className}>
                            <StIcon className="mr-1 h-3 w-3" />
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReservaDetalhesId(r.id)}>
                                <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                              </DropdownMenuItem>
                              {(r.status === "pendente" || r.status === "confirmada") && (
                                <DropdownMenuItem
                                  onClick={() => cancelarReserva.mutate(r.id)}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" /> Cancelar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <NovaReservaDialog open={novaReservaOpen} onOpenChange={setNovaReservaOpen} />
      <ReservaDetalhesDialog reservaId={reservaDetalhesId} open={!!reservaDetalhesId} onOpenChange={(o) => !o && setReservaDetalhesId(null)} />
      <GerenciarAreasDialog open={gerenciarAreasOpen} onOpenChange={setGerenciarAreasOpen} />
    </MainLayout>
  );
}
