import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  User,
  Package,
  DollarSign,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
} from "lucide-react";
import { usePropostas } from "@/hooks/usePropostas";
import { useServicos } from "@/hooks/useServicos";
import { Database } from "@/integrations/supabase/types";

// Função para extrair valor numérico de strings como "R$ 400 a R$ 1.000/evento" ou "R$ 1.500,00"
const parseValorServico = (valorStr: string | null | undefined): number => {
  if (!valorStr) return 0;
  
  // Remove tudo exceto números, vírgulas, pontos e espaços
  const limpo = valorStr.replace(/[^\d,.]/g, ' ').trim();
  
  // Pega a primeira sequência de números (valor mínimo)
  const match = limpo.match(/(\d+[.,]?\d*)/);
  if (!match) return 0;
  
  // Converte formato brasileiro (1.000,00) para número
  let valor = match[1];
  
  // Se tem formato brasileiro (ponto como milhar, vírgula como decimal)
  if (valor.includes(',')) {
    valor = valor.replace(/\./g, '').replace(',', '.');
  }
  
  return parseFloat(valor) || 0;
};

type PropostaInsert = Database["public"]["Tables"]["propostas"]["Insert"];

const propostaSchema = z.object({
  // Dados do Condomínio
  condominio_nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  condominio_tipo: z.enum(["residencial", "comercial", "misto"]),
  condominio_endereco: z.string().optional(),
  condominio_cidade: z.string().optional(),
  condominio_estado: z.string().max(2).optional(),
  condominio_cep: z.string().optional(),
  condominio_qtd_unidades: z.coerce.number().min(1, "Mínimo 1 unidade"),
  condominio_qtd_blocos: z.coerce.number().optional(),
  condominio_qtd_funcionarios: z.coerce.number().optional(),
  condominio_sindico_nome: z.string().optional(),
  condominio_sindico_telefone: z.string().optional(),
  condominio_sindico_email: z.string().email().optional().or(z.literal("")),
  condominio_cnpj: z.string().optional(),
  
  // Responsável
  responsavel_nome: z.string().min(3, "Nome obrigatório"),
  responsavel_cargo: z.string().optional(),
  responsavel_telefone: z.string().min(8, "Telefone obrigatório"),
  responsavel_email: z.string().email("E-mail inválido"),
  responsavel_contato_preferido: z.string().optional(),
  
  // Pacote
  pacote_tipo: z.enum(["basico", "intermediario", "completo", "personalizado"]),
  
  // Cobrança
  cobranca_modelo: z.enum(["por_unidade", "valor_minimo", "percentual", "fixo_mensal", "misto"]).optional(),
  cobranca_valor_por_unidade: z.coerce.number().optional(),
  cobranca_valor_minimo: z.coerce.number().optional(),
  cobranca_percentual: z.coerce.number().max(100).optional(),
  cobranca_valor_fixo: z.coerce.number().optional(),
  
  // Valores
  valor_administracao: z.coerce.number().optional(),
  valor_rh: z.coerce.number().optional(),
  valor_sindico_profissional: z.coerce.number().optional(),
  valor_servicos_extras: z.coerce.number().optional(),
  valor_total: z.coerce.number(),
  
  // Descrição
  resumo_servicos: z.string().optional(),
  diferenciais: z.string().optional(),
  observacoes: z.string().optional(),
  sla_atendimento: z.string().optional(),
  
  // Prazos
  data_emissao: z.string(),
  data_validade: z.string(),
  previsao_inicio_servicos: z.string().optional(),
});

type PropostaFormData = z.infer<typeof propostaSchema>;

interface NovaPropostaWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propostaEdicao?: Database["public"]["Tables"]["propostas"]["Row"] | null;
}

const etapas = [
  { id: 1, titulo: "Condomínio", icon: Building2 },
  { id: 2, titulo: "Responsável", icon: User },
  { id: 3, titulo: "Pacote", icon: Package },
  { id: 4, titulo: "Serviços", icon: FileText },
  { id: 5, titulo: "Valores", icon: DollarSign },
  { id: 6, titulo: "Prazos", icon: Calendar },
];

export function NovaPropostaWizard({
  open,
  onOpenChange,
  propostaEdicao,
}: NovaPropostaWizardProps) {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [servicosSelecionados, setServicosSelecionados] = useState<
    Array<{ id: string; valor: number; quantidade: number }>
  >([]);
  
  const { criarProposta, atualizarProposta, adicionarServicos } = usePropostas();
  const { servicos, categorias } = useServicos();

  const form = useForm<PropostaFormData>({
    resolver: zodResolver(propostaSchema),
    defaultValues: {
      condominio_tipo: "residencial",
      condominio_qtd_unidades: 1,
      pacote_tipo: "basico",
      cobranca_modelo: "por_unidade",
      valor_total: 0,
      data_emissao: new Date().toISOString().split("T")[0],
      data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  });

  // Preencher form se for edição
  useEffect(() => {
    if (propostaEdicao) {
      form.reset({
        condominio_nome: propostaEdicao.condominio_nome,
        condominio_tipo: propostaEdicao.condominio_tipo,
        condominio_endereco: propostaEdicao.condominio_endereco || "",
        condominio_cidade: propostaEdicao.condominio_cidade || "",
        condominio_estado: propostaEdicao.condominio_estado || "",
        condominio_cep: propostaEdicao.condominio_cep || "",
        condominio_qtd_unidades: propostaEdicao.condominio_qtd_unidades,
        condominio_qtd_blocos: propostaEdicao.condominio_qtd_blocos || undefined,
        condominio_qtd_funcionarios: propostaEdicao.condominio_qtd_funcionarios || undefined,
        condominio_sindico_nome: propostaEdicao.condominio_sindico_nome || "",
        condominio_sindico_telefone: propostaEdicao.condominio_sindico_telefone || "",
        condominio_sindico_email: propostaEdicao.condominio_sindico_email || "",
        condominio_cnpj: propostaEdicao.condominio_cnpj || "",
        responsavel_nome: propostaEdicao.responsavel_nome,
        responsavel_cargo: propostaEdicao.responsavel_cargo || "",
        responsavel_telefone: propostaEdicao.responsavel_telefone,
        responsavel_email: propostaEdicao.responsavel_email,
        responsavel_contato_preferido: propostaEdicao.responsavel_contato_preferido || "",
        pacote_tipo: propostaEdicao.pacote_tipo,
        cobranca_modelo: propostaEdicao.cobranca_modelo || undefined,
        cobranca_valor_por_unidade: Number(propostaEdicao.cobranca_valor_por_unidade) || undefined,
        cobranca_valor_minimo: Number(propostaEdicao.cobranca_valor_minimo) || undefined,
        cobranca_percentual: Number(propostaEdicao.cobranca_percentual) || undefined,
        cobranca_valor_fixo: Number(propostaEdicao.cobranca_valor_fixo) || undefined,
        valor_administracao: Number(propostaEdicao.valor_administracao) || undefined,
        valor_rh: Number(propostaEdicao.valor_rh) || undefined,
        valor_sindico_profissional: Number(propostaEdicao.valor_sindico_profissional) || undefined,
        valor_servicos_extras: Number(propostaEdicao.valor_servicos_extras) || undefined,
        valor_total: Number(propostaEdicao.valor_total),
        resumo_servicos: propostaEdicao.resumo_servicos || "",
        diferenciais: propostaEdicao.diferenciais || "",
        observacoes: propostaEdicao.observacoes || "",
        sla_atendimento: propostaEdicao.sla_atendimento || "",
        data_emissao: propostaEdicao.data_emissao,
        data_validade: propostaEdicao.data_validade,
        previsao_inicio_servicos: propostaEdicao.previsao_inicio_servicos || "",
      });
    }
  }, [propostaEdicao, form]);

  // Calcular valor total automaticamente
  const calcularTotal = () => {
    const valores = form.getValues();
    const qtdUnidades = valores.condominio_qtd_unidades || 0;
    const valorPorUnidade = valores.cobranca_valor_por_unidade || 0;
    const valorMinimo = valores.cobranca_valor_minimo || 0;
    
    let total = 0;
    
    // Modelo por unidade
    if (valores.cobranca_modelo === "por_unidade") {
      total = qtdUnidades * valorPorUnidade;
    } else if (valores.cobranca_modelo === "fixo_mensal") {
      total = valores.cobranca_valor_fixo || 0;
    } else {
      total = (valores.valor_administracao || 0) +
        (valores.valor_rh || 0) +
        (valores.valor_sindico_profissional || 0) +
        (valores.valor_servicos_extras || 0);
    }
    
    // Aplicar valor mínimo
    if (valorMinimo && total < valorMinimo) {
      total = valorMinimo;
    }
    
    form.setValue("valor_total", total);
    return total;
  };

  const handleProximo = () => {
    if (etapaAtual < etapas.length) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleVoltar = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const handleSalvarRascunho = async () => {
    const dados = form.getValues();
    calcularTotal();
    
    if (propostaEdicao) {
      await atualizarProposta.mutateAsync({
        id: propostaEdicao.id,
        dados: dados as PropostaInsert,
      });
    } else {
      const novaProposta = await criarProposta.mutateAsync(dados as PropostaInsert);
      
      // Adicionar serviços selecionados com valores editados
      if (servicosSelecionados.length > 0) {
        const servicosParaAdicionar = servicosSelecionados.map(sel => {
          const servicoOriginal = servicos.find(s => s.id === sel.id);
          return {
            servico_id: sel.id,
            categoria_id: servicoOriginal?.categoria_id || undefined,
            servico_nome: servicoOriginal?.nome_servico || "",
            servico_descricao: servicoOriginal?.descricao || undefined,
            selecionado: true,
            valor_unitario: sel.valor,
            quantidade: sel.quantidade,
            valor_total: sel.valor * sel.quantidade,
          };
        });
        
        await adicionarServicos.mutateAsync({
          propostaId: novaProposta.id,
          servicos: servicosParaAdicionar,
        });
      }
    }
    
    onOpenChange(false);
    setEtapaAtual(1);
    form.reset();
    setServicosSelecionados([]);
  };

  const toggleServico = (servicoId: string, valorInicial: number) => {
    setServicosSelecionados(prev => {
      const existe = prev.find(s => s.id === servicoId);
      if (existe) {
        return prev.filter(s => s.id !== servicoId);
      }
      return [...prev, { id: servicoId, valor: valorInicial, quantidade: 1 }];
    });
  };

  const atualizarValorServico = (servicoId: string, novoValor: number) => {
    setServicosSelecionados(prev =>
      prev.map(s => s.id === servicoId ? { ...s, valor: novoValor } : s)
    );
  };

  const atualizarQuantidadeServico = (servicoId: string, novaQuantidade: number) => {
    setServicosSelecionados(prev =>
      prev.map(s => s.id === servicoId ? { ...s, quantidade: novaQuantidade } : s)
    );
  };

  const isServicoSelecionado = (servicoId: string) =>
    servicosSelecionados.some(s => s.id === servicoId);

  const getServicoSelecionado = (servicoId: string) =>
    servicosSelecionados.find(s => s.id === servicoId);

  const calcularTotalServicos = () =>
    servicosSelecionados.reduce((acc, s) => acc + s.valor * s.quantidade, 0);

  const servicosPorCategoria = categorias.map(cat => ({
    categoria: cat,
    servicos: servicos.filter(s => s.categoria_id === cat.id && s.ativo),
  }));

  const progress = (etapaAtual / etapas.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {propostaEdicao ? "Editar Proposta" : "Nova Proposta Comercial"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress e Steps */}
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {etapas.map((etapa) => (
              <button
                key={etapa.id}
                onClick={() => setEtapaAtual(etapa.id)}
                className={`flex flex-col items-center gap-1 text-xs ${
                  etapa.id === etapaAtual
                    ? "text-primary font-semibold"
                    : etapa.id < etapaAtual
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    etapa.id === etapaAtual
                      ? "bg-primary text-primary-foreground"
                      : etapa.id < etapaAtual
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-muted"
                  }`}
                >
                  <etapa.icon className="h-4 w-4" />
                </div>
                <span className="hidden sm:block">{etapa.titulo}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <Form {...form}>
          <ScrollArea className="max-h-[50vh] pr-4">
            {/* Etapa 1: Dados do Condomínio */}
            {etapaAtual === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dados do Condomínio
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condominio_nome"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome do Condomínio *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Condomínio Residencial Aurora" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="condominio_tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="residencial">Residencial</SelectItem>
                            <SelectItem value="comercial">Comercial</SelectItem>
                            <SelectItem value="misto">Misto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="condominio_qtd_unidades"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Unidades *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min={1} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="condominio_qtd_blocos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blocos/Torres</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="condominio_qtd_funcionarios"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funcionários</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="condominio_endereco"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Rua, número" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="condominio_cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="condominio_estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="condominio_cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
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
                    name="condominio_cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00.000.000/0001-00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <h4 className="font-medium text-sm">Síndico (opcional)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="condominio_sindico_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="condominio_sindico_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="condominio_sindico_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Etapa 2: Responsável */}
            {etapaAtual === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Responsável pela Contratação
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsavel_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="responsavel_cargo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Síndico, Conselheiro" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="responsavel_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(00) 00000-0000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="responsavel_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="responsavel_contato_preferido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contato Preferido</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="telefone">Telefone</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Etapa 3: Pacote */}
            {etapaAtual === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Tipo de Pacote
                </h3>
                
                <FormField
                  control={form.control}
                  name="pacote_tipo"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { value: "basico", label: "Básico", desc: "Serviços essenciais de administração" },
                          { value: "intermediario", label: "Intermediário", desc: "Inclui gestão financeira e RH básico" },
                          { value: "completo", label: "Completo", desc: "Todos os serviços inclusos" },
                          { value: "personalizado", label: "Personalizado", desc: "Monte seu pacote sob medida" },
                        ].map((pacote) => (
                          <div
                            key={pacote.value}
                            onClick={() => field.onChange(pacote.value)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                              field.value === pacote.value
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-muted-foreground/30"
                            }`}
                          >
                            <p className="font-medium">{pacote.label}</p>
                            <p className="text-sm text-muted-foreground">{pacote.desc}</p>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <h4 className="font-medium text-sm">Modelo de Cobrança</h4>
                <FormField
                  control={form.control}
                  name="cobranca_modelo"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="por_unidade">Por Unidade</SelectItem>
                          <SelectItem value="valor_minimo">Valor Mínimo</SelectItem>
                          <SelectItem value="percentual">Percentual da Arrecadação</SelectItem>
                          <SelectItem value="fixo_mensal">Valor Fixo Mensal</SelectItem>
                          <SelectItem value="misto">Misto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cobranca_valor_por_unidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor por Unidade (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={(e) => { field.onChange(e); calcularTotal(); }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cobranca_valor_minimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Mínimo (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={(e) => { field.onChange(e); calcularTotal(); }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Etapa 4: Serviços */}
            {etapaAtual === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Seleção de Serviços
                  </h3>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {servicosSelecionados.length} selecionado(s)
                    </Badge>
                    <Badge variant="secondary">
                      Total: R$ {calcularTotalServicos().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Badge>
                  </div>
                </div>
                
                {servicosPorCategoria.map(({ categoria, servicos: servicosCat }) => (
                  servicosCat.length > 0 && (
                    <div key={categoria.id} className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoria.cor || "#3B82F6" }}
                        />
                        {categoria.nome_categoria}
                      </h4>
                      <div className="space-y-2">
                        {servicosCat.map((servico) => {
                          const selecionado = isServicoSelecionado(servico.id);
                          const servicoData = getServicoSelecionado(servico.id);
                          const valorOriginal = parseValorServico(servico.valor);
                          
                          return (
                            <div
                              key={servico.id}
                              className={`p-3 rounded-lg border transition-colors ${
                                selecionado
                                  ? "border-primary bg-primary/5"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleServico(servico.id, valorOriginal)}
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selecionado}
                                    onCheckedChange={() => toggleServico(servico.id, valorOriginal)}
                                  />
                                  <div>
                                    <p className="font-medium">{servico.nome_servico}</p>
                                    {servico.descricao && (
                                      <p className="text-xs text-muted-foreground">{servico.descricao}</p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="secondary">
                                  R$ {valorOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </Badge>
                              </div>
                              
                              {selecionado && servicoData && (
                                <div className="mt-3 pt-3 border-t flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">Qtd:</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={servicoData.quantidade}
                                      onChange={(e) => atualizarQuantidadeServico(servico.id, parseInt(e.target.value) || 1)}
                                      className="w-20 h-8"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">Valor Unit. (R$):</label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min={0}
                                      value={servicoData.valor}
                                      onChange={(e) => atualizarValorServico(servico.id, parseFloat(e.target.value) || 0)}
                                      className="w-28 h-8"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="ml-auto text-sm font-medium">
                                    Subtotal: R$ {(servicoData.valor * servicoData.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Etapa 5: Valores */}
            {etapaAtual === 5 && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valores da Proposta
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor_administracao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Administração (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={(e) => { field.onChange(e); calcularTotal(); }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valor_rh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gestão de RH (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={(e) => { field.onChange(e); calcularTotal(); }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valor_sindico_profissional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Síndico Profissional (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={(e) => { field.onChange(e); calcularTotal(); }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valor_servicos_extras"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serviços Extras (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={(e) => { field.onChange(e); calcularTotal(); }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">VALOR TOTAL MENSAL</span>
                    <span className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(form.watch("valor_total") || 0)}
                    </span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="diferenciais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diferenciais da Proposta</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder="Destaque os diferenciais..." />
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
                        <Textarea {...field} rows={3} placeholder="Observações adicionais..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Etapa 6: Prazos */}
            {etapaAtual === 6 && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Prazos e Validade
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="data_emissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Emissão *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_validade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validade da Proposta *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="previsao_inicio_servicos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previsão de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sla_atendimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SLA de Atendimento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Resposta em até 24h úteis" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resumo Final */}
                <Separator />
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-semibold">Resumo da Proposta</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Condomínio: </span>
                      <span className="font-medium">{form.watch("condominio_nome")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Unidades: </span>
                      <span className="font-medium">{form.watch("condominio_qtd_unidades")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pacote: </span>
                      <span className="font-medium capitalize">{form.watch("pacote_tipo")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Serviços: </span>
                      <span className="font-medium">{servicosSelecionados.length}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">Valor Total: </span>
                    <span className="font-bold text-primary text-lg">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(form.watch("valor_total") || 0)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </Form>

        <Separator />

        {/* Navegação */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleVoltar}
            disabled={etapaAtual === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSalvarRascunho}
              disabled={criarProposta.isPending || atualizarProposta.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Rascunho
            </Button>
            
            {etapaAtual < etapas.length ? (
              <Button onClick={handleProximo}>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSalvarRascunho}
                disabled={criarProposta.isPending || atualizarProposta.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Finalizar Proposta
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
