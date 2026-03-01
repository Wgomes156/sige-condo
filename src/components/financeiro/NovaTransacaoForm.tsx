import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useCategorias, useCreateTransacao } from "@/hooks/useFinanceiro";
import { useAuth } from "@/hooks/useAuth";
import { GerenciarCategoriasDialog } from "./GerenciarCategoriasDialog";

const formSchema = z.object({
  tipo: z.enum(["receita", "despesa"]),
  condominio_id: z.string().min(1, "Selecione um condomínio"),
  categoria_id: z.string().optional(),
  descricao: z.string().min(3, "Mínimo 3 caracteres"),
  valor: z.string().min(1, "Informe o valor"),
  data_vencimento: z.string().min(1, "Informe a data"),
  unidade: z.string().optional(),
  morador_nome: z.string().optional(),
  documento: z.string().optional(),
  observacoes: z.string().optional(),
  recorrente: z.boolean().default(false),
  recorrencia_tipo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NovaTransacaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoInicial?: "receita" | "despesa";
}

export function NovaTransacaoForm({
  open,
  onOpenChange,
  tipoInicial = "receita",
}: NovaTransacaoFormProps) {
  const { data: condominios } = useCondominios();
  const { profile } = useAuth();
  const createTransacao = useCreateTransacao();
  const [tipo, setTipo] = useState<"receita" | "despesa">(tipoInicial);
  const [showGerenciarCategorias, setShowGerenciarCategorias] = useState(false);
  const { data: categorias } = useCategorias(tipo);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: tipoInicial,
      condominio_id: "",
      categoria_id: "",
      descricao: "",
      valor: "",
      data_vencimento: "",
      unidade: "",
      morador_nome: "",
      documento: "",
      observacoes: "",
      recorrente: false,
      recorrencia_tipo: "",
    },
  });

  const recorrente = form.watch("recorrente");

  const onSubmit = async (data: FormData) => {
    const valor = parseFloat(data.valor.replace(",", "."));

    await createTransacao.mutateAsync({
      tipo: data.tipo,
      condominio_id: data.condominio_id,
      categoria_id: data.categoria_id || undefined,
      descricao: data.descricao,
      valor,
      data_vencimento: data.data_vencimento,
      unidade: data.unidade || undefined,
      morador_nome: data.morador_nome || undefined,
      documento: data.documento || undefined,
      observacoes: data.observacoes || undefined,
      recorrente: data.recorrente,
      recorrencia_tipo: data.recorrente ? data.recorrencia_tipo : undefined,
      criado_por_nome: profile?.nome || "Sistema",
    });

    form.reset();
    onOpenChange(false);
  };

  const handleTipoChange = (novoTipo: "receita" | "despesa") => {
    setTipo(novoTipo);
    form.setValue("tipo", novoTipo);
    form.setValue("categoria_id", "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Transação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(v) =>
                        handleTipoChange(v as "receita" | "despesa")
                      }
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="receita" id="receita" />
                        <Label
                          htmlFor="receita"
                          className="cursor-pointer text-emerald-600 font-medium"
                        >
                          Receita
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="despesa" id="despesa" />
                        <Label
                          htmlFor="despesa"
                          className="cursor-pointer text-red-600 font-medium"
                        >
                          Despesa
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="condominio_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condomínio *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {condominios?.map((cond) => (
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

              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Categoria</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowGerenciarCategorias(true)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Gerenciar
                      </Button>
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat.cor }}
                              />
                              {cat.nome}
                            </div>
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
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Taxa condominial Janeiro/2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade/Apartamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apto 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="morador_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Morador</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento/Referência</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: NF-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recorrente"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Transação Recorrente
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Marque se esta transação se repete periodicamente
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {recorrente && (
              <FormField
                control={form.control}
                name="recorrencia_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Recorrência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createTransacao.isPending}>
                {createTransacao.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>

        <GerenciarCategoriasDialog
          open={showGerenciarCategorias}
          onOpenChange={setShowGerenciarCategorias}
        />
      </DialogContent>
    </Dialog>
  );
}
