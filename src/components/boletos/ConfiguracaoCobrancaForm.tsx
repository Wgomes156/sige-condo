import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCondominios } from "@/hooks/useCondominios";
import { useCategorias } from "@/hooks/useFinanceiro";
import {
  useCreateConfiguracaoCobranca,
  useUpdateConfiguracaoCobranca,
  ConfiguracaoCobranca,
} from "@/hooks/useConfiguracaoCobranca";
import { useEffect } from "react";

const formSchema = z.object({
  condominio_id: z.string().min(1, "Selecione um condomínio"),
  valor_padrao: z.string().min(1, "Informe o valor"),
  dia_vencimento: z.string().min(1, "Informe o dia de vencimento"),
  categoria_id: z.string().optional(),
  descricao_padrao: z.string().optional(),
  ativa: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface ConfiguracaoCobrancaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuracao?: ConfiguracaoCobranca | null;
}

export function ConfiguracaoCobrancaForm({
  open,
  onOpenChange,
  configuracao,
}: ConfiguracaoCobrancaFormProps) {
  const { data: condominios } = useCondominios();
  const { data: categorias } = useCategorias("receita");
  const createConfig = useCreateConfiguracaoCobranca();
  const updateConfig = useUpdateConfiguracaoCobranca();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      condominio_id: "",
      valor_padrao: "",
      dia_vencimento: "10",
      categoria_id: "",
      descricao_padrao: "Taxa Condominial",
      ativa: true,
    },
  });

  useEffect(() => {
    if (configuracao) {
      form.reset({
        condominio_id: configuracao.condominio_id,
        valor_padrao: configuracao.valor_padrao.toString().replace(".", ","),
        dia_vencimento: configuracao.dia_vencimento.toString(),
        categoria_id: configuracao.categoria_id || "",
        descricao_padrao: configuracao.descricao_padrao || "Taxa Condominial",
        ativa: configuracao.ativa,
      });
    } else {
      form.reset({
        condominio_id: "",
        valor_padrao: "",
        dia_vencimento: "10",
        categoria_id: "",
        descricao_padrao: "Taxa Condominial",
        ativa: true,
      });
    }
  }, [configuracao, form]);

  const onSubmit = async (data: FormData) => {
    const valorPadrao = parseFloat(data.valor_padrao.replace(",", "."));
    const diaVencimento = parseInt(data.dia_vencimento);

    if (configuracao) {
      await updateConfig.mutateAsync({
        id: configuracao.id,
        valor_padrao: valorPadrao,
        dia_vencimento: diaVencimento,
        categoria_id: data.categoria_id || undefined,
        descricao_padrao: data.descricao_padrao || "Taxa Condominial",
        ativa: data.ativa,
      });
    } else {
      await createConfig.mutateAsync({
        condominio_id: data.condominio_id,
        valor_padrao: valorPadrao,
        dia_vencimento: diaVencimento,
        categoria_id: data.categoria_id || undefined,
        descricao_padrao: data.descricao_padrao || "Taxa Condominial",
        ativa: data.ativa,
      });
    }

    form.reset();
    onOpenChange(false);
  };

  const isEditing = !!configuracao;
  const isPending = createConfig.isPending || updateConfig.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Configuração" : "Nova Configuração de Cobrança"}
          </DialogTitle>
          <DialogDescription>
            Configure a geração automática de boletos para um condomínio
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="condominio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condomínio *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o condomínio" />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="valor_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Taxa (R$) *</FormLabel>
                    <FormControl>
                      <Input placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dia_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Vencimento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Dia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((dia) => (
                          <SelectItem key={dia} value={dia.toString()}>
                            Dia {dia}
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
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias?.map((cat) => (
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

            <FormField
              control={form.control}
              name="descricao_padrao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Padrão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Taxa Condominial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativa"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cobrança Ativa</FormLabel>
                    <FormDescription>
                      Desative para pausar a geração automática de boletos
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar Configuração"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
