import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useReserva, useReservaConvidados, useUpdateReservaStatus, ReservaStatus } from "@/hooks/useReservas";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface Props {
  reservaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<ReservaStatus, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-700" },
  confirmada: { label: "Confirmada", className: "bg-green-500/20 text-green-700" },
  cancelada: { label: "Cancelada", className: "bg-gray-500/20 text-gray-700" },
  concluida: { label: "Concluída", className: "bg-blue-500/20 text-blue-700" },
  recusada: { label: "Recusada", className: "bg-red-500/20 text-red-700" },
};

export function ReservaDetalhesDialog({ reservaId, open, onOpenChange }: Props) {
  const { data: reserva, isLoading } = useReserva(reservaId);
  const { data: convidados } = useReservaConvidados(reservaId);
  const updateStatus = useUpdateReservaStatus();
  const { userRole } = useAuth();
  const canManage = userRole === "admin" || userRole === "gerente";
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [showRecusa, setShowRecusa] = useState(false);

  if (isLoading || !reserva) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent><p>Carregando...</p></DialogContent>
      </Dialog>
    );
  }

  const status = statusConfig[reserva.status] || statusConfig.pendente;

  const handleStatus = (newStatus: ReservaStatus) => {
    updateStatus.mutate({
      id: reserva.id,
      status: newStatus,
      motivo_recusa: newStatus === "recusada" ? motivoRecusa : undefined,
    }, {
      onSuccess: () => {
        setShowRecusa(false);
        setMotivoRecusa("");
      },
    });
  };

  const formatDate = (d: string) => {
    try {
      return format(new Date(d + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
    } catch { return d; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reserva {reserva.numero_reserva}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da reserva de área comum.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status e Área */}
          <div className="flex items-center justify-between">
            <Badge className={status.className}>{status.label}</Badge>
            <div className="text-right">
              <p className="font-medium">{(reserva as any).area_comum?.nome}</p>
              <p className="text-xs text-muted-foreground">{(reserva as any).condominio?.nome} • {(reserva as any).unidade?.codigo}</p>
            </div>
          </div>

          <Separator />

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Período</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(reserva.data_inicio)} a {formatDate(reserva.data_fim)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Horário</p>
                <p className="text-sm text-muted-foreground">
                  {reserva.horario_inicio} às {reserva.horario_fim}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Responsável */}
          <div>
            <h4 className="font-medium mb-2">Responsável</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {reserva.responsavel_nome}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {reserva.responsavel_telefone}
              </div>
              {reserva.responsavel_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {reserva.responsavel_email}
                </div>
              )}
              {reserva.responsavel_cpf && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  CPF: {reserva.responsavel_cpf}
                </div>
              )}
            </div>
          </div>

          {/* Taxa */}
          {reserva.valor_taxa > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Reserva</span>
                <div className="text-right">
                  <span className="font-bold">R$ {Number(reserva.valor_taxa).toFixed(2)}</span>
                  <Badge variant={reserva.taxa_paga ? "default" : "outline"} className="ml-2">
                    {reserva.taxa_paga ? "Paga" : "Pendente"}
                  </Badge>
                </div>
              </div>
            </>
          )}

          {/* Convidados */}
          {reserva.tem_convidados && convidados && convidados.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Convidados ({convidados.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {convidados.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.nome}</TableCell>
                        <TableCell>{c.cpf}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {c.status_acesso === "liberado" ? "Liberado" : c.status_acesso === "bloqueado" ? "Bloqueado" : "Pendente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Observações */}
          {reserva.observacoes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-1">Observações</h4>
                <p className="text-sm text-muted-foreground">{reserva.observacoes}</p>
              </div>
            </>
          )}

          {/* Motivo Recusa */}
          {reserva.motivo_recusa && (
            <>
              <Separator />
              <div className="p-3 bg-destructive/10 rounded-md">
                <h4 className="font-medium text-destructive flex items-center gap-1 mb-1">
                  <AlertCircle className="h-4 w-4" /> Motivo da Recusa
                </h4>
                <p className="text-sm">{reserva.motivo_recusa}</p>
              </div>
            </>
          )}

          {/* Recusa form */}
          {showRecusa && (
            <div className="space-y-2 border rounded-lg p-3">
              <Label>Motivo da Recusa *</Label>
              <Textarea value={motivoRecusa} onChange={(e) => setMotivoRecusa(e.target.value)} placeholder="Informe o motivo..." />
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" disabled={!motivoRecusa} onClick={() => handleStatus("recusada")}>
                  Confirmar Recusa
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowRecusa(false)}>Voltar</Button>
              </div>
            </div>
          )}
        </div>

        {/* Ações de gestão */}
        {canManage && reserva.status === "pendente" && !showRecusa && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecusa(true)}>
              <XCircle className="h-4 w-4 mr-1" /> Recusar
            </Button>
            <Button onClick={() => handleStatus("confirmada")} disabled={updateStatus.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar
            </Button>
          </DialogFooter>
        )}

        {canManage && reserva.status === "confirmada" && (
          <DialogFooter>
            <Button onClick={() => handleStatus("concluida")} disabled={updateStatus.isPending}>
              Marcar como Concluída
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
