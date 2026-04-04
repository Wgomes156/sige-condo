import { useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCondominios } from "@/hooks/useCondominios";
import { useCategorias } from "@/hooks/useFinanceiro";
import { useCreateBoleto } from "@/hooks/useBoletos";
import { useUnidades } from "@/hooks/useUnidades";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  condominio_id: z.string().min(1, "Selecione um condomínio"),
  categoria_id: z.string().optional(),
  unidade_id: z.string().min(1, "Selecione uma unidade"),
  morador_nome: z.string().optional(),
  morador_email: z.string().email("Email inválido").optional().or(z.literal("")),
  morador_telefone: z.string().optional(),
  valor: z.string().min(1, "Informe o valor"),
  data_vencimento: z.string().min(1, "Informe a data de vencimento"),
  referencia: z.string().min(1, "Informe a referência"),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NovoBoletoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoBoletoForm({ open, onOpenChange }: NovoBoletoFormProps) {
  const isMobile = useIsMobile();
  const { data: condominios } = useCondominios();
  const { data: categorias } = useCategorias("receita");
  const createBoleto = useCreateBoleto();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      condominio_id: "",
      categoria_id: "",
      unidade_id: "",
      morador_nome: "",
      morador_email: "",
      morador_telefone: "",
      valor: "",
      data_vencimento: "",
      referencia: "",
      observacoes: "",
    },
  });

  // Watch condominio_id para filtrar unidades
  const condominioId = useWatch({ control: form.control, name: "condominio_id" });
  const { data: unidades } = useUnidades(condominioId || undefined);

  const onSubmit = async (data: FormData) => {
    const valor = parseFloat(data.valor.replace(",", "."));
    
    // Encontrar a unidade selecionada para pegar o código
    const unidadeSelecionada = unidades?.find(u => u.id === data.unidade_id);
    const unidadeCodigo = unidadeSelecionada 
      ? `${unidadeSelecionada.bloco ? unidadeSelecionada.bloco + ' - ' : ''}${unidadeSelecionada.codigo}`
      : "";

    await createBoleto.mutateAsync({
      condominio_id: data.condominio_id,
      categoria_id: data.categoria_id || undefined,
      unidade_id: data.unidade_id,
      unidade: unidadeCodigo,
      morador_nome: data.morador_nome || undefined,
      morador_email: data.morador_email || undefined,
      morador_telefone: data.morador_telefone || undefined,
      valor,
      data_vencimento: data.data_vencimento,
      nosso_numero: null, // Auto-gerado pelo banco
      referencia: data.referencia,
      observacoes: data.observacoes || undefined,
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[95vh] overflow-y-auto p-0",
        isMobile ? "max-w-[95vw] rounded-lg" : "max-w-2xl"
      )}>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Novo Boleto</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
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
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unidade_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!condominioId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={condominioId ? "Selecione a unidade" : "Selecione o condomínio primeiro"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unidades?.map((unidade) => (
                          <SelectItem key={unidade.id} value={unidade.id}>
                            <div className="flex items-center gap-2">
                              {unidade.bloco && <Badge variant="outline" className="text-xs">{unidade.bloco}</Badge>}
                              <span>{unidade.codigo}</span>
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

            <div className="grid gap-4 sm:grid-cols-3">
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

            <div className="grid gap-4 sm:grid-cols-2">
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

            <p className="text-sm text-muted-foreground">
              💡 O <strong>Nosso Número</strong> será gerado automaticamente pelo sistema.
            </p>

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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto h-11 sm:h-10"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createBoleto.isPending}
                className="w-full sm:w-auto h-11 sm:h-10 font-bold"
              >
                {createBoleto.isPending ? "Salvando..." : "Cadastrar Boleto"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
