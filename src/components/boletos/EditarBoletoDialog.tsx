import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCondominios } from "@/hooks/useCondominios";
import { useCategorias } from "@/hooks/useFinanceiro";
import { Boleto, useUpdateBoleto } from "@/hooks/useBoletos";

const formSchema = z.object({
  condominio_id: z.string().min(1, "Selecione um condomínio"),
  categoria_id: z.string().optional(),
  unidade: z.string().min(1, "Informe a unidade"),
  morador_nome: z.string().optional(),
  morador_email: z.string().email("Email inválido").optional().or(z.literal("")),
  morador_telefone: z.string().optional(),
  valor: z.string().min(1, "Informe o valor"),
  data_vencimento: z.string().min(1, "Informe a data de vencimento"),
  data_pagamento: z.string().optional(),
  status: z.string().optional(),
  nosso_numero: z.string().optional(),
  referencia: z.string().min(1, "Informe a referência"),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditarBoletoDialogProps {
  boleto: Boleto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarBoletoDialog({ boleto, open, onOpenChange }: EditarBoletoDialogProps) {
  const { data: condominios } = useCondominios();
  const { data: categorias } = useCategorias("receita");
  const updateBoleto = useUpdateBoleto();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      condominio_id: "",
      categoria_id: "",
      unidade: "",
      morador_nome: "",
      morador_email: "",
      morador_telefone: "",
      valor: "",
      data_vencimento: "",
      data_pagamento: "",
      status: "",
      nosso_numero: "",
      referencia: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (boleto && open) {
      form.reset({
        condominio_id: boleto.condominio_id,
        categoria_id: boleto.categoria_id || "",
        unidade: boleto.unidade,
        morador_nome: boleto.morador_nome || "",
        morador_email: boleto.morador_email || "",
        morador_telefone: boleto.morador_telefone || "",
        valor: boleto.valor.toString().replace(".", ","),
        data_vencimento: boleto.data_vencimento,
        data_pagamento: boleto.data_pagamento || "",
        status: boleto.status,
        nosso_numero: boleto.nosso_numero || "",
        referencia: boleto.referencia,
        observacoes: boleto.observacoes || "",
      });
    }
  }, [boleto, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!boleto) return;

    const valor = parseFloat(data.valor.replace(",", "."));

    await updateBoleto.mutateAsync({
      id: boleto.id,
      condominio_id: data.condominio_id,
      categoria_id: data.categoria_id || undefined,
      unidade: data.unidade,
      morador_nome: data.morador_nome || undefined,
      morador_email: data.morador_email || undefined,
      morador_telefone: data.morador_telefone || undefined,
      valor,
      data_vencimento: data.data_vencimento,
      data_pagamento: data.data_pagamento || undefined,
      status: data.status || undefined,
      nosso_numero: data.nosso_numero || undefined,
      referencia: data.referencia,
      observacoes: data.observacoes || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Boleto</DialogTitle>
          <DialogDescription>
            Atualize as informações do boleto selecionado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="condominio_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condomínio *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {condominios?.filter(c => c.id).map((cond) => (
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
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)} 
                      value={field.value || "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhuma</SelectItem>
                        {categorias?.filter(c => c.id).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat.cor || "#666" }}
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

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade/Apartamento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apto 101, Bloco A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referência *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Janeiro/2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="morador_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Morador</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="morador_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="morador_telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
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

              <FormField
                control={form.control}
                name="data_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Pagamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atraso">Atraso</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nosso_numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nosso Número</FormLabel>
                  <FormControl>
                    <Input placeholder="Número do boleto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações adicionais..." {...field} />
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
              <Button type="submit" disabled={updateBoleto.isPending}>
                {updateBoleto.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
