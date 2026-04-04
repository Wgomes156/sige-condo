import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCondominios } from "@/hooks/useCondominios";
import {
  useUnidadeById,
  useCreateUnidadeCompleta,
  useUpdateUnidadeCompleta,
  useVeiculosByUnidade,
  useAnimaisByUnidade,
  useMoradoresByUnidade,
  useVisitantesByUnidade,
  useAcessosByUnidade,
  useVagasByUnidade,
  type TipoUnidade,
  type TipoLocalizacao,
  type SituacaoUnidade,
  type TipoOcupacao,
  type ResponsavelFinanceiro,
  type StatusFinanceiroUnidade,
} from "@/hooks/useUnidadesCompleto";
import { toast } from "sonner";
import { Building2, Car, PawPrint, Users, UserCheck, Key, ParkingSquare, FileText, User, Wallet, ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCpf, formatTelefone, validateCpf, validateEmail, validateTelefone } from "@/lib/masks";
import { VeiculosInlineForm } from "./forms/VeiculosInlineForm";
import { AnimaisInlineForm } from "./forms/AnimaisInlineForm";
import { MoradoresInlineForm } from "./forms/MoradoresInlineForm";
import { VisitantesInlineForm } from "./forms/VisitantesInlineForm";
import { AcessosInlineForm } from "./forms/AcessosInlineForm";
import { VagasInlineForm } from "./forms/VagasInlineForm";
import { useIsMobile } from "@/hooks/useIsMobile";

interface UnidadeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeId?: string;
}

export function UnidadeFormDialog({
  open,
  onOpenChange,
  unidadeId,
}: UnidadeFormDialogProps) {
  const isMobile = useIsMobile();
  const isEditing = !!unidadeId;
  const { data: unidade } = useUnidadeById(unidadeId);
  const { data: condominios } = useCondominios();
  const { data: veiculos } = useVeiculosByUnidade(unidadeId);
  const { data: animais } = useAnimaisByUnidade(unidadeId);
  const { data: moradores } = useMoradoresByUnidade(unidadeId);
  const { data: visitantes } = useVisitantesByUnidade(unidadeId);
  const { data: acessos } = useAcessosByUnidade(unidadeId);
  const { data: vagas } = useVagasByUnidade(unidadeId);
  const createUnidade = useCreateUnidadeCompleta();
  const updateUnidade = useUpdateUnidadeCompleta();

  const [formData, setFormData] = useState({
    condominio_id: "",
    codigo: "",
    bloco: "",
    tipo_unidade: "apartamento" as TipoUnidade,
    tipo_localizacao: "" as TipoLocalizacao | "",
    nome_localizacao: "",
    andar: "",
    numero_unidade: "",
    endereco: "",
    numero_endereco: "",
    complemento: "",
    situacao: "ativa" as SituacaoUnidade,
    tipo_ocupacao: "moradia" as TipoOcupacao,
    responsavel_financeiro: "proprietario" as ResponsavelFinanceiro,
    status_financeiro: "em_dia" as StatusFinanceiroUnidade,
    quantidade_moradores: "0",
    observacoes_internas: "",
    observacoes_gerais: "",
    morador_nome: "",
    morador_email: "",
    morador_telefone: "",
    // Proprietário
    proprietario_nome: "",
    proprietario_cpf: "",
    proprietario_telefone: "",
    proprietario_email: "",
    // Inquilino
    inquilino_nome: "",
    inquilino_cpf: "",
    inquilino_telefone: "",
    inquilino_email: "",
    // Responsável Financeiro
    resp_financeiro_nome: "",
    resp_financeiro_cpf: "",
    resp_financeiro_telefone: "",
    resp_financeiro_email: "",
    resp_financeiro_opcao_envio: "email",
  });

  useEffect(() => {
    if (unidade) {
      setFormData({
        condominio_id: unidade.condominio_id,
        codigo: unidade.codigo,
        bloco: unidade.bloco || "",
        tipo_unidade: unidade.tipo_unidade,
        tipo_localizacao: unidade.tipo_localizacao || "",
        nome_localizacao: unidade.nome_localizacao || "",
        andar: unidade.andar?.toString() || "",
        numero_unidade: unidade.numero_unidade || "",
        endereco: unidade.endereco || "",
        numero_endereco: unidade.numero_endereco || "",
        complemento: unidade.complemento || "",
        situacao: unidade.situacao,
        tipo_ocupacao: unidade.tipo_ocupacao,
        responsavel_financeiro: unidade.responsavel_financeiro,
        status_financeiro: unidade.status_financeiro,
        quantidade_moradores: unidade.quantidade_moradores?.toString() || "0",
        observacoes_internas: unidade.observacoes_internas || "",
        observacoes_gerais: unidade.observacoes_gerais || "",
        morador_nome: unidade.morador_nome || "",
        morador_email: unidade.morador_email || "",
        morador_telefone: unidade.morador_telefone || "",
        // Proprietário
        proprietario_nome: (unidade as any).proprietario_nome || "",
        proprietario_cpf: (unidade as any).proprietario_cpf || "",
        proprietario_telefone: (unidade as any).proprietario_telefone || "",
        proprietario_email: (unidade as any).proprietario_email || "",
        // Inquilino
        inquilino_nome: (unidade as any).inquilino_nome || "",
        inquilino_cpf: (unidade as any).inquilino_cpf || "",
        inquilino_telefone: (unidade as any).inquilino_telefone || "",
        inquilino_email: (unidade as any).inquilino_email || "",
        // Responsável Financeiro
        resp_financeiro_nome: (unidade as any).resp_financeiro_nome || "",
        resp_financeiro_cpf: (unidade as any).resp_financeiro_cpf || "",
        resp_financeiro_telefone: (unidade as any).resp_financeiro_telefone || "",
        resp_financeiro_email: (unidade as any).resp_financeiro_email || "",
        resp_financeiro_opcao_envio: (unidade as any).resp_financeiro_opcao_envio || "email",
      });
    } else {
      setFormData({
        condominio_id: "",
        codigo: "",
        bloco: "",
        tipo_unidade: "apartamento",
        tipo_localizacao: "",
        nome_localizacao: "",
        andar: "",
        numero_unidade: "",
        endereco: "",
        numero_endereco: "",
        complemento: "",
        situacao: "ativa",
        tipo_ocupacao: "moradia",
        responsavel_financeiro: "proprietario",
        status_financeiro: "em_dia",
        quantidade_moradores: "0",
        observacoes_internas: "",
        observacoes_gerais: "",
        morador_nome: "",
        morador_email: "",
        morador_telefone: "",
        proprietario_nome: "",
        proprietario_cpf: "",
        proprietario_telefone: "",
        proprietario_email: "",
        inquilino_nome: "",
        inquilino_cpf: "",
        inquilino_telefone: "",
        inquilino_email: "",
        resp_financeiro_nome: "",
        resp_financeiro_cpf: "",
        resp_financeiro_telefone: "",
        resp_financeiro_email: "",
        resp_financeiro_opcao_envio: "email",
      });
    }
  }, [unidade, open]);

  const handleSubmit = async () => {
    if (!formData.condominio_id) {
      toast.error("Selecione um condomínio");
      return;
    }
    // No modo criação, o código é gerado automaticamente pelo banco
    if (isEditing && !formData.codigo) {
      toast.error("Código da unidade não pode estar vazio");
      return;
    }

    const payload = {
      condominio_id: formData.condominio_id,
      // Em criação, omitir codigo para usar o default da sequência
      ...(isEditing ? { codigo: formData.codigo } : {}),
      bloco: formData.bloco || undefined,
      tipo_unidade: formData.tipo_unidade,
      tipo_localizacao: formData.tipo_localizacao || undefined,
      nome_localizacao: formData.nome_localizacao || undefined,
      andar: formData.andar ? parseInt(formData.andar) : undefined,
      numero_unidade: formData.numero_unidade || undefined,
      endereco: formData.endereco || undefined,
      numero_endereco: formData.numero_endereco || undefined,
      complemento: formData.complemento || undefined,
      situacao: formData.situacao,
      tipo_ocupacao: formData.tipo_ocupacao,
      responsavel_financeiro: formData.responsavel_financeiro,
      status_financeiro: formData.status_financeiro,
      quantidade_moradores: parseInt(formData.quantidade_moradores) || 0,
      observacoes_internas: formData.observacoes_internas || undefined,
      observacoes_gerais: formData.observacoes_gerais || undefined,
      morador_nome: formData.morador_nome || undefined,
      morador_email: formData.morador_email || undefined,
      morador_telefone: formData.morador_telefone || undefined,
      // Proprietário
      proprietario_nome: formData.proprietario_nome || undefined,
      proprietario_cpf: formData.proprietario_cpf || undefined,
      proprietario_telefone: formData.proprietario_telefone || undefined,
      proprietario_email: formData.proprietario_email || undefined,
      // Inquilino
      inquilino_nome: formData.inquilino_nome || undefined,
      inquilino_cpf: formData.inquilino_cpf || undefined,
      inquilino_telefone: formData.inquilino_telefone || undefined,
      inquilino_email: formData.inquilino_email || undefined,
      // Responsável Financeiro
      resp_financeiro_nome: formData.resp_financeiro_nome || undefined,
      resp_financeiro_cpf: formData.resp_financeiro_cpf || undefined,
      resp_financeiro_telefone: formData.resp_financeiro_telefone || undefined,
      resp_financeiro_email: formData.resp_financeiro_email || undefined,
      resp_financeiro_opcao_envio: formData.resp_financeiro_opcao_envio || undefined,
    };

    try {
      if (isEditing && unidadeId) {
        await updateUnidade.mutateAsync({ id: unidadeId, ...payload });
      } else {
        await createUnidade.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar unidade:", error);
    }
  };

  const isPending = createUnidade.isPending || updateUnidade.isPending;

  const [cpfErrors, setCpfErrors] = useState<Record<string, string>>({});

  const handleCpfChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setFormData({ ...formData, [field]: formatted });
    
    // Limpa erro enquanto digita
    if (cpfErrors[field]) {
      setCpfErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCpfBlur = (field: string) => () => {
    const value = formData[field as keyof typeof formData] as string;
    if (value && value.replace(/\D/g, '').length === 11) {
      if (!validateCpf(value)) {
        setCpfErrors((prev) => ({ ...prev, [field]: "CPF inválido" }));
      } else {
        setCpfErrors((prev) => ({ ...prev, [field]: "" }));
      }
    } else if (value && value.replace(/\D/g, '').length > 0 && value.replace(/\D/g, '').length < 11) {
      setCpfErrors((prev) => ({ ...prev, [field]: "CPF incompleto" }));
    } else {
      setCpfErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const [telefoneErrors, setTelefoneErrors] = useState<Record<string, string>>({});

  const handleTelefoneChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setFormData({ ...formData, [field]: formatted });
    if (telefoneErrors[field]) {
      setTelefoneErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleTelefoneBlur = (field: string) => () => {
    const value = formData[field as keyof typeof formData] as string;
    const digits = value?.replace(/\D/g, '') || '';
    if (digits.length > 0 && digits.length < 10) {
      setTelefoneErrors((prev) => ({ ...prev, [field]: "Telefone incompleto" }));
    } else if (digits.length > 0 && !validateTelefone(value)) {
      setTelefoneErrors((prev) => ({ ...prev, [field]: "Telefone inválido" }));
    } else {
      setTelefoneErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});

  const handleEmailChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (emailErrors[field]) {
      setEmailErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleEmailBlur = (field: string) => () => {
    const value = formData[field as keyof typeof formData] as string;
    if (value && !validateEmail(value)) {
      setEmailErrors((prev) => ({ ...prev, [field]: "E-mail inválido" }));
    } else {
      setEmailErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-4xl max-h-[95vh] p-0 overflow-hidden",
        isMobile ? "w-[100vw] h-[100dvh] rounded-none border-none" : ""
      )}>
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Building2 className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Unidade" : "Nova Unidade"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Preencha os dados da unidade. Após salvar, poderá adicionar vínculos.
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue="identificacao" 
          className={cn("flex flex-col sm:flex-row gap-4 h-full", isMobile ? "max-h-[75vh]" : "max-h-[65vh]")} 
          orientation={isMobile ? "horizontal" : "vertical"}
        >
          {/* Navegação Lateral / Superior no Mobile */}
          <div className={cn(
            "flex-shrink-0 border-b sm:border-b-0 sm:border-r",
            isMobile ? "w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sticky top-0 bg-background z-10" : "w-44 pr-2"
          )}>
            <ScrollArea className={cn(isMobile ? "w-max" : "h-full")}>
              <div className={cn(
                "py-2 flex",
                isMobile ? "flex-row gap-4 h-12 items-center" : "flex-col space-y-4"
              )}>
                {/* Grupo: Dados Básicos */}
                <div className={cn(isMobile ? "flex flex-row gap-1" : "")}>
                  {!isMobile && (
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                      Dados Básicos
                    </h4>
                  )}
                  <TabsList className={cn("bg-transparent gap-0.5", isMobile ? "flex-row h-10" : "flex-col h-auto")}>
                    <TabsTrigger value="identificacao" className={cn("justify-start text-xs h-8 px-2 whitespace-nowrap", isMobile ? "rounded-full border" : "w-full")}>
                      <Building2 className="h-3.5 w-3.5 mr-2" />
                      Identificação
                    </TabsTrigger>
                    <TabsTrigger value="observacoes" className={cn("justify-start text-xs h-8 px-2 whitespace-nowrap", isMobile ? "rounded-full border" : "w-full")}>
                      <FileText className="h-3.5 w-3.5 mr-2" />
                      Observações
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Grupo: Pessoas */}
                <div className={cn(isMobile ? "flex flex-row gap-1" : "")}>
                  {!isMobile && (
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                      Pessoas
                    </h4>
                  )}
                  <TabsList className={cn("bg-transparent gap-0.5", isMobile ? "flex-row h-10" : "flex-col h-auto")}>
                    <TabsTrigger value="proprietario" className={cn("justify-start text-xs h-8 px-2 relative whitespace-nowrap", isMobile ? "rounded-full border" : "w-full", (cpfErrors.proprietario_cpf || emailErrors.proprietario_email || telefoneErrors.proprietario_telefone) && "pr-5")}>
                      <User className="h-3.5 w-3.5 mr-2" />
                      Proprietário
                    </TabsTrigger>
                    <TabsTrigger value="inquilino" className={cn("justify-start text-xs h-8 px-2 relative whitespace-nowrap", isMobile ? "rounded-full border" : "w-full", (cpfErrors.inquilino_cpf || emailErrors.inquilino_email || telefoneErrors.inquilino_telefone) && "pr-5")}>
                      <User className="h-3.5 w-3.5 mr-2" />
                      Inquilino
                    </TabsTrigger>
                    <TabsTrigger value="financeiro" className={cn("justify-start text-xs h-8 px-2 relative whitespace-nowrap", isMobile ? "rounded-full border" : "w-full", (cpfErrors.resp_financeiro_cpf || emailErrors.resp_financeiro_email || telefoneErrors.resp_financeiro_telefone) && "pr-5")}>
                      <Wallet className="h-3.5 w-3.5 mr-2" />
                      Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="moradores" className={cn("justify-start text-xs h-8 px-2 whitespace-nowrap", isMobile ? "rounded-full border" : "w-full")}>
                      <Users className="h-3.5 w-3.5 mr-2" />
                      Moradores
                    </TabsTrigger>
                    <TabsTrigger value="visitantes" className={cn("justify-start text-xs h-8 px-2 whitespace-nowrap", isMobile ? "rounded-full border" : "w-full")}>
                      <UserCheck className="h-3.5 w-3.5 mr-2" />
                      Visitantes
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Grupo: Patrimônio */}
                <div className={cn(isMobile ? "flex flex-row gap-1" : "")}>
                  {!isMobile && (
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                      Patrimônio
                    </h4>
                  )}
                  <TabsList className={cn("bg-transparent gap-0.5", isMobile ? "flex-row h-10" : "flex-col h-auto")}>
                    <TabsTrigger value="veiculos" className={cn("justify-start text-xs h-8 px-2 whitespace-nowrap", isMobile ? "rounded-full border" : "w-full")}>
                      <Car className="h-3.5 w-3.5 mr-2" />
                      Veículos
                    </TabsTrigger>
                    <TabsTrigger value="animais" className={cn("justify-start text-xs h-8 px-2 whitespace-nowrap", isMobile ? "rounded-full border" : "w-full")}>
                      <PawPrint className="h-3.5 w-3.5 mr-2" />
                      Animais
                    </TabsTrigger>
                    <TabsTrigger value="vagas" className={cn("justify-start text-xs h-8 px-2 whitespace-nowrap", isMobile ? "rounded-full border" : "w-full")}>
                      <ParkingSquare className="h-3.5 w-3.5 mr-2" />
                      Vagas
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Grupo: Segurança */}
                <div className={cn(isMobile ? "flex flex-row gap-1" : "")}>
                  {!isMobile && (
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                      Segurança
                    </h4>
                  )}
                  <TabsList className={cn("bg-transparent gap-0.5", isMobile ? "flex-row h-10" : "flex-col h-auto")}>
                    <TabsTrigger value="acessos" className={cn("justify-start text-xs h-8 px-2 whitespace-nowrap", isMobile ? "rounded-full border" : "w-full")}>
                      <Key className="h-3.5 w-3.5 mr-2" />
                      Acessos
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Área de Conteúdo */}
          <ScrollArea className="flex-1 p-2 sm:p-0">
            <TabsContent value="identificacao" className="space-y-4 mt-0 outline-none">
              {/* Condomínio e Código */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Condomínio *</Label>
                  <Select
                    value={formData.condominio_id}
                    onValueChange={(v) => setFormData({ ...formData, condominio_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o condomínio" />
                    </SelectTrigger>
                    <SelectContent>
                      {condominios?.map((cond) => (
                        <SelectItem key={cond.id} value={cond.id}>
                          {cond.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Código da Unidade {isEditing ? "*" : "(automático)"}</Label>
                  <Input
                    placeholder={isEditing ? "Código da unidade" : "Gerado automaticamente ao salvar"}
                    value={isEditing ? formData.codigo : ""}
                    onChange={(e) => isEditing && setFormData({ ...formData, codigo: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
              </div>

              {/* Tipo de Unidade e Situação */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Unidade</Label>
                  <Select
                    value={formData.tipo_unidade}
                    onValueChange={(v) => setFormData({ ...formData, tipo_unidade: v as TipoUnidade })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="loja">Loja</SelectItem>
                      <SelectItem value="escritorio">Escritório</SelectItem>
                      <SelectItem value="sala">Sala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Situação</Label>
                  <Select
                    value={formData.situacao}
                    onValueChange={(v) => setFormData({ ...formData, situacao: v as SituacaoUnidade })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="inativa">Inativa</SelectItem>
                      <SelectItem value="em_reforma">Em Reforma</SelectItem>
                      <SelectItem value="desocupada">Desocupada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Localização */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Localização</Label>
                  <Select
                    value={formData.tipo_localizacao}
                    onValueChange={(v) => setFormData({ ...formData, tipo_localizacao: v as TipoLocalizacao })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bloco">Bloco</SelectItem>
                      <SelectItem value="torre">Torre</SelectItem>
                      <SelectItem value="rua">Rua</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bloco</Label>
                  <Input
                    placeholder="Ex: A, B, 1"
                    value={formData.bloco}
                    onChange={(e) => setFormData({ ...formData, bloco: e.target.value })}
                  />
                </div>
              </div>

              {/* Andar e Número */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Andar</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 5"
                    value={formData.andar}
                    onChange={(e) => setFormData({ ...formData, andar: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número da Unidade</Label>
                  <Input
                    placeholder="Ex: 501"
                    value={formData.numero_unidade}
                    onChange={(e) => setFormData({ ...formData, numero_unidade: e.target.value })}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    placeholder="Rua, Avenida..."
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    placeholder="123"
                    value={formData.numero_endereco}
                    onChange={(e) => setFormData({ ...formData, numero_endereco: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  placeholder="Complemento do endereço"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                />
              </div>

              {/* Tipo de Ocupação, Status Financeiro e Qtd Moradores */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Tipo de Ocupação</Label>
                  <Select
                    value={formData.tipo_ocupacao}
                    onValueChange={(v) => setFormData({ ...formData, tipo_ocupacao: v as TipoOcupacao })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moradia">Moradia (Própria)</SelectItem>
                      <SelectItem value="aluguel">Aluguel</SelectItem>
                      <SelectItem value="aluguel_temporada">Aluguel por Temporada</SelectItem>
                      <SelectItem value="desocupado">Desocupado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status Financeiro</Label>
                  <Select
                    value={formData.status_financeiro}
                    onValueChange={(v) => setFormData({ ...formData, status_financeiro: v as StatusFinanceiroUnidade })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_dia">Em Dia</SelectItem>
                      <SelectItem value="inadimplente">Inadimplente</SelectItem>
                      <SelectItem value="acordo">Em Acordo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Qtd. Moradores</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.quantidade_moradores}
                    onChange={(e) => setFormData({ ...formData, quantidade_moradores: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="proprietario" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Dados do proprietário da unidade
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome do Proprietário</Label>
                  <Input
                    placeholder="Nome completo"
                    value={formData.proprietario_nome}
                    onChange={(e) => setFormData({ ...formData, proprietario_nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF do Proprietário</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={formData.proprietario_cpf}
                    onChange={handleCpfChange("proprietario_cpf")}
                    onBlur={handleCpfBlur("proprietario_cpf")}
                    maxLength={14}
                    className={cpfErrors.proprietario_cpf ? "border-destructive" : ""}
                  />
                  {cpfErrors.proprietario_cpf && (
                    <p className="text-xs text-destructive">{cpfErrors.proprietario_cpf}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Telefone do Proprietário</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.proprietario_telefone}
                    onChange={handleTelefoneChange("proprietario_telefone")}
                    onBlur={handleTelefoneBlur("proprietario_telefone")}
                    maxLength={15}
                    className={telefoneErrors.proprietario_telefone ? "border-destructive" : ""}
                  />
                  {telefoneErrors.proprietario_telefone && (
                    <p className="text-xs text-destructive">{telefoneErrors.proprietario_telefone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Proprietário</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.proprietario_email}
                    onChange={handleEmailChange("proprietario_email")}
                    onBlur={handleEmailBlur("proprietario_email")}
                    className={emailErrors.proprietario_email ? "border-destructive" : ""}
                  />
                  {emailErrors.proprietario_email && (
                    <p className="text-xs text-destructive">{emailErrors.proprietario_email}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inquilino" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Dados do inquilino (se a unidade estiver alugada)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      inquilino_nome: formData.proprietario_nome,
                      inquilino_cpf: formData.proprietario_cpf,
                      inquilino_telefone: formData.proprietario_telefone,
                      inquilino_email: formData.proprietario_email,
                    });
                    // Limpa erros dos campos copiados
                    setCpfErrors((prev) => ({ ...prev, inquilino_cpf: "" }));
                    setEmailErrors((prev) => ({ ...prev, inquilino_email: "" }));
                    setTelefoneErrors((prev) => ({ ...prev, inquilino_telefone: "" }));
                  }}
                  disabled={!formData.proprietario_nome}
                >
                  Copiar do Proprietário
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome do Inquilino</Label>
                  <Input
                    placeholder="Nome completo"
                    value={formData.inquilino_nome}
                    onChange={(e) => setFormData({ ...formData, inquilino_nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF do Inquilino</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={formData.inquilino_cpf}
                    onChange={handleCpfChange("inquilino_cpf")}
                    onBlur={handleCpfBlur("inquilino_cpf")}
                    maxLength={14}
                    className={cpfErrors.inquilino_cpf ? "border-destructive" : ""}
                  />
                  {cpfErrors.inquilino_cpf && (
                    <p className="text-xs text-destructive">{cpfErrors.inquilino_cpf}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Telefone do Inquilino</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.inquilino_telefone}
                    onChange={handleTelefoneChange("inquilino_telefone")}
                    onBlur={handleTelefoneBlur("inquilino_telefone")}
                    maxLength={15}
                    className={telefoneErrors.inquilino_telefone ? "border-destructive" : ""}
                  />
                  {telefoneErrors.inquilino_telefone && (
                    <p className="text-xs text-destructive">{telefoneErrors.inquilino_telefone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Inquilino</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.inquilino_email}
                    onChange={handleEmailChange("inquilino_email")}
                    onBlur={handleEmailBlur("inquilino_email")}
                    className={emailErrors.inquilino_email ? "border-destructive" : ""}
                  />
                  {emailErrors.inquilino_email && (
                    <p className="text-xs text-destructive">{emailErrors.inquilino_email}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financeiro" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Responsável pelo recebimento e pagamento de boletos
              </p>

              <div className="space-y-2">
                <Label>Quem é o responsável financeiro?</Label>
                <Select
                  value={formData.responsavel_financeiro}
                  onValueChange={(v) => {
                    const tipo = v as ResponsavelFinanceiro;
                    if (tipo === "proprietario") {
                      setFormData({
                        ...formData,
                        responsavel_financeiro: tipo,
                        resp_financeiro_nome: formData.proprietario_nome,
                        resp_financeiro_cpf: formData.proprietario_cpf,
                        resp_financeiro_telefone: formData.proprietario_telefone,
                        resp_financeiro_email: formData.proprietario_email,
                      });
                      // Limpa erros dos campos copiados
                      setCpfErrors((prev) => ({ ...prev, resp_financeiro_cpf: "" }));
                      setEmailErrors((prev) => ({ ...prev, resp_financeiro_email: "" }));
                      setTelefoneErrors((prev) => ({ ...prev, resp_financeiro_telefone: "" }));
                    } else if (tipo === "inquilino") {
                      setFormData({
                        ...formData,
                        responsavel_financeiro: tipo,
                        resp_financeiro_nome: formData.inquilino_nome,
                        resp_financeiro_cpf: formData.inquilino_cpf,
                        resp_financeiro_telefone: formData.inquilino_telefone,
                        resp_financeiro_email: formData.inquilino_email,
                      });
                      // Limpa erros dos campos copiados
                      setCpfErrors((prev) => ({ ...prev, resp_financeiro_cpf: "" }));
                      setEmailErrors((prev) => ({ ...prev, resp_financeiro_email: "" }));
                      setTelefoneErrors((prev) => ({ ...prev, resp_financeiro_telefone: "" }));
                    } else {
                      setFormData({ ...formData, responsavel_financeiro: tipo });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proprietario">Proprietário</SelectItem>
                    <SelectItem value="inquilino">Inquilino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-4">Dados para envio de boleto</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      placeholder="Nome completo"
                      value={formData.resp_financeiro_nome}
                      onChange={(e) => setFormData({ ...formData, resp_financeiro_nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={formData.resp_financeiro_cpf}
                      onChange={handleCpfChange("resp_financeiro_cpf")}
                      onBlur={handleCpfBlur("resp_financeiro_cpf")}
                      maxLength={14}
                      className={cpfErrors.resp_financeiro_cpf ? "border-destructive" : ""}
                    />
                    {cpfErrors.resp_financeiro_cpf && (
                      <p className="text-xs text-destructive">{cpfErrors.resp_financeiro_cpf}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={formData.resp_financeiro_telefone}
                      onChange={handleTelefoneChange("resp_financeiro_telefone")}
                      onBlur={handleTelefoneBlur("resp_financeiro_telefone")}
                      maxLength={15}
                      className={telefoneErrors.resp_financeiro_telefone ? "border-destructive" : ""}
                    />
                    {telefoneErrors.resp_financeiro_telefone && (
                      <p className="text-xs text-destructive">{telefoneErrors.resp_financeiro_telefone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formData.resp_financeiro_email}
                      onChange={handleEmailChange("resp_financeiro_email")}
                      onBlur={handleEmailBlur("resp_financeiro_email")}
                      className={emailErrors.resp_financeiro_email ? "border-destructive" : ""}
                    />
                    {emailErrors.resp_financeiro_email && (
                      <p className="text-xs text-destructive">{emailErrors.resp_financeiro_email}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label>Opção de Envio</Label>
                  <Select
                    value={formData.resp_financeiro_opcao_envio}
                    onValueChange={(v) => setFormData({ ...formData, resp_financeiro_opcao_envio: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="impresso">Impresso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="veiculos" className="space-y-4 mt-4">
              {isEditing && unidadeId ? (
                <VeiculosInlineForm
                  unidadeId={unidadeId}
                  veiculos={veiculos || []}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Salve a unidade primeiro para poder adicionar veículos.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="animais" className="space-y-4 mt-4">
              {isEditing && unidadeId ? (
                <AnimaisInlineForm
                  unidadeId={unidadeId}
                  animais={animais || []}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PawPrint className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Salve a unidade primeiro para poder adicionar animais.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="moradores" className="space-y-4 mt-4">
              {isEditing && unidadeId ? (
                <MoradoresInlineForm
                  unidadeId={unidadeId}
                  moradores={moradores || []}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Salve a unidade primeiro para poder adicionar moradores.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="visitantes" className="space-y-4 mt-4">
              {isEditing && unidadeId ? (
                <VisitantesInlineForm
                  unidadeId={unidadeId}
                  visitantes={visitantes || []}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Salve a unidade primeiro para poder adicionar visitantes.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="acessos" className="space-y-4 mt-4">
              {isEditing && unidadeId ? (
                <AcessosInlineForm
                  unidadeId={unidadeId}
                  acessos={acessos || []}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Salve a unidade primeiro para poder adicionar acessos.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="vagas" className="space-y-4 mt-4">
              {isEditing && unidadeId ? (
                <VagasInlineForm
                  unidadeId={unidadeId}
                  vagas={vagas || []}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ParkingSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Salve a unidade primeiro para poder adicionar vagas.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="observacoes" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Observações Internas</Label>
                <Textarea
                  placeholder="Observações visíveis apenas para a administração..."
                  value={formData.observacoes_internas}
                  onChange={(e) => setFormData({ ...formData, observacoes_internas: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações Gerais</Label>
                <Textarea
                  placeholder="Observações gerais sobre a unidade..."
                  value={formData.observacoes_gerais}
                  onChange={(e) => setFormData({ ...formData, observacoes_gerais: e.target.value })}
                  rows={4}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              isPending || 
              Object.values(cpfErrors).some((e) => e !== "") || 
              Object.values(emailErrors).some((e) => e !== "") ||
              Object.values(telefoneErrors).some((e) => e !== "")
            }
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
