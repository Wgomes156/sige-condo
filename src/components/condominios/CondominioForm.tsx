import { useEffect, useState, useRef, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnexosSection } from "@/components/anexos/AnexosSection";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCnpj, validateCnpj, unformatCnpj } from "@/lib/masks";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCreateCondominio, useUpdateCondominio, Condominio } from "@/hooks/useCondominios";

const condominioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  cep: z.string().optional(),
  tipo_imovel: z.string().optional(),
  quantidade_unidades: z.number().optional().nullable(),
  quantidade_blocos: z.number().optional().nullable(),
  // Informações Jurídicas
  tem_cnpj: z.boolean().optional(),
  cnpj: z.string().optional().refine((val) => {
    if (!val || val === '') return true;
    return validateCnpj(val);
  }, { message: "CNPJ inválido" }),
  // Síndico
  tem_sindico: z.boolean().optional(),
  sindico_nome: z.string().optional(),
  sindico_telefone: z.string().optional(),
  sindico_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  // Infraestrutura
  tem_administradora: z.boolean().optional(),
  nome_administradora: z.string().optional(),
  administradora_site: z.string().optional(),
  administradora_responsavel: z.string().optional(),
  administradora_telefone: z.string().optional(),
  administradora_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  administradora_tem_contrato: z.boolean().optional(),
  // Estrutura - Amenidades
  salao_festa: z.boolean().optional(),
  area_kids: z.boolean().optional(),
  piscina: z.boolean().optional(),
  sala_jogos: z.boolean().optional(),
  quadra_futsal: z.boolean().optional(),
  quadra_tenis: z.boolean().optional(),
  sauna: z.boolean().optional(),
  outras_areas: z.boolean().optional(),
  outras_areas_descricao: z.string().optional(),
  // Vagas
  tem_vagas_garagem: z.boolean().optional(),
  vagas_identificadas: z.boolean().optional(),
  quantidade_total_vagas: z.number().optional().nullable(),
  vagas_visitantes: z.boolean().optional(),
  quantidade_vagas_visitantes: z.number().optional().nullable(),
  controle_acesso_vagas: z.string().optional(),
  // ESG
  programa_sustentabilidade: z.boolean().optional(),
  descricao_sustentabilidade: z.string().optional(),
  // Documentação
  tem_convencao_ou_estatuto: z.boolean().optional(),
  tem_regimento_interno: z.boolean().optional(),
  data_ultima_atualizacao: z.string().optional(),
  // Acesso e Segurança
  tipo_acesso: z.string().optional(),
  sistema_cameras: z.boolean().optional(),
  porteiro_turno: z.string().optional(),
  quantidade_porteiros: z.number().optional().nullable(),
  sistema_mensageria: z.boolean().optional(),
  outros_funcionarios_descricao: z.string().optional(),
  outros_funcionarios_quantidade: z.number().optional().nullable(),
  seguranca_turno: z.string().optional(),
  empresa_seguranca_nome: z.string().optional(),
  // Observações
  observacoes: z.string().optional(),
});

type CondominioFormData = z.infer<typeof condominioSchema>;

interface CondominioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominio?: Condominio | null;
}

const tiposImovel = ["Casas", "Apartamentos", "Comercial", "Misto"];
const opcoesPorteiroTurno = ["24h", "8h", "nao"];
const opcoesSegurancaTurno = ["24h", "8h", "nao"];

export const CondominioForm = forwardRef<HTMLDivElement, CondominioFormProps>(
  function CondominioForm({ open, onOpenChange, condominio }, ref) {
    const createCondominio = useCreateCondominio();
    const updateCondominio = useUpdateCondominio();
    const isEditing = !!condominio;

    const [arquivoCnpj, setArquivoCnpj] = useState<File | null>(null);
    const [arquivoDocumentacao, setArquivoDocumentacao] = useState<File | null>(null);
    const [arquivoContrato, setArquivoContrato] = useState<File | null>(null);
    const [uploadingCnpj, setUploadingCnpj] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [uploadingContrato, setUploadingContrato] = useState(false);
    const cnpjInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const contratoInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<CondominioFormData>({
      resolver: zodResolver(condominioSchema),
      defaultValues: {
        nome: "",
        endereco: "",
        numero: "",
        bairro: "",
        cidade: "",
        uf: "",
        cep: "",
        tipo_imovel: "",
        quantidade_unidades: null,
        quantidade_blocos: null,
        tem_cnpj: false,
        cnpj: "",
        tem_sindico: false,
        sindico_nome: "",
        sindico_telefone: "",
        sindico_email: "",
        tem_administradora: false,
        nome_administradora: "",
        administradora_site: "",
        administradora_responsavel: "",
        administradora_telefone: "",
        administradora_email: "",
        administradora_tem_contrato: false,
        // Estrutura - Amenidades
        salao_festa: false,
        area_kids: false,
        piscina: false,
        sala_jogos: false,
        quadra_futsal: false,
        quadra_tenis: false,
        sauna: false,
        outras_areas: false,
        outras_areas_descricao: "",
        // Vagas
        tem_vagas_garagem: false,
        vagas_identificadas: false,
        quantidade_total_vagas: null,
        vagas_visitantes: false,
        quantidade_vagas_visitantes: null,
        controle_acesso_vagas: "",
        // ESG
        programa_sustentabilidade: false,
        descricao_sustentabilidade: "",
        // Documentação
        tem_convencao_ou_estatuto: false,
        tem_regimento_interno: false,
        data_ultima_atualizacao: "",
        tipo_acesso: "",
        sistema_cameras: false,
        porteiro_turno: "",
        quantidade_porteiros: null,
        sistema_mensageria: false,
        outros_funcionarios_descricao: "",
        outros_funcionarios_quantidade: null,
        seguranca_turno: "",
        empresa_seguranca_nome: "",
        observacoes: "",
      },
    });

    useEffect(() => {
      if (condominio) {
        const c = condominio as any;
        form.reset({
          nome: condominio.nome,
          endereco: condominio.endereco || "",
          numero: c.numero || "",
          bairro: c.bairro || "",
          cidade: condominio.cidade || "",
          uf: condominio.uf || "",
          cep: c.cep || "",
          tipo_imovel: condominio.tipo_imovel || "",
          quantidade_unidades: condominio.quantidade_unidades,
          quantidade_blocos: condominio.quantidade_blocos,
          tem_cnpj: c.tem_cnpj || false,
          cnpj: condominio.cnpj || "",
          tem_sindico: condominio.tem_sindico || false,
          sindico_nome: condominio.sindico_nome || "",
          sindico_telefone: condominio.sindico_telefone || "",
          sindico_email: condominio.sindico_email || "",
          tem_administradora: condominio.tem_administradora || false,
          nome_administradora: c.nome_administradora || "",
          administradora_site: c.administradora_site || "",
          administradora_responsavel: c.administradora_responsavel || "",
          administradora_telefone: c.administradora_telefone || "",
          administradora_email: c.administradora_email || "",
          administradora_tem_contrato: c.administradora_tem_contrato || false,
          // Estrutura - Amenidades
          salao_festa: c.salao_festa || false,
          area_kids: c.area_kids || false,
          piscina: c.piscina || false,
          sala_jogos: c.sala_jogos || false,
          quadra_futsal: c.quadra_futsal || false,
          quadra_tenis: c.quadra_tenis || false,
          sauna: c.sauna || false,
          outras_areas: c.outras_areas || false,
          outras_areas_descricao: c.outras_areas_descricao || "",
          // Vagas
          tem_vagas_garagem: c.tem_vagas_garagem || false,
          vagas_identificadas: c.vagas_identificadas || false,
          quantidade_total_vagas: c.quantidade_total_vagas,
          vagas_visitantes: c.vagas_visitantes || false,
          quantidade_vagas_visitantes: c.quantidade_vagas_visitantes,
          controle_acesso_vagas: c.controle_acesso_vagas || "",
          // ESG
          programa_sustentabilidade: c.programa_sustentabilidade || false,
          descricao_sustentabilidade: c.descricao_sustentabilidade || "",
          // Documentação
          tem_convencao_ou_estatuto: c.tem_convencao_ou_estatuto || false,
          tem_regimento_interno: c.tem_regimento_interno || false,
          data_ultima_atualizacao: c.data_ultima_atualizacao || "",
          tipo_acesso: c.tipo_acesso || "",
          sistema_cameras: c.sistema_cameras || false,
          porteiro_turno: c.porteiro_turno || "",
          quantidade_porteiros: c.quantidade_porteiros,
          sistema_mensageria: c.sistema_mensageria || false,
          outros_funcionarios_descricao: c.outros_funcionarios_descricao || "",
          outros_funcionarios_quantidade: c.outros_funcionarios_quantidade,
          seguranca_turno: c.seguranca_turno || "",
          empresa_seguranca_nome: c.empresa_seguranca_nome || "",
          observacoes: condominio.observacoes || "",
        });
      } else {
        form.reset({
          nome: "",
          endereco: "",
          numero: "",
          bairro: "",
          cidade: "",
          uf: "",
          cep: "",
          tipo_imovel: "",
          quantidade_unidades: null,
          quantidade_blocos: null,
          tem_cnpj: false,
          cnpj: "",
          tem_sindico: false,
          sindico_nome: "",
          sindico_telefone: "",
          sindico_email: "",
          tem_administradora: false,
          nome_administradora: "",
          administradora_site: "",
          administradora_responsavel: "",
          administradora_telefone: "",
          administradora_email: "",
          administradora_tem_contrato: false,
          // Estrutura - Amenidades
          salao_festa: false,
          area_kids: false,
          piscina: false,
          sala_jogos: false,
          quadra_futsal: false,
          quadra_tenis: false,
          sauna: false,
          outras_areas: false,
          outras_areas_descricao: "",
          // Vagas
          tem_vagas_garagem: false,
          vagas_identificadas: false,
          quantidade_total_vagas: null,
          vagas_visitantes: false,
          quantidade_vagas_visitantes: null,
          controle_acesso_vagas: "",
          // ESG
          programa_sustentabilidade: false,
          descricao_sustentabilidade: "",
          // Documentação
          tem_convencao_ou_estatuto: false,
          tem_regimento_interno: false,
          data_ultima_atualizacao: "",
          tipo_acesso: "",
          sistema_cameras: false,
          porteiro_turno: "",
          quantidade_porteiros: null,
          sistema_mensageria: false,
          outros_funcionarios_descricao: "",
          outros_funcionarios_quantidade: null,
          seguranca_turno: "",
          empresa_seguranca_nome: "",
          observacoes: "",
        });
        setArquivoCnpj(null);
        setArquivoDocumentacao(null);
        setArquivoContrato(null);
      }
    }, [condominio, form]);

    const uploadFile = async (file: File, folder: string): Promise<string | null> => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('anexos')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        toast.error('Erro ao fazer upload do arquivo');
        return null;
      }

      return fileName;
    };

    const onSubmit = async (data: CondominioFormData) => {
      try {
        let arquivoCnpjPath = isEditing ? (condominio as any)?.arquivo_cnpj_path : null;
        let arquivoDocumentacaoPath = isEditing ? (condominio as any)?.arquivo_documentacao_path : null;
        let arquivoContratoPath = isEditing ? (condominio as any)?.administradora_contrato_path : null;

        // Upload arquivo CNPJ se houver
        if (arquivoCnpj) {
          setUploadingCnpj(true);
          const path = await uploadFile(arquivoCnpj, 'cnpj');
          if (path) arquivoCnpjPath = path;
          setUploadingCnpj(false);
        }

        // Upload arquivo documentação se houver
        if (arquivoDocumentacao) {
          setUploadingDoc(true);
          const path = await uploadFile(arquivoDocumentacao, 'documentacao');
          if (path) arquivoDocumentacaoPath = path;
          setUploadingDoc(false);
        }

        // Upload arquivo contrato se houver
        if (arquivoContrato) {
          setUploadingContrato(true);
          const path = await uploadFile(arquivoContrato, 'contratos');
          if (path) arquivoContratoPath = path;
          setUploadingContrato(false);
        }

        const payload = {
          nome: data.nome,
          endereco: data.endereco || null,
          numero: data.numero || null,
          bairro: data.bairro || null,
          cidade: data.cidade || null,
          uf: data.uf || null,
          cep: data.cep || null,
          tipo_imovel: data.tipo_imovel || null,
          quantidade_unidades: data.quantidade_unidades,
          quantidade_blocos: data.quantidade_blocos,
          tem_cnpj: data.tem_cnpj || false,
          cnpj: data.cnpj || null,
          arquivo_cnpj_path: arquivoCnpjPath,
          tem_sindico: data.tem_sindico || false,
          sindico_nome: data.sindico_nome || null,
          sindico_telefone: data.sindico_telefone || null,
          sindico_email: data.sindico_email || null,
          tem_administradora: data.tem_administradora || false,
          nome_administradora: data.nome_administradora || null,
          administradora_site: data.administradora_site || null,
          administradora_responsavel: data.administradora_responsavel || null,
          administradora_telefone: data.administradora_telefone || null,
          administradora_email: data.administradora_email || null,
          administradora_tem_contrato: data.administradora_tem_contrato || false,
          administradora_contrato_path: arquivoContratoPath,
          // Estrutura - Amenidades
          salao_festa: data.salao_festa || false,
          area_kids: data.area_kids || false,
          piscina: data.piscina || false,
          sala_jogos: data.sala_jogos || false,
          quadra_futsal: data.quadra_futsal || false,
          quadra_tenis: data.quadra_tenis || false,
          sauna: data.sauna || false,
          outras_areas: data.outras_areas || false,
          outras_areas_descricao: data.outras_areas_descricao || null,
          // Vagas
          tem_vagas_garagem: data.tem_vagas_garagem || false,
          vagas_identificadas: data.vagas_identificadas || false,
          quantidade_total_vagas: data.quantidade_total_vagas,
          vagas_visitantes: data.vagas_visitantes || false,
          quantidade_vagas_visitantes: data.quantidade_vagas_visitantes,
          controle_acesso_vagas: data.controle_acesso_vagas || null,
          // ESG
          programa_sustentabilidade: data.programa_sustentabilidade || false,
          descricao_sustentabilidade: data.descricao_sustentabilidade || null,
          // Documentação
          tem_convencao_ou_estatuto: data.tem_convencao_ou_estatuto || false,
          tem_regimento_interno: data.tem_regimento_interno || false,
          data_ultima_atualizacao: data.data_ultima_atualizacao || null,
          arquivo_documentacao_path: arquivoDocumentacaoPath,
          tipo_acesso: data.tipo_acesso || null,
          sistema_cameras: data.sistema_cameras || false,
          porteiro_turno: data.porteiro_turno || null,
          quantidade_porteiros: data.quantidade_porteiros,
          sistema_mensageria: data.sistema_mensageria || false,
          outros_funcionarios_descricao: data.outros_funcionarios_descricao || null,
          outros_funcionarios_quantidade: data.outros_funcionarios_quantidade,
          seguranca_turno: data.seguranca_turno || null,
          empresa_seguranca_nome: data.empresa_seguranca_nome || null,
          observacoes: data.observacoes || null,
        };

        if (isEditing && condominio) {
          await updateCondominio.mutateAsync({ id: condominio.id, ...payload });
        } else {
          await createCondominio.mutateAsync(payload);
        }
        form.reset();
        setArquivoCnpj(null);
        setArquivoDocumentacao(null);
        setArquivoContrato(null);
        onOpenChange(false);
      } catch (error) {
        // Error is handled in the mutation
      }
    };

    const temSindico = form.watch("tem_sindico");
    const temCnpj = form.watch("tem_cnpj");
    const temAdministradora = form.watch("tem_administradora");
    const temContratoAdministradora = form.watch("administradora_tem_contrato");
    const segurancaTurno = form.watch("seguranca_turno");
    const outrasAreas = form.watch("outras_areas");
    const programaSustentabilidade = form.watch("programa_sustentabilidade");
    const temVagasGaragem = form.watch("tem_vagas_garagem");
    const vagasVisitantes = form.watch("vagas_visitantes");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cnpj' | 'doc' | 'contrato') => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          toast.error('Apenas arquivos PDF são aceitos');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Arquivo muito grande. Máximo 10MB');
          return;
        }
        if (type === 'cnpj') {
          setArquivoCnpj(file);
        } else if (type === 'contrato') {
          setArquivoContrato(file);
        } else {
          setArquivoDocumentacao(file);
        }
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              {isEditing ? "Editar Condomínio" : "Novo Condomínio"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isEditing ? "Formulário para editar condomínio" : "Formulário para cadastrar novo condomínio"}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-130px)] pr-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados Básicos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Dados Básicos
                  </h3>
                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
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
                      name="tipo_imovel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Imóvel</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[200]" position="popper">
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

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem className="col-span-4">
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, Avenida..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="Nº" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bairro"
                      render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-3">
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
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
                      name="uf"
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
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input placeholder="00000-000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Informações Jurídicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Informações Jurídicas
                  </h3>
                  <Separator />

                  <FormField
                    control={form.control}
                    name="tem_cnpj"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Possui CNPJ</FormLabel>
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

                  {temCnpj && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do CNPJ</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00.000.000/0000-00"
                                value={formatCnpj(field.value || '')}
                                onChange={(e) => field.onChange(unformatCnpj(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <FormLabel>Arquivo CNPJ (PDF)</FormLabel>
                        <div className="mt-2">
                          <input
                            ref={cnpjInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'cnpj')}
                          />
                          {arquivoCnpj ? (
                            <div className="flex items-center gap-2 p-2 border rounded-lg">
                              <span className="text-sm truncate flex-1">{arquivoCnpj.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setArquivoCnpj(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => cnpjInputRef.current?.click()}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Selecionar PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Síndico */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Síndico
                  </h3>
                  <Separator />

                  <FormField
                    control={form.control}
                    name="tem_sindico"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Possui Síndico</FormLabel>
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

                  {temSindico && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="sindico_nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Síndico</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
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
                            <FormLabel>Telefone do Síndico</FormLabel>
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
                            <FormLabel>E-mail do Síndico</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Estrutura */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Estrutura
                  </h3>
                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantidade_blocos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade de Blocos ou Ruas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 4"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantidade_unidades"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade de Unidades</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 120"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Amenidades */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-medium">Áreas Comuns / Amenidades</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <FormField
                        control={form.control}
                        name="salao_festa"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border p-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Salão de Festa</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="area_kids"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border p-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Área Kids</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="piscina"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border p-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Piscina</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sala_jogos"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border p-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Sala de Jogos</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="quadra_futsal"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border p-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Quadra de Futsal</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="quadra_tenis"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border p-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Quadra de Tênis</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sauna"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border p-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Sauna</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="outras_areas"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border p-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Outros</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {outrasAreas && (
                      <FormField
                        control={form.control}
                        name="outras_areas_descricao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição de Outras Áreas</FormLabel>
                            <FormControl>
                              <Input placeholder="Descreva as outras áreas comuns..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Estacionamento */}
                  <div className="space-y-4">
                    <FormLabel className="text-sm font-medium">Estacionamento</FormLabel>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tem_vagas_garagem"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <FormLabel className="text-base">Possui Vagas de Estacionamento</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vagas_identificadas"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <FormLabel className="text-base">Vaga Exclusiva Identificada</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {temVagasGaragem && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="quantidade_total_vagas"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantidade Total de Vagas</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Ex: 120"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="controle_acesso_vagas"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Controle de Acesso às Vagas</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="z-[200]" position="popper">
                                    <SelectItem value="cartao">Cartão</SelectItem>
                                    <SelectItem value="tag">TAG</SelectItem>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
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
                            name="vagas_visitantes"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <FormLabel className="text-base">Vagas para Visitantes</FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {vagasVisitantes && (
                            <FormField
                              control={form.control}
                              name="quantidade_vagas_visitantes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantidade de Vagas para Visitantes</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Ex: 10"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ESG - Sustentabilidade */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    ESG - Sustentabilidade
                  </h3>
                  <Separator />

                  <FormField
                    control={form.control}
                    name="programa_sustentabilidade"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <FormLabel className="text-base">Existe Programa de Sustentabilidade</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {programaSustentabilidade && (
                    <FormField
                      control={form.control}
                      name="descricao_sustentabilidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição do Programa de Sustentabilidade</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva os programas e iniciativas de sustentabilidade..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Infraestrutura */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Infraestrutura
                  </h3>
                  <Separator />

                  <FormField
                    control={form.control}
                    name="tem_administradora"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <FormLabel className="text-base">Possui Administradora</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {temAdministradora && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="nome_administradora"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Administradora</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da administradora" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="administradora_site"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site</FormLabel>
                              <FormControl>
                                <Input placeholder="www.exemplo.com.br" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="administradora_responsavel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Responsável</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do responsável" {...field} />
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

                        <FormField
                          control={form.control}
                          name="administradora_email"
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

                      {/* Contrato com Administradora */}
                      <FormField
                        control={form.control}
                        name="administradora_tem_contrato"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <FormLabel className="text-base">Existe Contrato</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {temContratoAdministradora && (
                        <div className="space-y-2">
                          <FormLabel>Anexar Contrato (PDF)</FormLabel>
                          <div
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50 ${arquivoContrato ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                              }`}
                            onClick={() => contratoInputRef.current?.click()}
                          >
                            <input
                              ref={contratoInputRef}
                              type="file"
                              className="hidden"
                              accept=".pdf"
                              onChange={(e) => handleFileChange(e, 'contrato')}
                              disabled={uploadingContrato}
                            />
                            {uploadingContrato ? (
                              <span className="text-muted-foreground">Enviando...</span>
                            ) : arquivoContrato ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-sm font-medium text-primary">{arquivoContrato.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setArquivoContrato(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                <Upload className="h-6 w-6" />
                                <span className="text-sm">Clique para selecionar o contrato</span>
                              </div>
                            )}
                          </div>
                          {isEditing && (condominio as any)?.administradora_contrato_path && !arquivoContrato && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground flex-1">
                                Arquivo atual: {(condominio as any).administradora_contrato_path.split('/').pop()}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const btn = e.currentTarget;
                                  btn.disabled = true;
                                  try {
                                    const { data, error } = await supabase.storage
                                      .from('anexos')
                                      .createSignedUrl((condominio as any).administradora_contrato_path, 3600);
                                    if (error || !data) {
                                      toast.error('Erro ao abrir arquivo');
                                      return;
                                    }
                                    window.open(data.signedUrl, '_blank');
                                  } catch {
                                    toast.error('Erro ao abrir arquivo');
                                  } finally {
                                    btn.disabled = false;
                                  }
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Visualizar
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Documentação */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Documentação
                  </h3>
                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tem_convencao_ou_estatuto"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <FormLabel className="text-base">Possui Convenção ou Estatuto</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tem_regimento_interno"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <FormLabel className="text-base">Possui Regimento Interno</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data_ultima_atualizacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Última Atualização</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>Arquivo Documentação (PDF)</FormLabel>
                      <div className="mt-2">
                        <input
                          ref={docInputRef}
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'doc')}
                        />
                        {arquivoDocumentacao ? (
                          <div className="flex items-center gap-2 p-2 border rounded-lg">
                            <span className="text-sm truncate flex-1">{arquivoDocumentacao.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setArquivoDocumentacao(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => docInputRef.current?.click()}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acesso e Segurança */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Acesso e Segurança
                  </h3>
                  <Separator />

                  <FormField
                    control={form.control}
                    name="tipo_acesso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Acesso</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o tipo de acesso ao condomínio..."
                            className="min-h-[60px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sistema_cameras"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <FormLabel className="text-base">Sistema de Câmeras</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sistema_mensageria"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <FormLabel className="text-base">Sistema de Mensageria</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="porteiro_turno"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porteiro</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[200]" position="popper">
                              <SelectItem value="24h">24h</SelectItem>
                              <SelectItem value="8h">8h</SelectItem>
                              <SelectItem value="nao">Não possui</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantidade_porteiros"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade de Porteiros</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 2"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="seguranca_turno"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segurança</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[200]" position="popper">
                              <SelectItem value="24h">24h</SelectItem>
                              <SelectItem value="8h">8h</SelectItem>
                              <SelectItem value="nao">Não possui</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {segurancaTurno && segurancaTurno !== "nao" && (
                      <FormField
                        control={form.control}
                        name="empresa_seguranca_nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Empresa de Segurança</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="outros_funcionarios_descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outros Funcionários (Descrição)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Zelador, Faxineira..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="outros_funcionarios_quantidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade de Outros Funcionários</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 3"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Observações
                  </h3>
                  <Separator />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Observações gerais sobre o condomínio..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Anexos - apenas quando editando */}
                {isEditing && condominio && (
                  <AnexosSection
                    entidadeTipo="condominio"
                    entidadeId={condominio.id}
                  />
                )}

                {/* Botões */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    disabled={createCondominio.isPending || updateCondominio.isPending || uploadingCnpj || uploadingDoc}
                  >
                    {createCondominio.isPending || updateCondominio.isPending || uploadingCnpj || uploadingDoc
                      ? "Salvando..."
                      : isEditing
                        ? "Salvar Alterações"
                        : "Cadastrar Condomínio"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
