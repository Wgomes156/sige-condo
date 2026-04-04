import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";
import { useCondominios } from "@/hooks/useCondominios";
import { useCreateOrdemServico, useUpdateOrdemServico, OrdemServico } from "@/hooks/useOrdensServico";
import { useOperadores } from "@/hooks/useOperadores";
import { AnexosSection } from "@/components/anexos/AnexosSection";
import { useIsMobile } from "@/hooks/useIsMobile";

const formSchema = z.object({
  data_solicitacao: z.date({ required_error: "Data da solicitação é obrigatória" }),
  hora_solicitacao: z.string().min(1, "Hora da solicitação é obrigatória"),
  solicitante: z.string().min(1, "Solicitante é obrigatório"),
  condominio_id: z.string().optional(),
  condominio_nome: z.string().min(1, "Nome do condomínio é obrigatório"),
  descricao_servico: z.string().min(1, "Descrição do serviço é obrigatória"),
  status: z.enum(["aberta", "em_andamento", "concluida", "cancelada"]),
  prioridade: z.enum(["urgente", "periodico", "nao_urgente"]),
  data_atendimento: z.date().optional().nullable(),
  observacoes: z.string().optional(),
  atribuido_a: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export interface OcorrenciaPrefillData {
  condominio_id?: string;
  condominio_nome?: string;
  descricao_servico?: string;
  prioridade?: "urgente" | "periodico" | "nao_urgente";
  observacoes?: string;
}

interface NovaOSFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordemServico?: OrdemServico | null;
  prefillData?: OcorrenciaPrefillData | null;
}

export function NovaOSForm({ open, onOpenChange, ordemServico, prefillData }: NovaOSFormProps) {
  const isMobile = useIsMobile();
  const { data: condominios = [] } = useCondominios();
  const { data: operadores = [] } = useOperadores();
  const createOS = useCreateOrdemServico();
  const updateOS = useUpdateOrdemServico();

  const isEditing = !!ordemServico;

  const getDefaultValues = (): FormValues => {
    if (ordemServico) {
      return {
        data_solicitacao: new Date(ordemServico.data_solicitacao),
        hora_solicitacao: ordemServico.hora_solicitacao,
        solicitante: ordemServico.solicitante,
        condominio_id: ordemServico.condominio_id || undefined,
        condominio_nome: ordemServico.condominio_nome,
        descricao_servico: ordemServico.descricao_servico,
        status: ordemServico.status,
        prioridade: ordemServico.prioridade,
        data_atendimento: ordemServico.data_atendimento
          ? new Date(ordemServico.data_atendimento)
          : null,
        observacoes: ordemServico.observacoes || "",
        atribuido_a: ordemServico.atribuido_a || undefined,
      };
    }
    
    return {
      data_solicitacao: new Date(),
      hora_solicitacao: format(new Date(), "HH:mm"),
      solicitante: "",
      condominio_id: prefillData?.condominio_id,
      condominio_nome: prefillData?.condominio_nome || "",
      descricao_servico: prefillData?.descricao_servico || "",
      status: "aberta",
      prioridade: prefillData?.prioridade || "nao_urgente",
      observacoes: prefillData?.observacoes || "",
      atribuido_a: undefined,
    };
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when prefillData changes
  useEffect(() => {
    if (open && prefillData && !ordemServico) {
      form.reset(getDefaultValues());
    }
  }, [open, prefillData, ordemServico]);

  const handleCondominioChange = (condominioId: string) => {
    const condominio = condominios.find((c) => c.id === condominioId);
    if (condominio) {
      form.setValue("condominio_id", condominioId);
      form.setValue("condominio_nome", condominio.nome);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      data_solicitacao: format(values.data_solicitacao, "yyyy-MM-dd"),
      hora_solicitacao: values.hora_solicitacao,
      solicitante: values.solicitante,
      condominio_id: values.condominio_id || null,
      condominio_nome: values.condominio_nome,
      descricao_servico: values.descricao_servico,
      status: values.status,
      prioridade: values.prioridade,
      data_atendimento: values.data_atendimento
        ? format(values.data_atendimento, "yyyy-MM-dd")
        : null,
      observacoes: values.observacoes || null,
      atribuido_a: values.atribuido_a || null,
    };

    if (isEditing) {
      await updateOS.mutateAsync({ id: ordemServico.id, ...payload });
    } else {
      await createOS.mutateAsync(payload);
    }

    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[95vh] overflow-y-auto sm:max-w-2xl p-4 sm:p-6",
        isMobile ? "w-[95vw] rounded-lg" : "w-full"
      )}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-primary">
            {isEditing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Data da Solicitação */}
              <FormField
                control={form.control}
                name="data_solicitacao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-semibold">Data da Solicitação *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal h-11 sm:h-10",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hora da Solicitação */}
              <FormField
                control={form.control}
                name="hora_solicitacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Hora da Solicitação *</FormLabel>
                    <FormControl>
                      <Input type="time" className="h-11 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Solicitante */}
            <FormField
              control={form.control}
              name="solicitante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Solicitante *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do solicitante" className="h-11 sm:h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Condomínio (seleção) */}
              <FormField
                control={form.control}
                name="condominio_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Selecionar Condomínio</FormLabel>
                    <Select
                      onValueChange={handleCondominioChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-10">
                          <SelectValue placeholder="Selecione um condomínio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {condominios.map((cond) => (
                          <SelectItem key={cond.id} value={cond.id}>
                            {cond.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nome do Condomínio (manual) */}
              <FormField
                control={form.control}
                name="condominio_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Nome do Condomínio *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do condomínio" className="h-11 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição do Serviço */}
            <FormField
              control={form.control}
              name="descricao_servico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Descrição Detalhada do Serviço *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente o serviço solicitado..."
                      className="min-h-[100px] text-base sm:text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Status da OS *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-10">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aberta">Aberta</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prioridade */}
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Classificação da Prioridade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-10">
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="periodico">Periódico</SelectItem>
                        <SelectItem value="nao_urgente">Não Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Operador Responsável */}
            <FormField
              control={form.control}
              name="atribuido_a"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Operador Responsável</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "__none__" ? null : value)}
                    value={field.value || "__none__"}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 sm:h-10">
                        <SelectValue placeholder="Selecione um operador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {operadores.map((op) => (
                        <SelectItem key={op.user_id} value={op.user_id}>
                          {op.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data do Atendimento */}
            <FormField
              control={form.control}
              name="data_atendimento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-semibold">Data do Atendimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal h-11 sm:h-10",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Não informado</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Observações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      className="min-h-[80px] text-base sm:text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Anexos - apenas quando editando */}
            {isEditing && ordemServico && (
              <div className="pt-2">
                <AnexosSection
                  entidadeTipo="ordem_servico"
                  entidadeId={ordemServico.id}
                />
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm font-bold bg-primary"
                disabled={createOS.isPending || updateOS.isPending}
              >
                {createOS.isPending || updateOS.isPending
                  ? "Salvando..."
                  : isEditing
                  ? "Salvar Alterações"
                  : "Criar Ordem de Serviço"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
