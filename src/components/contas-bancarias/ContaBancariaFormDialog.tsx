import { useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, QrCode } from "lucide-react";
import { bancosBrasileiros } from "@/lib/bancosBrasileiros";
import { useCondominios } from "@/hooks/useCondominios";
import { supabase } from "@/integrations/supabase/client";
import { ContaBancaria, NovaContaBancariaData } from "@/hooks/useContasBancarias";
import { formatCnpj, formatCpf } from "@/lib/masks";

function detectTipoChavePix(chave: string): string {
  if (!chave) return "";
  const digits = chave.replace(/\D/g, "");
  if (/^\d{11}$/.test(digits) && !chave.includes("@")) return "cpf";
  if (/^\d{14}$/.test(digits)) return "cnpj";
  if (chave.includes("@")) return "email";
  if (/^\+?55\d{10,11}$/.test(chave.replace(/[\s\-()]/g, "")) && chave.replace(/\D/g, "").length <= 13) return "telefone";
  if (chave.length >= 32) return "aleatoria";
  return "";
}

const tipoPixLabel: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave Aleatória",
};

function ChavePixField({ form }: { form: UseFormReturn<any> }) {
  const chave = form.watch("chave_pix") || "";
  const tipoDetectado = detectTipoChavePix(chave);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    form.setValue("chave_pix", valor);
    form.setValue("tipo_chave_pix", detectTipoChavePix(valor));
  };

  return (
    <FormField
      control={form.control}
      name="chave_pix"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-1.5">
            <QrCode className="h-3.5 w-3.5" />
            Chave Pix (Opcional)
          </FormLabel>
          <div className="flex gap-2 items-center">
            <FormControl>
              <Input
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                value={field.value || ""}
                onChange={handleChange}
              />
            </FormControl>
            {tipoDetectado && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {tipoPixLabel[tipoDetectado] || tipoDetectado}
              </Badge>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const formSchema = z.object({
  vinculo_tipo: z.enum(["administradora", "condominio"]),
  administradora_id: z.string().optional(),
  condominio_id: z.string().optional(),
  nome_conta: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  banco_codigo: z.string().min(1, "Selecione um banco"),
  agencia: z.string().min(1, "Agência é obrigatória"),
  agencia_digito: z.string().optional(),
  conta: z.string().min(1, "Conta é obrigatória"),
  conta_digito: z.string().optional(),
  tipo_conta: z.enum(["corrente", "poupanca"]),
  titular_nome: z.string().min(3, "Nome do titular é obrigatório"),
  titular_documento: z.string().min(11, "Documento é obrigatório"),
  titular_tipo: z.enum(["PF", "PJ"]),
  convenio: z.string().optional(),
  carteira: z.string().optional(),
  variacao_carteira: z.string().optional(),
  codigo_cedente: z.string().optional(),
  nosso_numero_inicio: z.coerce.number().optional(),
  instrucoes_linha1: z.string().optional(),
  instrucoes_linha2: z.string().optional(),
  instrucoes_linha3: z.string().optional(),
  multa_percentual: z.coerce.number().min(0).max(100).optional(),
  juros_mensal: z.coerce.number().min(0).max(100).optional(),
  dias_protesto: z.coerce.number().min(0).optional(),
  ativa: z.boolean(),
  conta_padrao: z.boolean(),
  chave_pix: z.string().optional(),
  tipo_chave_pix: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ContaBancariaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contaParaEditar?: ContaBancaria | null;
  onSave: (data: NovaContaBancariaData) => Promise<boolean>;
  onUpdate?: (id: string, data: Partial<NovaContaBancariaData>) => Promise<boolean>;
  defaultCondominioId?: string;
}

interface Administradora {
  id: string;
  nome: string;
}

export function ContaBancariaFormDialog({
  open,
  onOpenChange,
  contaParaEditar,
  onSave,
  onUpdate,
  defaultCondominioId,
}: ContaBancariaFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [administradoras, setAdministradoras] = useState<Administradora[]>([]);
  const { data: condominios = [] } = useCondominios();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vinculo_tipo: "condominio",
      condominio_id: defaultCondominioId || "",
      nome_conta: "",
      banco_codigo: "",
      agencia: "",
      agencia_digito: "",
      conta: "",
      conta_digito: "",
      tipo_conta: "corrente",
      titular_nome: "",
      titular_documento: "",
      titular_tipo: "PJ",
      convenio: "",
      carteira: "",
      variacao_carteira: "",
      codigo_cedente: "",
      nosso_numero_inicio: 1,
      instrucoes_linha1: "",
      instrucoes_linha2: "",
      instrucoes_linha3: "",
      multa_percentual: 2,
      juros_mensal: 1,
      dias_protesto: undefined,
      ativa: true,
      conta_padrao: false,
      chave_pix: "",
      tipo_chave_pix: "",
    },
  });

  const vinculoTipo = form.watch("vinculo_tipo");
  const titularTipo = form.watch("titular_tipo");

  useEffect(() => {
    async function fetchAdministradoras() {
      const { data } = await supabase
        .from("administradoras")
        .select("id, nome")
        .order("nome");
      setAdministradoras(data || []);
    }
    fetchAdministradoras();
  }, []);

  useEffect(() => {
    if (contaParaEditar) {
      const banco = bancosBrasileiros.find(
        (b) => b.codigo === contaParaEditar.banco_codigo
      );
      form.reset({
        vinculo_tipo: contaParaEditar.administradora_id ? "administradora" : "condominio",
        administradora_id: contaParaEditar.administradora_id || undefined,
        condominio_id: contaParaEditar.condominio_id || undefined,
        nome_conta: contaParaEditar.nome_conta,
        banco_codigo: contaParaEditar.banco_codigo,
        agencia: contaParaEditar.agencia,
        agencia_digito: contaParaEditar.agencia_digito || "",
        conta: contaParaEditar.conta,
        conta_digito: contaParaEditar.conta_digito || "",
        tipo_conta: contaParaEditar.tipo_conta as "corrente" | "poupanca",
        titular_nome: contaParaEditar.titular_nome,
        titular_documento: contaParaEditar.titular_documento,
        titular_tipo: contaParaEditar.titular_tipo as "PF" | "PJ",
        convenio: contaParaEditar.convenio || "",
        carteira: contaParaEditar.carteira || "",
        variacao_carteira: contaParaEditar.variacao_carteira || "",
        codigo_cedente: contaParaEditar.codigo_cedente || "",
        nosso_numero_inicio: contaParaEditar.nosso_numero_inicio || 1,
        instrucoes_linha1: contaParaEditar.instrucoes_linha1 || "",
        instrucoes_linha2: contaParaEditar.instrucoes_linha2 || "",
        instrucoes_linha3: contaParaEditar.instrucoes_linha3 || "",
        multa_percentual: contaParaEditar.multa_percentual || 2,
        juros_mensal: contaParaEditar.juros_mensal || 1,
        dias_protesto: contaParaEditar.dias_protesto || undefined,
        ativa: contaParaEditar.ativa,
        conta_padrao: contaParaEditar.conta_padrao,
        chave_pix: contaParaEditar.chave_pix || "",
        tipo_chave_pix: contaParaEditar.tipo_chave_pix || "",
      });
    } else {
      form.reset({
        vinculo_tipo: "condominio",
        condominio_id: defaultCondominioId || "",
        nome_conta: "",
        banco_codigo: "",
        agencia: "",
        agencia_digito: "",
        conta: "",
        conta_digito: "",
        tipo_conta: "corrente",
        titular_nome: "",
        titular_documento: "",
        titular_tipo: "PJ",
        convenio: "",
        carteira: "",
        variacao_carteira: "",
        codigo_cedente: "",
        nosso_numero_inicio: 1,
        instrucoes_linha1: "",
        instrucoes_linha2: "",
        instrucoes_linha3: "",
        multa_percentual: 2,
        juros_mensal: 1,
        dias_protesto: undefined,
        ativa: true,
        conta_padrao: false,
        chave_pix: "",
        tipo_chave_pix: "",
      });
    }
  }, [contaParaEditar, defaultCondominioId, form]);

  const onSubmit = async (values: FormData) => {
    setSaving(true);

    const banco = bancosBrasileiros.find((b) => b.codigo === values.banco_codigo);

    const payload: NovaContaBancariaData = {
      administradora_id:
        values.vinculo_tipo === "administradora" ? values.administradora_id : null,
      condominio_id:
        values.vinculo_tipo === "condominio" ? values.condominio_id : null,
      nome_conta: values.nome_conta,
      banco_codigo: values.banco_codigo,
      banco_nome: banco?.nome || values.banco_codigo,
      agencia: values.agencia,
      agencia_digito: values.agencia_digito || null,
      conta: values.conta,
      conta_digito: values.conta_digito || null,
      tipo_conta: values.tipo_conta,
      titular_nome: values.titular_nome,
      titular_documento: values.titular_documento,
      titular_tipo: values.titular_tipo,
      convenio: values.convenio || null,
      carteira: values.carteira || null,
      variacao_carteira: values.variacao_carteira || null,
      codigo_cedente: values.codigo_cedente || null,
      nosso_numero_inicio: values.nosso_numero_inicio || null,
      instrucoes_linha1: values.instrucoes_linha1 || null,
      instrucoes_linha2: values.instrucoes_linha2 || null,
      instrucoes_linha3: values.instrucoes_linha3 || null,
      multa_percentual: values.multa_percentual || null,
      juros_mensal: values.juros_mensal || null,
      dias_protesto: values.dias_protesto || null,
      ativa: values.ativa,
      conta_padrao: values.conta_padrao,
      chave_pix: values.chave_pix || null,
      tipo_chave_pix: values.tipo_chave_pix || null,
    };

    let success = false;

    if (contaParaEditar && onUpdate) {
      success = await onUpdate(contaParaEditar.id, payload);
    } else {
      success = await onSave(payload);
    }

    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {contaParaEditar ? "Editar Conta Bancária" : "Nova Conta Bancária"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dados">Dados Bancários</TabsTrigger>
                  <TabsTrigger value="boleto">Registro de Boleto</TabsTrigger>
                  <TabsTrigger value="instrucoes">Instruções</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4 mt-4">
                  {/* Vinculação */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vinculo_tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Vinculação</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="condominio">
                                Condomínio Específico
                              </SelectItem>
                              <SelectItem value="administradora">
                                Administradora (Compartilhada)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {vinculoTipo === "condominio" ? (
                      <FormField
                        control={form.control}
                        name="condominio_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condomínio</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
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
                    ) : (
                      <FormField
                        control={form.control}
                        name="administradora_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Administradora</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {administradoras.map((a) => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="nome_conta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Conta</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Conta Principal"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Banco e Tipo */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="banco_codigo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o banco" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bancosBrasileiros.map((banco) => (
                                <SelectItem
                                  key={banco.codigo}
                                  value={banco.codigo}
                                >
                                  {banco.codigo} - {banco.nome}
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
                      name="tipo_conta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Conta</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="corrente">
                                Conta Corrente
                              </SelectItem>
                              <SelectItem value="poupanca">Poupança</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Agência e Conta */}
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="agencia"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Agência</FormLabel>
                          <FormControl>
                            <Input placeholder="0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agencia_digito"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dígito</FormLabel>
                          <FormControl>
                            <Input placeholder="0" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div />

                    <FormField
                      control={form.control}
                      name="conta"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Conta</FormLabel>
                          <FormControl>
                            <Input placeholder="00000000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="conta_digito"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dígito</FormLabel>
                          <FormControl>
                            <Input placeholder="0" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Titular */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="titular_nome"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Nome do Titular</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="titular_tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                              <SelectItem value="PF">Pessoa Física</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="titular_documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {titularTipo === "PJ" ? "CNPJ" : "CPF"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              titularTipo === "PJ"
                                ? "00.000.000/0000-00"
                                : "000.000.000-00"
                            }
                            value={field.value}
                            onChange={(e) => {
                              const masked =
                                titularTipo === "PJ"
                                  ? formatCnpj(e.target.value)
                                  : formatCpf(e.target.value);
                              field.onChange(masked);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Chave Pix */}
                  <ChavePixField form={form} />

                  {/* Status */}
                  <div className="flex items-center gap-6 pt-2">
                    <FormField
                      control={form.control}
                      name="ativa"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Conta Ativa</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="conta_padrao"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Conta Padrão</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="boleto" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Configurações para registro e emissão de boletos bancários
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="convenio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Convênio</FormLabel>
                          <FormControl>
                            <Input placeholder="Número do convênio" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="carteira"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Carteira</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 17, 18, 109" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="variacao_carteira"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variação da Carteira</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="codigo_cedente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código do Cedente</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nosso_numero_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nosso Número (Início)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="instrucoes" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Instruções e configurações de multa/juros para boletos
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="multa_percentual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Multa (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="2.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="juros_mensal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Juros Mensal (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="1.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dias_protesto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dias p/ Protesto</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="instrucoes_linha1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrução Linha 1</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Não receber após o vencimento"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instrucoes_linha2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrução Linha 2</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Multa de 2% após vencimento"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instrucoes_linha3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrução Linha 3</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Juros de 1% ao mês"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {contaParaEditar ? "Salvar Alterações" : "Criar Conta"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
