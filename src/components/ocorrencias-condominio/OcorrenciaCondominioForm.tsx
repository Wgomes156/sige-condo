import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCondominios } from "@/hooks/useCondominios";
import {
  useCreateOcorrenciaCondominio,
  useUpdateOcorrenciaCondominio,
  OcorrenciaCondominio,
  TipoOcorrencia,
  StatusOcorrencia,
  PrioridadeOcorrencia,
} from "@/hooks/useOcorrenciasCondominio";
import { useEffect, useState } from "react";
import { AnexosSection } from "@/components/anexos/AnexosSection";
import { PendingFilesUploader, PendingFile } from "@/components/anexos/PendingFilesUploader";
import { uploadPendingFiles } from "@/hooks/useAnexos";
import { toast } from "sonner";

const formSchema = z.object({
  condominio_id: z.string().min(1, "Selecione um condomínio"),
  tipo_ocorrencia: z.enum(["manutencao", "seguranca", "convivencia", "outro"] as const),
  categoria: z.string().optional(),
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  descricao: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  local_ocorrencia: z.string().optional(),
  data_ocorrencia: z.string().optional(),
  status: z.enum(["aberta", "em_andamento", "resolvida", "cancelada"] as const),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"] as const),
  resolucao: z.string().optional(),
  custo_estimado: z.coerce.number().optional(),
  custo_real: z.coerce.number().optional(),
  atribuido_a: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OcorrenciaCondominioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ocorrencia?: OcorrenciaCondominio | null;
}

const TIPOS_OCORRENCIA: { value: TipoOcorrencia; label: string }[] = [
  { value: "manutencao", label: "Manutenção" },
  { value: "seguranca", label: "Segurança" },
  { value: "convivencia", label: "Convivência" },
  { value: "outro", label: "Outro" },
];

const STATUS_OCORRENCIA: { value: StatusOcorrencia; label: string }[] = [
  { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "resolvida", label: "Resolvida" },
  { value: "cancelada", label: "Cancelada" },
];

const PRIORIDADES: { value: PrioridadeOcorrencia; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const CATEGORIAS_POR_TIPO: Record<TipoOcorrencia, string[]> = {
  manutencao: ["Elevador", "Iluminação", "Hidráulica", "Elétrica", "Pintura", "Jardinagem", "Limpeza", "Outros"],
  seguranca: ["Câmeras", "Portaria", "Alarme", "Controle de Acesso", "Incêndio", "Invasão", "Vandalismo", "Outros"],
  convivencia: ["Barulho", "Animais", "Estacionamento", "Lixo", "Áreas Comuns", "Vizinhança", "Outros"],
  outro: ["Administrativo", "Jurídico", "Financeiro", "Outros"],
};

export function OcorrenciaCondominioForm({
  open,
  onOpenChange,
  ocorrencia,
}: OcorrenciaCondominioFormProps) {
  const { data: condominios = [] } = useCondominios();
  const createMutation = useCreateOcorrenciaCondominio();
  const updateMutation = useUpdateOcorrenciaCondominio();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      condominio_id: "",
      tipo_ocorrencia: "manutencao",
      categoria: "",
      titulo: "",
      descricao: "",
      local_ocorrencia: "",
      data_ocorrencia: new Date().toISOString().split("T")[0],
      status: "aberta",
      prioridade: "media",
      resolucao: "",
      custo_estimado: undefined,
      custo_real: undefined,
      atribuido_a: "",
      observacoes: "",
    },
  });

  const tipoSelecionado = form.watch("tipo_ocorrencia");
  const statusSelecionado = form.watch("status");

  // Cleanup pending files when dialog closes
  useEffect(() => {
    if (!open) {
      pendingFiles.forEach(pf => {
        if (pf.preview) URL.revokeObjectURL(pf.preview);
      });
      setPendingFiles([]);
    }
  }, [open]);

  useEffect(() => {
    if (ocorrencia) {
      form.reset({
        condominio_id: ocorrencia.condominio_id,
        tipo_ocorrencia: ocorrencia.tipo_ocorrencia,
        categoria: ocorrencia.categoria || "",
        titulo: ocorrencia.titulo,
        descricao: ocorrencia.descricao,
        local_ocorrencia: ocorrencia.local_ocorrencia || "",
        data_ocorrencia: ocorrencia.data_ocorrencia?.split("T")[0] || "",
        status: ocorrencia.status,
        prioridade: ocorrencia.prioridade,
        resolucao: ocorrencia.resolucao || "",
        custo_estimado: ocorrencia.custo_estimado || undefined,
        custo_real: ocorrencia.custo_real || undefined,
        atribuido_a: ocorrencia.atribuido_a || "",
        observacoes: ocorrencia.observacoes || "",
      });
    } else {
      form.reset({
        condominio_id: "",
        tipo_ocorrencia: "manutencao",
        categoria: "",
        titulo: "",
        descricao: "",
        local_ocorrencia: "",
        data_ocorrencia: new Date().toISOString().split("T")[0],
        status: "aberta",
        prioridade: "media",
        resolucao: "",
        custo_estimado: undefined,
        custo_real: undefined,
        atribuido_a: "",
        observacoes: "",
      });
    }
  }, [ocorrencia, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        condominio_id: data.condominio_id,
        tipo_ocorrencia: data.tipo_ocorrencia,
        categoria: data.categoria,
        titulo: data.titulo,
        descricao: data.descricao,
        local_ocorrencia: data.local_ocorrencia,
        data_ocorrencia: data.data_ocorrencia,
        status: data.status,
        prioridade: data.prioridade,
        resolucao: data.resolucao,
        custo_estimado: data.custo_estimado,
        custo_real: data.custo_real,
        atribuido_a: data.atribuido_a,
        observacoes: data.observacoes,
        data_resolucao: data.status === "resolvida" ? new Date().toISOString() : undefined,
      };

      if (ocorrencia) {
        await updateMutation.mutateAsync({ id: ocorrencia.id, ...payload });
      } else {
        // Create the occurrence first
        const newOcorrencia = await createMutation.mutateAsync(payload);
        
        // Upload pending files if any
        if (pendingFiles.length > 0 && newOcorrencia?.id) {
          setIsUploadingFiles(true);
          try {
            const files = pendingFiles.map(pf => pf.file);
            const result = await uploadPendingFiles(files, "ocorrencia_condominio", newOcorrencia.id);
            
            if (result.success > 0) {
              toast.success(`${result.success} arquivo(s) anexado(s) com sucesso!`);
            }
            if (result.failed > 0) {
              toast.warning(`${result.failed} arquivo(s) não puderam ser anexados.`);
            }
          } catch (error) {
            console.error("Erro ao enviar anexos:", error);
            toast.error("Erro ao enviar alguns anexos");
          } finally {
            setIsUploadingFiles(false);
          }
        }
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar ocorrência:", error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploadingFiles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {ocorrencia ? "Editar Ocorrência" : "Nova Ocorrência"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Condomínio e Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="condominio_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condomínio *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o condomínio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {condominios.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
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
                  name="tipo_ocorrencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_OCORRENCIA.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Categoria e Prioridade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIAS_POR_TIPO[tipoSelecionado]?.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
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
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORIDADES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Título */}
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Título da ocorrência" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a ocorrência detalhadamente..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Local e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="local_ocorrencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local da Ocorrência</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Hall de entrada, Piscina..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_ocorrencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Ocorrência</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status e Atribuído */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {STATUS_OCORRENCIA.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
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
                  name="atribuido_a"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atribuído a</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Custos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="custo_estimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Estimado (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custo_real"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Real (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Resolução (só aparece se status for resolvida ou em andamento) */}
              {(statusSelecionado === "resolvida" || statusSelecionado === "em_andamento") && (
                <FormField
                  control={form.control}
                  name="resolucao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resolução / Andamento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva as ações tomadas ou a resolução..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Anexos */}
              {ocorrencia ? (
                <AnexosSection
                  entidadeTipo="ocorrencia_condominio"
                  entidadeId={ocorrencia.id}
                />
              ) : (
                <PendingFilesUploader
                  pendingFiles={pendingFiles}
                  onFilesChange={setPendingFiles}
                  disabled={isPending}
                />
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Salvando..." : ocorrencia ? "Atualizar" : "Registrar"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
