import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Plus,
  Play,
  Settings,
  Users,
  MoreHorizontal,
  Calendar,
  History,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  useConfiguracoesCobranca,
  useHistoricoGeracao,
  useGerarBoletosManual,
  ConfiguracaoCobranca,
} from "@/hooks/useConfiguracaoCobranca";
import { ConfiguracaoCobrancaForm } from "@/components/boletos/ConfiguracaoCobrancaForm";
import { UnidadesManager } from "@/components/boletos/UnidadesManager";
import { useUnidades } from "@/hooks/useUnidades";

export default function BoletosRecorrentes() {
  const { data: configuracoes, isLoading } = useConfiguracoesCobranca();
  const { data: historico } = useHistoricoGeracao();
  const gerarBoletos = useGerarBoletosManual();

  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editConfig, setEditConfig] = useState<ConfiguracaoCobranca | null>(null);
  const [unidadesCondominio, setUnidadesCondominio] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [gerarConfirm, setGerarConfirm] = useState<ConfiguracaoCobranca | null>(null);

  const handleGerar = () => {
    if (gerarConfirm) {
      gerarBoletos.mutate({ condominio_id: gerarConfirm.condominio_id });
      setGerarConfirm(null);
    }
  };

  const handleGerarTodos = () => {
    gerarBoletos.mutate({});
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boletos Recorrentes</h1>
            <p className="text-muted-foreground">
              Configure a geração automática de boletos mensais por condomínio
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGerarTodos}
              disabled={gerarBoletos.isPending}
            >
              {gerarBoletos.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Gerar Todos
            </Button>
            <Button onClick={() => setShowConfigForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Configuração
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Configurações de Cobrança</CardTitle>
              <CardDescription>
                Condomínios configurados para geração automática de boletos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : !configuracoes || configuracoes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma configuração cadastrada</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowConfigForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Configuração
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Condomínio</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Última Geração</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configuracoes.map((config) => (
                        <ConfiguracaoRow
                          key={config.id}
                          config={config}
                          onEdit={() => {
                            setEditConfig(config);
                            setShowConfigForm(true);
                          }}
                          onUnidades={() =>
                            setUnidadesCondominio({
                              id: config.condominio_id,
                              nome: config.condominios?.nome || "",
                            })
                          }
                          onGerar={() => setGerarConfirm(config)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Geração
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!historico || historico.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma geração realizada
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {historico.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      {item.status === "sucesso" ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.condominios?.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.referencia} • {item.quantidade_boletos} boleto
                          {item.quantidade_boletos !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfiguracaoCobrancaForm
        open={showConfigForm}
        onOpenChange={(open) => {
          setShowConfigForm(open);
          if (!open) setEditConfig(null);
        }}
        configuracao={editConfig}
      />

      {unidadesCondominio && (
        <UnidadesManager
          open={!!unidadesCondominio}
          onOpenChange={() => setUnidadesCondominio(null)}
          condominioId={unidadesCondominio.id}
          condominioNome={unidadesCondominio.nome}
        />
      )}

      <AlertDialog open={!!gerarConfirm} onOpenChange={() => setGerarConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar boletos?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão gerados boletos para todas as unidades ativas de{" "}
              <strong>{gerarConfirm?.condominios?.nome}</strong> para o próximo mês.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGerar}>Gerar Boletos</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

function ConfiguracaoRow({
  config,
  onEdit,
  onUnidades,
  onGerar,
}: {
  config: ConfiguracaoCobranca;
  onEdit: () => void;
  onUnidades: () => void;
  onGerar: () => void;
}) {
  const { data: unidades } = useUnidades(config.condominio_id);
  const qtdUnidades = unidades?.filter((u) => u.ativa).length || 0;

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{config.condominios?.nome}</span>
          <span className="text-xs text-muted-foreground">
            {qtdUnidades} unidade{qtdUnidades !== 1 ? "s" : ""} ativa{qtdUnidades !== 1 ? "s" : ""}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {config.valor_padrao.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Dia {config.dia_vencimento}
        </div>
      </TableCell>
      <TableCell>
        {config.ultima_geracao
          ? new Date(config.ultima_geracao + "T12:00:00").toLocaleDateString("pt-BR")
          : "-"}
      </TableCell>
      <TableCell>
        <Badge variant={config.ativa ? "default" : "secondary"}>
          {config.ativa ? "Ativa" : "Pausada"}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onGerar} disabled={!config.ativa || qtdUnidades === 0}>
              <Play className="mr-2 h-4 w-4" />
              Gerar Boletos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onUnidades}>
              <Users className="mr-2 h-4 w-4" />
              Gerenciar Unidades
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
