import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Shield,
  User,
  FileText,
  Trash2,
  Edit,
  Key,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuditLogs, AuditLog, AuditLogFilters } from "@/hooks/useAuditLogs";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const actionLabels: Record<string, string> = {
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  password_reset: "Reset de Senha",
  login: "Login",
  logout: "Logout",
  role_change: "Alteração de Papel",
};

const actionIcons: Record<string, React.ElementType> = {
  create: User,
  update: Edit,
  delete: Trash2,
  password_reset: Key,
  login: Shield,
  logout: Shield,
  role_change: Shield,
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  password_reset: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  login: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  role_change: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

const entityLabels: Record<string, string> = {
  user: "Usuário",
  boleto: "Boleto",
  condominio: "Condomínio",
  unidade: "Unidade",
  ordem_servico: "Ordem de Serviço",
  comunicado: "Comunicado",
  transacao: "Transação",
};

export default function AuditLogs() {
  const { userRole } = useAuth();
  const { logs, loading, fetchLogs } = useAuditLogs();

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const handleApplyFilters = () => {
    const filters: AuditLogFilters = {
      search: debouncedSearch,
      action: actionFilter,
      entityType: entityFilter,
      startDate,
      endDate,
    };
    fetchLogs(filters);
  };

  const handleClearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setEntityFilter("all");
    setStartDate(null);
    setEndDate(null);
    fetchLogs();
  };

  const handleRefresh = () => {
    handleApplyFilters();
  };

  // Redirect non-admins
  if (userRole !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas administradores podem acessar os logs de auditoria.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ActionIcon = ({ action }: { action: string }) => {
    const Icon = actionIcons[action] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Registro de operações sensíveis do sistema
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
                <SelectItem value="password_reset">Reset de Senha</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="role_change">Alteração de Papel</SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Filter */}
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="condominio">Condomínio</SelectItem>
                <SelectItem value="unidade">Unidade</SelectItem>
                <SelectItem value="ordem_servico">Ordem de Serviço</SelectItem>
                <SelectItem value="comunicado">Comunicado</SelectItem>
                <SelectItem value="transacao">Transação</SelectItem>
              </SelectContent>
            </Select>

            {/* Start Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate || undefined}
                  onSelect={(date) => setStartDate(date || null)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* End Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={(date) => setEndDate(date || null)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters} size="sm">
              Aplicar Filtros
            </Button>
            <Button onClick={handleClearFilters} variant="outline" size="sm">
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Registros ({logs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mb-4" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="w-[140px]">Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead className="w-[80px]">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{log.user_email || "—"}</span>
                          <span className="text-xs text-muted-foreground">
                            {log.user_role || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "flex items-center gap-1 w-fit",
                            actionColors[log.action]
                          )}
                        >
                          <ActionIcon action={log.action} />
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {entityLabels[log.entity_type] || log.entity_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.entity_name || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Detalhes do Log
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Data/Hora
                  </label>
                  <p className="font-mono">
                    {format(
                      new Date(selectedLog.created_at),
                      "dd/MM/yyyy HH:mm:ss"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Ação
                  </label>
                  <p>
                    <Badge
                      className={cn(
                        actionColors[selectedLog.action]
                      )}
                    >
                      {actionLabels[selectedLog.action] || selectedLog.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Usuário Executor
                  </label>
                  <p>{selectedLog.user_email || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Papel do Usuário
                  </label>
                  <p>{selectedLog.user_role || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tipo de Entidade
                  </label>
                  <p>
                    {entityLabels[selectedLog.entity_type] ||
                      selectedLog.entity_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nome da Entidade
                  </label>
                  <p>{selectedLog.entity_name || "—"}</p>
                </div>
              </div>

              {selectedLog.entity_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ID da Entidade
                  </label>
                  <p className="font-mono text-sm">{selectedLog.entity_id}</p>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Detalhes da Operação
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {(selectedLog.ip_address || selectedLog.user_agent) && (
                <div className="pt-2 border-t">
                  <label className="text-sm font-medium text-muted-foreground">
                    Informações de Contexto
                  </label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedLog.ip_address && <p>IP: {selectedLog.ip_address}</p>}
                    {selectedLog.user_agent && (
                      <p className="truncate">User Agent: {selectedLog.user_agent}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
