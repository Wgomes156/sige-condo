import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, History } from "lucide-react";
import { useUpdateAtendimento, type Atendimento } from "@/hooks/useAtendimentos";
import { useAtendimentoHistorico, useCreateAtendimentoHistorico } from "@/hooks/useAtendimentoHistorico";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const atendimentoSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  operador_nome: z.string().min(1, "Operador é obrigatório"),
  canal: z.string().min(1, "Canal é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
  motivo: z.string().min(1, "Motivo é obrigatório"),
  observacoes: z.string().optional(),
  cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
  cliente_telefone: z.string().min(1, "Telefone é obrigatório"),
  cliente_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  condominio_nome: z.string().min(1, "Nome do condomínio é obrigatório"),
});

type AtendimentoFormData = z.infer<typeof atendimentoSchema>;

interface EditarAtendimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atendimento: Atendimento | null;
}

const canaisContato = [
  "Telefone",
  "WhatsApp",
  "E-mail",
  "Presencial",
  "Chat",
  "Redes Sociais",
];

const statusOptions = [
  "Em andamento",
  "Tem demanda",
  "Finalizado",
  "Aguardando retorno",
];

const historicoStatusOptions = [
  "Aguardando",
  "Em andamento",
  "Contrato fechado",
  "Encerrado sem contrato",
  "Outros",
];

const motivosContato = [
  "Dúvida",
  "Reclamação",
  "Solicitação de serviço",
  "Informação",
  "Orçamento",
  "Cancelamento",
  "Outros",
];

const getHistoricoStatusColor = (status: string) => {
  switch (status) {
    case "Aguardando":
      return "bg-orange-500/20 text-orange-700 border-orange-500/30";
    case "Em andamento":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "Contrato fechado":
      return "bg-green-500/20 text-green-700 border-green-500/30";
    case "Encerrado sem contrato":
      return "bg-red-500/20 text-red-700 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/30";
  }
};

export function EditarAtendimentoDialog({ open, onOpenChange, atendimento }: EditarAtendimentoDialogProps) {
  const updateAtendimento = useUpdateAtendimento();
  const { data: historico, isLoading: loadingHistorico } = useAtendimentoHistorico(atendimento?.id);
  const createHistorico = useCreateAtendimentoHistorico();
  const [showHistoricoForm, setShowHistoricoForm] = useState(false);
  const [historicoData, setHistoricoData] = useState("");
  const [historicoHora, setHistoricoHora] = useState("");
  const [historicoDetalhes, setHistoricoDetalhes] = useState("");
  const [historicoStatus, setHistoricoStatus] = useState("");

  const form = useForm<AtendimentoFormData>({
    resolver: zodResolver(atendimentoSchema),
    defaultValues: {
      data: "",
      hora: "",
      operador_nome: "",
      canal: "",
      status: "",
      motivo: "",
      observacoes: "",
      cliente_nome: "",
      cliente_telefone: "",
      cliente_email: "",
      condominio_nome: "",
    },
  });

  useEffect(() => {
    if (atendimento && open) {
      form.reset({
        data: atendimento.data,
        hora: atendimento.hora?.slice(0, 5) || "",
        operador_nome: atendimento.operador_nome,
        canal: atendimento.canal,
        status: atendimento.status,
        motivo: atendimento.motivo,
        observacoes: atendimento.observacoes || "",
        cliente_nome: atendimento.cliente_nome,
        cliente_telefone: atendimento.cliente_telefone,
        cliente_email: atendimento.cliente_email || "",
        condominio_nome: atendimento.condominio_nome,
      });
      setShowHistoricoForm(false);
    }
  }, [atendimento, open, form]);

  const onSubmit = async (data: AtendimentoFormData) => {
    if (!atendimento) return;
    
    try {
      await updateAtendimento.mutateAsync({
        id: atendimento.id,
        data: data.data,
        hora: data.hora,
        operador_nome: data.operador_nome,
        canal: data.canal,
        status: data.status,
        motivo: data.motivo,
        observacoes: data.observacoes || undefined,
        cliente_nome: data.cliente_nome,
        cliente_telefone: data.cliente_telefone,
        cliente_email: data.cliente_email || undefined,
        condominio_nome: data.condominio_nome,
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleAddHistorico = async () => {
    if (!atendimento || !historicoData || !historicoHora || !historicoDetalhes || !historicoStatus) return;

    await createHistorico.mutateAsync({
      atendimento_id: atendimento.id,
      data: historicoData,
      hora: historicoHora,
      detalhes: historicoDetalhes,
      status: historicoStatus,
    });

    setHistoricoData("");
    setHistoricoHora("");
    setHistoricoDetalhes("");
    setHistoricoStatus("");
    setShowHistoricoForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            Editar Atendimento
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Seção: Dados do Atendimento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Dados do Atendimento
                </h3>
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hora"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operador_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operador *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do operador" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="canal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canal de Contato *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o canal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {canaisContato.map((canal) => (
                              <SelectItem key={canal} value={canal}>
                                {canal}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="motivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo do Contato *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {motivosContato.map((motivo) => (
                              <SelectItem key={motivo} value={motivo}>
                                {motivo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalhes do atendimento..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Seção: Dados do Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Dados do Cliente
                </h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cliente_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cliente_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cliente_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Seção: Dados do Condomínio */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Dados do Condomínio
                </h3>
                <Separator />

                <FormField
                  control={form.control}
                  name="condominio_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Condomínio *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do condomínio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Seção: Histórico do Atendimento */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Histórico do Atendimento
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistoricoForm(!showHistoricoForm)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <Separator />

                {showHistoricoForm && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm font-medium">Data *</label>
                        <Input
                          type="date"
                          value={historicoData}
                          onChange={(e) => setHistoricoData(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Hora *</label>
                        <Input
                          type="time"
                          value={historicoHora}
                          onChange={(e) => setHistoricoHora(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status *</label>
                        <Select value={historicoStatus} onValueChange={setHistoricoStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {historicoStatusOptions.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Detalhes *</label>
                      <Textarea
                        placeholder="Descreva os detalhes desta interação..."
                        value={historicoDetalhes}
                        onChange={(e) => setHistoricoDetalhes(e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHistoricoForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddHistorico}
                        disabled={createHistorico.isPending || !historicoData || !historicoHora || !historicoDetalhes || !historicoStatus}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      >
                        {createHistorico.isPending ? "Salvando..." : "Salvar Registro"}
                      </Button>
                    </div>
                  </div>
                )}

                {loadingHistorico ? (
                  <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                ) : historico && historico.length > 0 ? (
                  <div className="space-y-3">
                    {historico.map((item) => (
                      <div key={item.id} className="flex gap-3 rounded-lg border p-3">
                        <div className="flex-shrink-0 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR })} às {item.hora?.slice(0, 5)}
                            </span>
                            <Badge variant="outline" className={getHistoricoStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.detalhes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum registro de histórico ainda.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateAtendimento.isPending}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {updateAtendimento.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
