import { useEffect } from "react";
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
import { useCreateAtendimento } from "@/hooks/useAtendimentos";
import { useAuth } from "@/hooks/useAuth";

const atendimentoSchema = z.object({
  // Dados do Atendimento
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  operador_nome: z.string().min(1, "Operador é obrigatório"),
  canal: z.string().min(1, "Canal é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
  motivo: z.string().min(1, "Motivo é obrigatório"),
  observacoes: z.string().optional(),

  // Dados do Cliente
  cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
  cliente_telefone: z.string().min(1, "Telefone é obrigatório"),
  cliente_email: z.string().email("E-mail inválido").optional().or(z.literal("")),

  // Dados do Condomínio
  condominio_nome: z.string().min(1, "Nome do condomínio é obrigatório"),
  condominio_endereco: z.string().optional(),
  condominio_cidade: z.string().optional(),
  condominio_uf: z.string().optional(),
  condominio_cnpj: z.string().optional(),
  condominio_tipo_imovel: z.string().optional(),

  // Síndico
  sindico_nome: z.string().optional(),
  sindico_telefone: z.string().optional(),
  sindico_email: z.string().optional(),
  tem_sindico: z.string().optional(),

  // Administradora
  administradora_nome: z.string().optional(),
  administradora_telefone: z.string().optional(),
  tem_administradora: z.string().optional(),

  // Infraestrutura
  tem_seguranca: z.string().optional(),
  tem_porteiro: z.string().optional(),
  tem_monitoramento: z.string().optional(),
  quantidade_unidades: z.string().optional(),
  quantidade_blocos: z.string().optional(),
});

type AtendimentoFormData = z.infer<typeof atendimentoSchema>;

interface NovoAtendimentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  "Com Contrato",
  "Finalizado sem contrato",
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

const tiposImovel = [
  "Residencial",
  "Comercial",
  "Misto",
  "Industrial",
];

export function NovoAtendimentoForm({ open, onOpenChange }: NovoAtendimentoFormProps) {
  const createAtendimento = useCreateAtendimento();
  const { user } = useAuth();

  // Get user name from metadata or email
  const userName = user?.user_metadata?.nome || user?.email?.split("@")[0] || "";

  const form = useForm<AtendimentoFormData>({
    resolver: zodResolver(atendimentoSchema),
    defaultValues: {
      data: new Date().toISOString().split("T")[0],
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      operador_nome: userName,
      canal: "",
      status: "Em andamento",
      motivo: "",
      observacoes: "",
      cliente_nome: "",
      cliente_telefone: "",
      cliente_email: "",
      condominio_nome: "",
      condominio_endereco: "",
      condominio_cidade: "",
      condominio_uf: "",
      condominio_cnpj: "",
      condominio_tipo_imovel: "",
      sindico_nome: "",
      sindico_telefone: "",
      sindico_email: "",
      tem_sindico: "",
      administradora_nome: "",
      administradora_telefone: "",
      tem_administradora: "",
      tem_seguranca: "",
      tem_porteiro: "",
      tem_monitoramento: "",
      quantidade_unidades: "",
      quantidade_blocos: "",
    },
  });

  // Update operator name when user data loads
  useEffect(() => {
    if (userName && !form.getValues("operador_nome")) {
      form.setValue("operador_nome", userName);
    }
  }, [userName, form]);


  const onSubmit = async (data: AtendimentoFormData) => {
    try {
      await createAtendimento.mutateAsync({
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
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            Novo Atendimento
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <FormField
                    control={form.control}
                    name="condominio_cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="00.000.000/0000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="condominio_endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="condominio_cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condominio_uf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condominio_tipo_imovel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Imóvel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tiposImovel.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantidade_unidades"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Unidades</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidade_blocos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Blocos</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Seção: Síndico */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Síndico
                </h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="tem_sindico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tem Síndico?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sim">Sim</SelectItem>
                            <SelectItem value="Não">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sindico_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Síndico</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sindico_telefone"
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

                  <FormField
                    control={form.control}
                    name="sindico_email"
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

              {/* Seção: Administradora */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Administradora
                </h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="tem_administradora"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tem Administradora?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sim">Sim</SelectItem>
                            <SelectItem value="Não">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="administradora_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Administradora</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="administradora_telefone"
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
              </div>

              {/* Seção: Infraestrutura */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Infraestrutura
                </h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="tem_seguranca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tem Segurança?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sim">Sim</SelectItem>
                            <SelectItem value="Não">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tem_porteiro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tem Porteiro?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sim 24h">Sim 24h</SelectItem>
                            <SelectItem value="Sim 8h">Sim 8h</SelectItem>
                            <SelectItem value="Não">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tem_monitoramento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monitoramento por Câmeras?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sim">Sim</SelectItem>
                            <SelectItem value="Não">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Botões */}
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
                  disabled={createAtendimento.isPending}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {createAtendimento.isPending ? "Salvando..." : "Salvar Atendimento"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
