import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Users, MapPin, Calendar, AlertCircle } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useUnidades } from "@/hooks/useUnidades";
import { useAreasComuns } from "@/hooks/useAreasComuns";
import { useCreateReserva, useVerificarDisponibilidade } from "@/hooks/useReservas";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatTelefone, formatCpf } from "@/lib/masks";

interface NovaReservaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Convidado {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
}

export function NovaReservaDialog({ open, onOpenChange }: NovaReservaDialogProps) {
  const { user } = useAuth();
  const { data: condominios } = useCondominios();
  const [condominioId, setCondominioId] = useState("");
  const { data: unidades, isLoading: loadingUnidades } = useUnidades(condominioId || undefined);
  const { data: areas, isLoading: loadingAreas } = useAreasComuns(condominioId || undefined);
  const createReserva = useCreateReserva();
  const verificarDisponibilidade = useVerificarDisponibilidade();

  const [form, setForm] = useState({
    unidade_id: "",
    area_comum_id: "",
    responsavel_nome: "",
    responsavel_telefone: "",
    responsavel_email: "",
    responsavel_cpf: "",
    data_inicio: "",
    data_fim: "",
    horario_inicio: "",
    horario_fim: "",
    observacoes: "",
    tem_convidados: false,
  });

  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [novoConvidado, setNovoConvidado] = useState({ nome: "", cpf: "", telefone: "" });
  const [conflito, setConflito] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({
        unidade_id: "", area_comum_id: "", responsavel_nome: "", responsavel_telefone: "",
        responsavel_email: "", responsavel_cpf: "", data_inicio: "", data_fim: "",
        horario_inicio: "", horario_fim: "", observacoes: "", tem_convidados: false,
      });
      setConvidados([]);
      setCondominioId("");
      setConflito(false);
    }
  }, [open]);

  // Verificar disponibilidade quando área e datas mudam
  useEffect(() => {
    if (form.area_comum_id && form.data_inicio && form.data_fim && form.horario_inicio && form.horario_fim) {
      verificarDisponibilidade.mutate(
        {
          area_comum_id: form.area_comum_id,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim,
          horario_inicio: form.horario_inicio,
          horario_fim: form.horario_fim,
        },
        {
          onSuccess: (result) => setConflito(!result.disponivel),
        }
      );
    }
  }, [form.area_comum_id, form.data_inicio, form.data_fim, form.horario_inicio, form.horario_fim]);

  const areaSelecionada = areas?.find((a) => a.id === form.area_comum_id);

  const adicionarConvidado = () => {
    if (!novoConvidado.nome || !novoConvidado.cpf) {
      toast.error("Nome e CPF são obrigatórios para convidados.");
      return;
    }
    if (convidados.some((c) => c.cpf === novoConvidado.cpf)) {
      toast.error("CPF já adicionado na lista.");
      return;
    }
    setConvidados([...convidados, { ...novoConvidado, id: crypto.randomUUID() }]);
    setNovoConvidado({ nome: "", cpf: "", telefone: "" });
  };

  const removerConvidado = (id: string) => {
    setConvidados(convidados.filter((c) => c.id !== id));
  };

  const handleSubmit = () => {
    if (!condominioId || !form.unidade_id || !form.area_comum_id) {
      toast.error("Selecione condomínio, unidade e área comum.");
      return;
    }
    if (!form.data_inicio || !form.data_fim || !form.horario_inicio || !form.horario_fim) {
      toast.error("Preencha data e horário.");
      return;
    }
    if (!form.responsavel_nome || !form.responsavel_telefone) {
      toast.error("Nome e telefone do responsável são obrigatórios.");
      return;
    }
    if (conflito) {
      toast.error("Há conflito de horário. Escolha outro período.");
      return;
    }
    if (form.tem_convidados && convidados.length === 0) {
      toast.error("Adicione ao menos um convidado.");
      return;
    }

    createReserva.mutate(
      {
        reserva: {
          condominio_id: condominioId,
          unidade_id: form.unidade_id,
          area_comum_id: form.area_comum_id,
          responsavel_nome: form.responsavel_nome,
          responsavel_telefone: form.responsavel_telefone,
          responsavel_email: form.responsavel_email || null,
          responsavel_cpf: form.responsavel_cpf || null,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim,
          horario_inicio: form.horario_inicio,
          horario_fim: form.horario_fim,
          tem_convidados: form.tem_convidados,
          total_convidados: convidados.length,
          valor_taxa: areaSelecionada?.valor_taxa || 0,
          observacoes: form.observacoes || null,
          criado_por: user?.id,
        },
        convidados: form.tem_convidados ? convidados : undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Nova Reserva de Área Comum
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para reservar uma área comum do condomínio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Condomínio e Unidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Condomínio *</Label>
              <Select value={condominioId} onValueChange={(v) => { setCondominioId(v); setForm(f => ({ ...f, unidade_id: "", area_comum_id: "" })); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {condominios?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade *</Label>
              <Select value={form.unidade_id} onValueChange={(v) => setForm(f => ({ ...f, unidade_id: v }))} disabled={!condominioId}>
                <SelectTrigger><SelectValue placeholder={!condominioId ? "Selecione o condomínio primeiro" : loadingUnidades ? "Carregando..." : "Selecione"} /></SelectTrigger>
                <SelectContent>
                  {unidades && unidades.length > 0 ? unidades.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.codigo} {u.bloco ? `- Bloco ${u.bloco}` : ""} {u.numero_unidade ? `- ${u.numero_unidade}` : ""}</SelectItem>
                  )) : (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">Nenhuma unidade encontrada</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Área Comum */}
          {condominioId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Área Comum *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {areas?.map((area) => (
                  <Card
                    key={area.id}
                    className={`cursor-pointer transition-all ${form.area_comum_id === area.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"}`}
                    onClick={() => setForm(f => ({ ...f, area_comum_id: area.id }))}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold">{area.nome}</p>
                      {area.capacidade && (
                        <p className="text-xs text-muted-foreground">Capacidade: {area.capacidade}</p>
                      )}
                      {area.valor_taxa && area.valor_taxa > 0 && (
                        <Badge variant="secondary" className="mt-1">
                          R$ {Number(area.valor_taxa).toFixed(2)}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {areas?.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-3">Nenhuma área cadastrada.</p>
                )}
              </div>
            </div>
          )}

          {/* Datas e Horários */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Início *</Label>
              <Input type="date" min={today} value={form.data_inicio} onChange={(e) => setForm(f => ({ ...f, data_inicio: e.target.value, data_fim: f.data_fim < e.target.value ? e.target.value : f.data_fim }))} />
            </div>
            <div className="space-y-2">
              <Label>Data Fim *</Label>
              <Input type="date" min={form.data_inicio || today} value={form.data_fim} onChange={(e) => setForm(f => ({ ...f, data_fim: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Horário Início *</Label>
              <Input type="time" value={form.horario_inicio} onChange={(e) => setForm(f => ({ ...f, horario_inicio: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Horário Fim *</Label>
              <Input type="time" value={form.horario_fim} onChange={(e) => setForm(f => ({ ...f, horario_fim: e.target.value }))} />
            </div>
          </div>

          {conflito && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              Conflito de agenda: já existe reserva neste período para esta área.
            </div>
          )}

          {/* Responsável */}
          <div>
            <h4 className="font-medium mb-3">Responsável pela Reserva</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={form.responsavel_nome} onChange={(e) => setForm(f => ({ ...f, responsavel_nome: e.target.value }))} placeholder="Nome do responsável" />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input value={form.responsavel_telefone} onChange={(e) => setForm(f => ({ ...f, responsavel_telefone: formatTelefone(e.target.value) }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.responsavel_email} onChange={(e) => setForm(f => ({ ...f, responsavel_email: e.target.value }))} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={form.responsavel_cpf} onChange={(e) => setForm(f => ({ ...f, responsavel_cpf: formatCpf(e.target.value) }))} placeholder="000.000.000-00" />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Observações adicionais..." rows={2} />
          </div>

          {/* Convidados */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <Label className="text-base">Terá convidados externos?</Label>
              <Switch checked={form.tem_convidados} onCheckedChange={(v) => setForm(f => ({ ...f, tem_convidados: v }))} />
            </div>

            {form.tem_convidados && (
              <div className="space-y-3 border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Nome e CPF são obrigatórios para liberação de acesso no condomínio.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome *</Label>
                    <Input value={novoConvidado.nome} onChange={(e) => setNovoConvidado(c => ({ ...c, nome: e.target.value }))} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CPF *</Label>
                    <Input value={novoConvidado.cpf} onChange={(e) => setNovoConvidado(c => ({ ...c, cpf: formatCpf(e.target.value) }))} placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefone</Label>
                    <Input value={novoConvidado.telefone} onChange={(e) => setNovoConvidado(c => ({ ...c, telefone: formatTelefone(e.target.value) }))} placeholder="(00) 00000-0000" />
                  </div>
                  <Button onClick={adicionarConvidado} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>

                {convidados.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {convidados.map((c, i) => (
                        <TableRow key={c.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{c.nome}</TableCell>
                          <TableCell>{c.cpf}</TableCell>
                          <TableCell>{c.telefone || "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removerConvidado(c.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <p className="text-xs text-muted-foreground">
                  Total: <strong>{convidados.length}</strong> convidado(s)
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createReserva.isPending || conflito}>
            {createReserva.isPending ? "Salvando..." : "Confirmar Reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
