import { useState } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Download,
  Mail,
  MessageCircle,
  Building2,
  User,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useUnidades } from "@/hooks/useUnidades";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { useCreateBoleto } from "@/hooks/useBoletos";
import { supabase } from "@/integrations/supabase/client";
import {
  validarPreRequisitos,
  construirDadosBoleto,
  type BoletoCalculado,
} from "@/services/boletoService";
import { BoletoTemplate, gerarBoletoBancarioPDF } from "@/components/boletos/BoletoTemplate";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// ── Step schemas ──────────────────────────────────────────────────────────────

const step1Schema = z.object({
  condominio_id: z.string().min(1, "Selecione um condomínio"),
  unidade_id: z.string().min(1, "Selecione uma unidade"),
});

const step2Schema = z.object({
  referencia: z.string().min(1, "Informe a descrição / referência"),
  valor: z
    .string()
    .min(1, "Informe o valor")
    .refine(
      (v) => !isNaN(parseFloat(v.replace(",", "."))) && parseFloat(v.replace(",", ".")) > 0,
      { message: "Valor deve ser maior que zero" }
    ),
  data_vencimento: z
    .string()
    .min(1, "Informe a data de vencimento")
    .refine((v) => v >= new Date().toISOString().split("T")[0], {
      message: "A data de vencimento não pode ser no passado",
    }),
  multa_percentual: z.string().optional(),
  juros_dia: z.string().optional(),
  desconto_valor: z.string().optional(),
  desconto_ate: z.string().optional(),
  instrucoes: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface EmissaoBoletoWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { label: "Condômino", icon: User },
  { label: "Dados do Boleto", icon: DollarSign },
  { label: "Pré-visualização", icon: ClipboardList },
  { label: "Emitido", icon: CheckCircle2 },
];

export function EmissaoBoletoWizard({ open, onOpenChange }: EmissaoBoletoWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [boletoPreview, setBoletoPreview] = useState<BoletoCalculado | null>(null);
  const [boletoEmitido, setBoletoEmitido] = useState<any>(null);
  const [linhaCopied, setLinhaCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [erroInsert, setErroInsert] = useState<string | null>(null);

  const { data: condominios } = useCondominios();
  const { contas } = useContasBancarias();
  const createBoleto = useCreateBoleto();

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { condominio_id: "", unidade_id: "" },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      referencia: "",
      valor: "",
      data_vencimento: "",
      multa_percentual: "2",
      juros_dia: "0.033",
      desconto_valor: "",
      desconto_ate: "",
      instrucoes: "",
    },
  });

  const condominioId = form1.watch("condominio_id");
  const { data: unidades } = useUnidades(condominioId || undefined);

  const contaCondominio =
    contas.find((c) => c.condominio_id === condominioId && c.conta_padrao) ||
    contas.find((c) => c.condominio_id === condominioId && c.ativa) ||
    contas.find((c) => c.condominio_id === condominioId);

  const validacao = validarPreRequisitos(contaCondominio);
  const condominioSelecionado = condominios?.find((c) => c.id === condominioId);
  const unidadeSelecionada = unidades?.find((u) => u.id === form1.watch("unidade_id"));

  const handleStep1Submit = (data: Step1Data) => {
    if (!validacao.valido) {
      toast.error("Complete os dados bancários antes de emitir boletos.");
      return;
    }
    setStep1Data(data);
    setCurrentStep(1);
  };

  // Resolve nosso_numero: max(conta_seq, db_max+1, timestamp_based)
  const resolverNossoNumero = async (): Promise<string> => {
    // Timestamp seed — changes every second, virtually unique
    const tsSeed = Math.floor(Date.now() / 1000) % 90000000 + 10000000;
    let candidato = tsSeed;

    // 1. Conta's own sequence
    try {
      const { data: contaData } = await supabase
        .from("contas_bancarias")
        .select("nosso_numero_atual, nosso_numero_inicio")
        .eq("id", contaCondominio!.id)
        .single();
      if (contaData) {
        const seq = contaData.nosso_numero_atual ?? (contaData.nosso_numero_inicio ?? 1);
        candidato = Math.max(candidato, seq);
      }
    } catch { /* ignore */ }

    // 2. Max nosso_numero currently in boletos table (pull all, parse client-side)
    try {
      const { data: rows } = await supabase
        .from("boletos")
        .select("nosso_numero")
        .not("nosso_numero", "is", null);
      if (rows && rows.length > 0) {
        const nums = rows
          .map((r: any) => parseInt(r.nosso_numero, 10))
          .filter((n: number) => !isNaN(n));
        if (nums.length > 0) {
          candidato = Math.max(candidato, Math.max(...nums) + 1);
        }
      }
    } catch { /* ignore */ }

    return candidato.toString().padStart(8, "0");
  };

  // Build the BoletoCalculado preview before showing step 3
  const handleStep2Submit = async (data: Step2Data) => {
    if (!step1Data || !contaCondominio) return;

    const valor = parseFloat(data.valor.replace(",", "."));
    const multa = data.multa_percentual ? parseFloat(data.multa_percentual) : 2;
    const juros = data.juros_dia ? parseFloat(data.juros_dia) : 0.033;

    const nossoNumero = await resolverNossoNumero();

    const unidade = unidadeSelecionada
      ? `${unidadeSelecionada.bloco ? unidadeSelecionada.bloco + " - " : ""}${unidadeSelecionada.codigo}`
      : "";

    const instrucoesList = [
      `Multa de ${multa}% após o vencimento`,
      `Juros de ${juros}% ao dia`,
      ...(data.instrucoes ? [data.instrucoes] : []),
      "Não receber após 30 dias do vencimento",
    ];

    const calculado = construirDadosBoleto(contaCondominio, {
      nossoNumero,
      valorCentavos: Math.round(valor * 100),
      dataVencimento: new Date(data.data_vencimento + "T12:00:00"),
      dataEmissao: new Date(),
      descricao: data.referencia,
      instrucoes: instrucoesList,
      multa,
      juros,
      descontoValor: data.desconto_valor
        ? parseFloat(data.desconto_valor.replace(",", "."))
        : undefined,
      descontoAte: data.desconto_ate
        ? new Date(data.desconto_ate + "T12:00:00")
        : undefined,
      sacadoNome: (unidadeSelecionada as any)?.morador_nome || "Condômino",
      sacadoCpf: (unidadeSelecionada as any)?.morador_cpf || undefined,
      sacadoUnidade: unidade,
      condominioNome: condominioSelecionado?.nome,
      condominioId: step1Data.condominio_id,
    });

    setBoletoPreview(calculado);
    setStep2Data(data);
    setCurrentStep(2);
  };

  const handleConfirmar = async () => {
    if (!step1Data || !step2Data || !boletoPreview || !contaCondominio) return;
    setIsGenerating(true);
    setErroInsert(null);

    const unidade = unidadeSelecionada
      ? `${unidadeSelecionada.bloco ? unidadeSelecionada.bloco + " - " : ""}${unidadeSelecionada.codigo}`
      : "";

    const valor = parseFloat(step2Data.valor.replace(",", "."));
    const multa = step2Data.multa_percentual ? parseFloat(step2Data.multa_percentual) : 2;
    const juros = step2Data.juros_dia ? parseFloat(step2Data.juros_dia) : 0.033;

    try {
      const boleto = await createBoleto.mutateAsync({
        condominio_id: step1Data.condominio_id,
        unidade_id: step1Data.unidade_id,
        conta_bancaria_id: contaCondominio.id,
        unidade,
        morador_nome: (unidadeSelecionada as any)?.morador_nome || undefined,
        morador_email: (unidadeSelecionada as any)?.morador_email || undefined,
        morador_telefone: (unidadeSelecionada as any)?.morador_telefone || undefined,
        valor,
        data_vencimento: step2Data.data_vencimento,
        referencia: step2Data.referencia,
        observacoes: `Cód.Barras: ${boletoPreview.codigoBarras} | Linha: ${boletoPreview.linhaDigitavel}`,
        multa_percentual: multa,
        juros_dia: juros,
        desconto_valor: step2Data.desconto_valor
          ? parseFloat(step2Data.desconto_valor.replace(",", "."))
          : undefined,
        desconto_ate: step2Data.desconto_ate || undefined,
        instrucoes: step2Data.instrucoes || undefined,
        nosso_numero: boletoPreview.nossoNumero,
      });

      // Only increment nosso_numero_atual after successful insert
      const proximoNum = parseInt(boletoPreview.nossoNumero, 10);
      await supabase
        .from("contas_bancarias")
        .update({ nosso_numero_atual: proximoNum + 1 })
        .eq("id", contaCondominio.id);

      setBoletoEmitido({
        ...boleto,
        condominios: { nome: condominioSelecionado?.nome || "" },
        boletoCalculado: boletoPreview,
      });
      setCurrentStep(3);
    } catch (err: any) {
      const msg = err?.message || err?.details || JSON.stringify(err) || "Erro desconhecido";
      console.error("Erro ao confirmar boleto:", { code: err?.code, message: err?.message, details: err?.details, hint: err?.hint });
      setErroInsert(`[${err?.code || "ERR"}] ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBaixarPDF = async () => {
    if (!boletoEmitido?.boletoCalculado) return;
    try {
      await gerarBoletoBancarioPDF(boletoEmitido.boletoCalculado);
    } catch {
      toast.error("Erro ao gerar PDF do boleto.");
    }
  };

  const handleCopiarLinha = () => {
    const linha = boletoPreview?.linhaDigitavel || boletoEmitido?.boletoCalculado?.linhaDigitavel || "";
    if (!linha) return;
    navigator.clipboard.writeText(linha).then(() => {
      setLinhaCopied(true);
      setTimeout(() => setLinhaCopied(false), 2000);
    });
  };

  const handleFechar = () => {
    setCurrentStep(0);
    setStep1Data(null);
    setStep2Data(null);
    setBoletoPreview(null);
    setBoletoEmitido(null);
    setErroInsert(null);
    form1.reset();
    form2.reset();
    onOpenChange(false);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <Dialog open={open} onOpenChange={handleFechar}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Emitir Boleto</DialogTitle>
          <DialogDescription className="sr-only">Wizard de emissão de boleto bancário</DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center px-6 py-4 gap-0 border-b bg-muted/30">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <div key={idx} className="flex items-center flex-1 min-w-0">
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-medium shrink-0",
                  isActive && "text-primary",
                  isDone && "text-green-600",
                  !isActive && !isDone && "text-muted-foreground"
                )}>
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2",
                    isActive && "border-primary bg-primary text-white",
                    isDone && "border-green-600 bg-green-600 text-white",
                    !isActive && !isDone && "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className="hidden sm:block">{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6">
          {/* ── STEP 1: Selecionar Condômino ── */}
          {currentStep === 0 && (
            <Form {...form1}>
              <form onSubmit={form1.handleSubmit(handleStep1Submit)} className="space-y-5">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Selecionar Condômino
                </h2>

                <div className="space-y-4">
                  <FormField
                    control={form1.control}
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
                            {condominios?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Validação bancária inline */}
                  {condominioId && !validacao.valido && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <p className="font-semibold">Dados bancários incompletos:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {validacao.erros.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 gap-2"
                          onClick={() => {
                            handleFechar();
                            navigate("/contas-bancarias");
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ir para Dados Bancários
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Conta bancária vinculada */}
                  {condominioId && validacao.valido && contaCondominio && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 text-sm space-y-1">
                      <p className="font-medium text-green-800 dark:text-green-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Pagamentos creditados em:
                      </p>
                      <p className="text-green-700 dark:text-green-400">
                        <strong>{contaCondominio.banco_codigo} — {contaCondominio.banco_nome}</strong>
                        {" | "}Ag {contaCondominio.agencia}{contaCondominio.agencia_digito ? `-${contaCondominio.agencia_digito}` : ""}
                        {" | "}Cc {contaCondominio.conta}{contaCondominio.conta_digito ? `-${contaCondominio.conta_digito}` : ""}
                      </p>
                      <p className="text-green-600 dark:text-green-500 text-xs">{contaCondominio.titular_nome}</p>
                    </div>
                  )}

                  <FormField
                    control={form1.control}
                    name="unidade_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade / Condômino *</FormLabel>
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
                            {unidades?.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                <div className="flex items-center gap-2">
                                  {u.bloco && <Badge variant="outline" className="text-xs">{u.bloco}</Badge>}
                                  <span>{u.codigo}</span>
                                  {(u as any).morador_nome && (
                                    <span className="text-muted-foreground text-xs">– {(u as any).morador_nome}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {unidadeSelecionada && (
                    <div className="rounded-lg bg-muted/50 border p-3 text-sm space-y-1">
                      <p className="font-medium">
                        Unidade: {unidadeSelecionada.bloco ? `${unidadeSelecionada.bloco} - ` : ""}{unidadeSelecionada.codigo}
                      </p>
                      {(unidadeSelecionada as any).morador_nome && (
                        <p className="text-muted-foreground">Morador: {(unidadeSelecionada as any).morador_nome}</p>
                      )}
                      {(unidadeSelecionada as any).morador_email && (
                        <p className="text-muted-foreground">{(unidadeSelecionada as any).morador_email}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={!validacao.valido} className="gap-2">
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* ── STEP 2: Dados do Boleto ── */}
          {currentStep === 1 && (
            <Form {...form2}>
              <form onSubmit={form2.handleSubmit(handleStep2Submit)} className="space-y-5">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Dados do Boleto
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form2.control}
                    name="referencia"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Descrição / Referência *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Taxa condominial - Janeiro/2026" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form2.control}
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
                    control={form2.control}
                    name="data_vencimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Encargos por Atraso</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form2.control}
                    name="multa_percentual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multa por Atraso (%)</FormLabel>
                        <FormControl><Input placeholder="2" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form2.control}
                    name="juros_dia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Juros ao Dia (%)</FormLabel>
                        <FormControl><Input placeholder="0,033" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Desconto (Opcional)</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form2.control}
                    name="desconto_valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Desconto (R$)</FormLabel>
                        <FormControl><Input placeholder="0,00" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form2.control}
                    name="desconto_ate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Válido até</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form2.control}
                  name="instrucoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instruções adicionais ao Sacado</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Não receber após o vencimento."
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(0)} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />Voltar
                  </Button>
                  <Button type="submit" className="gap-2">
                    Pré-visualizar
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* ── STEP 3: Pré-visualização do Boleto ── */}
          {currentStep === 2 && boletoPreview && contaCondominio && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Pré-visualização do Boleto
              </h2>

              {/* Destaque conta bancária */}
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Os pagamentos serão creditados na conta:
                </p>
                <p className="text-blue-800 dark:text-blue-300">
                  Banco <strong>{contaCondominio.banco_codigo} — {contaCondominio.banco_nome}</strong>
                  {" | "}Agência{" "}
                  <strong>{contaCondominio.agencia}{contaCondominio.agencia_digito ? `-${contaCondominio.agencia_digito}` : ""}</strong>
                  {" | "}Conta{" "}
                  <strong>{contaCondominio.conta}{contaCondominio.conta_digito ? `-${contaCondominio.conta_digito}` : ""}</strong>
                </p>
                <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">{contaCondominio.titular_nome}</p>
              </div>

              {/* Template visual */}
              <div className="overflow-x-auto rounded border">
                <BoletoTemplate dados={boletoPreview} />
              </div>

              {erroInsert && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-1">Erro ao gerar boleto:</p>
                    <p className="text-xs font-mono break-all">{erroInsert}</p>
                    <p className="text-xs mt-1 text-muted-foreground">Copie esta mensagem e informe ao suporte se o erro persistir.</p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />Voltar e Editar
                </Button>
                <Button
                  onClick={handleConfirmar}
                  disabled={isGenerating || createBoleto.isPending}
                  className="gap-2 font-bold"
                >
                  {isGenerating || createBoleto.isPending ? "Gerando..." : "Confirmar e Gerar Boleto"}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Sucesso ── */}
          {currentStep === 3 && boletoEmitido && (
            <div className="space-y-5 text-center">
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-9 w-9 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Boleto Emitido com Sucesso!</h2>
                  <p className="text-sm text-muted-foreground">
                    {condominioSelecionado?.nome}{" — "}
                    {unidadeSelecionada?.bloco ? `${unidadeSelecionada.bloco} - ` : ""}
                    {unidadeSelecionada?.codigo}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4 text-left space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(boletoEmitido.valor)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p className="font-medium">
                      {new Date(boletoEmitido.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {boletoEmitido.nosso_numero && (
                  <div>
                    <p className="text-xs text-muted-foreground">Nosso Número</p>
                    <p className="font-mono font-medium">{boletoEmitido.nosso_numero}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Linha Digitável</p>
                  <div className="flex gap-2 items-center">
                    <p className="font-mono text-xs bg-muted rounded px-2 py-1 flex-1 break-all">
                      {boletoEmitido.boletoCalculado?.linhaDigitavel || "—"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopiarLinha}
                      className="shrink-0 gap-1 text-xs"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {linhaCopied ? "Copiado!" : "Copiar"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button variant="outline" onClick={handleBaixarPDF} className="gap-2 w-full">
                  <Download className="h-4 w-4" />Baixar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const email = (unidadeSelecionada as any)?.morador_email;
                    if (email) toast.info(`Envio de e-mail para ${email} disponível na tela de boletos.`);
                    else toast.warning("Nenhum e-mail cadastrado para esta unidade.");
                  }}
                  className="gap-2 w-full"
                >
                  <Mail className="h-4 w-4" />Enviar E-mail
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Envio por WhatsApp será implementado em breve.")}
                  className="gap-2 w-full"
                >
                  <MessageCircle className="h-4 w-4" />WhatsApp
                </Button>
              </div>

              <Button className="w-full" onClick={handleFechar}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
