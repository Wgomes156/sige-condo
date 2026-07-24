import { useEffect, useRef, useState, useCallback } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Clock, History, Pencil, Trash2,
  FileText, ExternalLink, Paperclip, X, Upload, User, UserCheck,
  Loader2, Calendar, Building2, MapPin, Shield, Info,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateAtendimento, useDeleteAtendimento, type Atendimento } from "@/hooks/useAtendimentos";
import {
  useAtendimentoHistorico,
  useCreateAtendimentoHistorico,
  useUpdateAtendimentoHistorico,
  useDeleteAtendimentoHistorico,
  type AtendimentoHistorico,
} from "@/hooks/useAtendimentoHistorico";
import {
  useAnexos, useUploadAnexo, useDeleteAnexo,
  getAnexoUrl, formatFileSize, type Anexo,
} from "@/hooks/useAnexos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCondominio, useUpdateCondominio } from "@/hooks/useCondominios";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const safeFormatDate = (v?: string | null) => {
  try {
    if (!v) return "S/D";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "S/D" : format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch { return "S/D"; }
};

const safeHora = (h?: string | null) => {
  if (!h) return "00:00";
  return h.length > 5 ? h.slice(0, 5) : h;
};

const historicoStatusColor = (s: string) => {
  switch (s) {
    case "Aguardando": return "bg-orange-500/20 text-orange-700 border-orange-500/30";
    case "Em andamento": return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "Contrato fechado": return "bg-green-500/20 text-green-700 border-green-500/30";
    case "Encerrado sem contrato": return "bg-red-500/20 text-red-700 border-red-500/30";
    default: return "bg-gray-500/10 text-gray-700 border-gray-300";
  }
};

const CANAIS = ["Telefone", "WhatsApp", "E-mail", "Presencial", "Chat", "Redes Sociais"];
const STATUS = ["Em andamento", "Tem demanda", "Finalizado", "Aguardando retorno", "Com Contrato", "Finalizado sem contrato"];
const MOTIVOS = ["Dúvida", "Reclamação", "Solicitação de serviço", "Informação", "Orçamento", "Cancelamento", "Outros"];
const H_STATUS = ["Aguardando", "Em andamento", "Contrato fechado", "Encerrado sem contrato", "Outros"];

const UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];
const TIPOS_IMOVEL = [
  "Residencial Vertical (Apartamentos)",
  "Residencial Horizontal (Casas)",
  "Comercial",
  "Misto (Residencial + Comercial)",
  "Industrial"
];

const schema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  operador_nome: z.string().min(1, "Operador é obrigatório"),
  canal: z.string().min(1, "Canal é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
  motivo: z.string().min(1, "Motivo é obrigatório"),
  observacoes: z.string().optional(),
  cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
  cliente_telefone: z.string().min(1, "Telefone do cliente é obrigatório"),
  cliente_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  condominio_nome: z.string().min(1, "Nome do condomínio é obrigatório"),
  // Campos do Condomínio
  condominio_cnpj: z.string().optional(),
  condominio_endereco: z.string().optional().or(z.literal("")),
  condominio_cidade: z.string().optional().or(z.literal("")),
  condominio_uf: z.string().optional().or(z.literal("")),
  condominio_tipo_imovel: z.string().optional().or(z.literal("")),
  condominio_quantidade_unidades: z.coerce.number().optional().default(0),
  condominio_quantidade_blocos: z.coerce.number().optional().default(0),
  // Campos do Síndico
  condominio_tem_sindico: z.boolean().default(false),
  condominio_sindico_nome: z.string().optional().or(z.literal("")),
  condominio_sindico_telefone: z.string().optional().or(z.literal("")),
  // Administradora
  condominio_tem_administradora: z.boolean().default(false),
  condominio_nome_administradora: z.string().optional().or(z.literal("")),
  // Infraestrutura
  condominio_tem_seguranca: z.boolean().default(false),
  condominio_tem_porteiro: z.string().optional().or(z.literal("")),
  condominio_tem_monitoramento: z.boolean().default(false),
}).refine((data) => {
  if (data.condominio_tem_sindico && (!data.condominio_sindico_nome || data.condominio_sindico_nome.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Nome do síndico é obrigatório quando há síndico",
  path: ["condominio_sindico_nome"],
});

type FormData = z.infer<typeof schema>;

/* ── Subs ────────────────────────────────────────────────────────────────── */

function EditarHistoricoAnexos({ id, allowDelete }: { id: string; allowDelete?: boolean }) {
  const { data: anexos } = useAnexos("atendimento_historico", id);
  const del = useDeleteAnexo();
  if (!anexos?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {anexos.map(a => (
        <div key={a.id} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 bg-white shadow-sm hover:border-orange-200 transition-colors">
          <FileText className="h-3 w-3 text-red-500" />
          <button type="button" className="text-[11px] font-bold uppercase text-slate-700 hover:text-orange-600"
            onClick={async () => { const u = await getAnexoUrl(a.storage_path); if (u) window.open(u, "_blank"); }}>
            Documento PDF
          </button>
          {allowDelete && <button type="button" onClick={() => { if (confirm("Remover?")) del.mutate(a); }} className="text-slate-400 hover:text-red-500"><X className="h-3 w-3" /></button>}
        </div>
      ))}
    </div>
  );
}

function PdfField({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Paperclip className="h-3 w-3" /> Anexar Documento (PDF)</label>
      {value ? (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <FileText className="h-6 w-6 text-red-500" />
          <div className="flex-1 min-w-0"><p className="text-xs font-bold truncate text-red-900">{value.name}</p><p className="text-[10px] text-red-600">{formatFileSize(value.size)}</p></div>
          <button type="button" onClick={() => onChange(null)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} className="w-full h-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center gap-2 text-slate-400 hover:border-orange-500 hover:text-orange-600 transition-all">
          <Upload className="h-4 w-4" /> <span className="text-xs font-bold uppercase transition-all">Selecionar PDF</span>
        </button>
      )}
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
    </div>
  );
}

/* ── Principal ───────────────────────────────────────────────────────────── */

export function EditarAtendimentoDialog({ open, onOpenChange, atendimento }: { open: boolean; onOpenChange: (v: boolean) => void; atendimento: Atendimento | null; }) {
  console.log("[DEBUG] EditarAtendimentoDialog: Abrindo?", open, "ID:", atendimento?.id);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const updateAtendimento = useUpdateAtendimento();
  const deleteAtendimento = useDeleteAtendimento();
  const { data: historico, isLoading: historicoLoading, error: historicoError } = useAtendimentoHistorico(atendimento?.id);
  const createHistorico = useCreateAtendimentoHistorico();
  const updateHistorico = useUpdateAtendimentoHistorico();
  const deleteHistorico = useDeleteAtendimentoHistorico();
  const uploadAnexo = useUploadAnexo();
  const { data: condominio, isLoading: loadingCondominio } = useCondominio(atendimento?.condominio_id || null);
  const updateCondominio = useUpdateCondominio();

  // Debug: log quando historico muda
  useEffect(() => {
    console.log("[DEBUG] Histórico atualizado:", { count: historico?.length, loading: historicoLoading, error: historicoError, atendimentoId: atendimento?.id });
  }, [historico, historicoLoading, historicoError, atendimento?.id]);

  // Estado consolidado do formulário de histórico — atualização atômica evita
  // o bug onde clicar no lápis de um 2º/3º registro exibia dados do 1º.
  const [hForm, setHForm] = useState<{
    show: boolean;
    editingId: string | null;
    data: string;
    hora: string;
    dets: string;
    status: string;
    pdf: File | null;
  }>({ show: false, editingId: null, data: "", hora: "", dets: "", status: "", pdf: null });

  const resetHForm = () => setHForm({ show: false, editingId: null, data: "", hora: "", dets: "", status: "", pdf: null });

  // defaultValues usa os dados do atendimento diretamente.
  // Com o key incremental no pai, este componente remonta a cada clique no lápis,
  // portanto useForm sempre inicializa com os dados do registro correto.
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      data: atendimento?.data || "",
      hora: safeHora(atendimento?.hora),
      operador_nome: atendimento?.operador_nome || "",
      canal: atendimento?.canal || "",
      status: atendimento?.status || "",
      motivo: atendimento?.motivo || "",
      observacoes: atendimento?.observacoes || "",
      cliente_nome: atendimento?.cliente_nome || "",
      cliente_telefone: atendimento?.cliente_telefone || "",
      cliente_email: atendimento?.cliente_email || "",
      condominio_nome: atendimento?.condominio_nome || "",
      // Condominio
      condominio_cnpj: condominio?.cnpj || "",
      condominio_endereco: condominio?.endereco || "",
      condominio_cidade: condominio?.cidade || "",
      condominio_uf: condominio?.uf || "",
      condominio_tipo_imovel: condominio?.tipo_imovel || "",
      condominio_quantidade_unidades: condominio?.quantidade_unidades || 0,
      condominio_quantidade_blocos: condominio?.quantidade_blocos || 0,
      condominio_tem_sindico: condominio?.tem_sindico || false,
      condominio_sindico_nome: condominio?.sindico_nome || "",
      condominio_sindico_telefone: condominio?.sindico_telefone || "",
      condominio_tem_administradora: condominio?.tem_administradora || false,
      condominio_nome_administradora: condominio?.nome_administradora || "",
      condominio_tem_seguranca: condominio?.tem_seguranca || false,
      condominio_tem_porteiro: condominio?.tem_porteiro || "Não",
      condominio_tem_monitoramento: condominio?.tem_monitoramento || false,
    }
  });

  useEffect(() => {
    if (open && atendimento) {
      form.reset({
        data: atendimento.data || "",
        hora: safeHora(atendimento.hora),
        operador_nome: atendimento.operador_nome || "",
        canal: atendimento.canal || "",
        status: atendimento.status || "",
        motivo: atendimento.motivo || "",
        observacoes: atendimento.observacoes || "",
        cliente_nome: atendimento.cliente_nome || "",
        cliente_telefone: atendimento.cliente_telefone || "",
        cliente_email: atendimento.cliente_email || "",
        condominio_nome: atendimento.condominio_nome || "",
        condominio_cnpj: condominio?.cnpj || "",
        condominio_endereco: condominio?.endereco || "",
        condominio_cidade: condominio?.cidade || "",
        condominio_uf: condominio?.uf || "",
        condominio_tipo_imovel: condominio?.tipo_imovel || "",
        condominio_quantidade_unidades: condominio?.quantidade_unidades || 0,
        condominio_quantidade_blocos: condominio?.quantidade_blocos || 0,
        condominio_tem_sindico: condominio?.tem_sindico || false,
        condominio_sindico_nome: condominio?.sindico_nome || "",
        condominio_sindico_telefone: condominio?.sindico_telefone || "",
        condominio_tem_administradora: condominio?.tem_administradora || false,
        condominio_nome_administradora: condominio?.nome_administradora || "",
        condominio_tem_seguranca: condominio?.tem_seguranca || false,
        condominio_tem_porteiro: condominio?.tem_porteiro || "Não",
        condominio_tem_monitoramento: condominio?.tem_monitoramento || false,
      });
      resetHForm();
    }
  }, [open, atendimento, condominio, form]);

  if (!atendimento) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-[800px]">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const saveHistorico = async () => {
    if (!atendimento || !hForm.data || !hForm.hora || !hForm.dets || !hForm.status) {
      console.warn("[saveHistorico] Campos obrigatórios não preenchidos:", {
        atendimento: !!atendimento,
        data: hForm.data,
        hora: hForm.hora,
        dets: hForm.dets,
        status: hForm.status,
      });
      return;
    }
    try {
      let id = hForm.editingId;
      if (hForm.editingId) {
        console.log("[saveHistorico] Atualizando histórico:", hForm.editingId);
        await updateHistorico.mutateAsync({ id: hForm.editingId, data: hForm.data, hora: hForm.hora, detalhes: hForm.dets, status: hForm.status });
      } else {
        console.log("[saveHistorico] Criando novo histórico para atendimento:", atendimento.id);
        const r = await createHistorico.mutateAsync({ atendimento_id: atendimento.id, data: hForm.data, hora: hForm.hora, detalhes: hForm.dets, status: hForm.status });
        console.log("[saveHistorico] Histórico criado com sucesso, id:", r.id);
        id = r.id;
      }
      if (hForm.pdf && id) {
        console.log("[saveHistorico] Fazendo upload de anexo para histórico:", id);
        await uploadAnexo.mutateAsync({ file: hForm.pdf, entidadeTipo: "atendimento_historico", entidadeId: id });
      }
      console.log("[saveHistorico] Resetando formulário. Total histórico atual:", historico?.length);
      // Força invalidação extra para garantir que a lista se atualize
      await queryClient.invalidateQueries({ queryKey: ["atendimento_historico", atendimento.id] });
      console.log("[saveHistorico] Cache invalidado, aguardando refetch...");
      resetHForm();
    } catch (err) {
      console.error("[saveHistorico] ERRO ao salvar histórico:", err);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!atendimento) return;

    const currentCondominioId = atendimento.condominio_id;

    // Atualiza dados do condomínio somente se ele já está vinculado ao atendimento.
    // Nunca cria um novo condomínio a partir do formulário de atendimento.
    // Isolado em seu próprio try/catch: usuários sem permissão de RLS para editar
    // condominios (ex.: Operador dono do atendimento, mas sem o condomínio atribuído)
    // não podem deixar essa etapa bloquear o salvamento do atendimento em si.
    if (currentCondominioId) {
      try {
        await updateCondominio.mutateAsync({
          id: currentCondominioId,
          nome: data.condominio_nome,
          cnpj: data.condominio_cnpj,
          endereco: data.condominio_endereco,
          cidade: data.condominio_cidade,
          uf: data.condominio_uf,
          tipo_imovel: data.condominio_tipo_imovel,
          quantidade_unidades: data.condominio_quantidade_unidades,
          quantidade_blocos: data.condominio_quantidade_blocos,
          tem_sindico: data.condominio_tem_sindico,
          sindico_nome: data.condominio_tem_sindico ? data.condominio_sindico_nome : null,
          sindico_telefone: data.condominio_tem_sindico ? data.condominio_sindico_telefone : null,
          tem_administradora: data.condominio_tem_administradora,
          nome_administradora: data.condominio_tem_administradora ? data.condominio_nome_administradora : null,
          tem_seguranca: data.condominio_tem_seguranca,
          tem_porteiro: data.condominio_tem_porteiro,
          tem_monitoramento: data.condominio_tem_monitoramento,
        });
      } catch (error) {
        console.error("[onSubmit] Erro ao salvar dados do condomínio (atendimento será salvo mesmo assim):", error);
      }
    }

    try {
      await updateAtendimento.mutateAsync({
        id: atendimento.id,
        data: data.data,
        hora: data.hora,
        operador_nome: data.operador_nome,
        canal: data.canal,
        status: data.status,
        motivo: data.motivo,
        observacoes: data.observacoes,
        cliente_nome: data.cliente_nome,
        cliente_telefone: data.cliente_telefone,
        cliente_email: data.cliente_email,
        condominio_nome: data.condominio_nome,
        condominio_id: currentCondominioId,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("[onSubmit] Erro ao salvar atendimento:", error);
    }
  };

  const saving = createHistorico.isPending || updateHistorico.isPending || uploadAnexo.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent hideClose side={isMobile ? "bottom" : "right"} className={cn("flex flex-col p-0 gap-0", isMobile ? "h-[95vh]" : "w-full sm:max-w-[800px]")}>
        <SheetHeader className="px-6 py-4 border-b bg-orange-50 shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-orange-600" />
              Editar Atendimento
            </SheetTitle>
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Interface Atualizada</span>
          </div>
          <div className="flex gap-2">
            {atendimento && (
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold" 
                onClick={async () => {
                  if (confirm("Tem certeza que deseja EXCLUIR este atendimento permanentemente? Esta ação não pode ser desfeita.")) {
                    await deleteAtendimento.mutateAsync(atendimento);
                    onOpenChange(false);
                  }
                }}
                disabled={deleteAtendimento.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteAtendimento.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            )}
            <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Form {...form}>
            <form id="edit-atendimento-form" onSubmit={form.handleSubmit(onSubmit, (err) => console.error("[Form] Erros de validação:", err))} className="space-y-6">
              <Accordion type="multiple" defaultValue={["cliente", "atendimento"]} className="space-y-4">
                {/* Seção: Dados do Cliente */}
                <AccordionItem value="cliente" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
                  <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Dados do Cliente</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 space-y-4">
                    <FormField control={form.control} name="cliente_nome" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase">Nome do Cliente *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="cliente_telefone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase">Telefone *</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="cliente_email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase">E-mail</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Seção: Dados do Condomínio */}
                <AccordionItem value="condominio" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
                  <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Dados do Condomínio</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="condominio_nome" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase">Nome do Condomínio *</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="condominio_cnpj" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase">CNPJ</FormLabel>
                          <FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    
                    <FormField control={form.control} name="condominio_endereco" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase">Endereço *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="condominio_cidade" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase">Cidade *</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="condominio_uf" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase">UF *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger></FormControl>
                            <SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="condominio_tipo_imovel" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase">Tipo de Imóvel *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger></FormControl>
                          <SelectContent>{TIPOS_IMOVEL.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="condominio_quantidade_unidades" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase">Quantidade de Unidades *</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="condominio_quantidade_blocos" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase">Quantidade de Blocos *</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Seção: Síndico */}
                <AccordionItem value="sindico" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
                  <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Síndico</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 space-y-4">
                    <FormField control={form.control} name="condominio_tem_sindico" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-slate-50/50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-bold uppercase">Tem Síndico?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />

                    {form.watch("condominio_tem_sindico") && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <FormField control={form.control} name="condominio_sindico_nome" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase">Nome do Síndico *</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="condominio_sindico_telefone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase">Telefone</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Seção: Administradora */}
                <AccordionItem value="administradora" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
                  <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Administradora</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 space-y-4">
                    <FormField control={form.control} name="condominio_tem_administradora" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-slate-50/50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-bold uppercase">Tem Administradora?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />

                    {form.watch("condominio_tem_administradora") && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <FormField control={form.control} name="condominio_nome_administradora" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase">Nome da Administradora</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Seção: Infraestrutura */}
                <AccordionItem value="infraestrutura" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
                  <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Infraestrutura</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="condominio_tem_seguranca" render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-slate-50/50">
                          <FormLabel className="text-xs font-bold uppercase">Segurança Patrimonial?</FormLabel>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="condominio_tem_monitoramento" render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-slate-50/50">
                          <FormLabel className="text-xs font-bold uppercase">Monitoramento (Câmeras)?</FormLabel>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="condominio_tem_porteiro" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase">Portaria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Não">Não possui</SelectItem>
                            <SelectItem value="Sim 24h">Sim, 24h</SelectItem>
                            <SelectItem value="Sim 12h">Sim, 12h</SelectItem>
                            <SelectItem value="Sim 8h">Sim, Horário comercial</SelectItem>
                            <SelectItem value="Remota">Portaria Remota</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </AccordionContent>
                </AccordionItem>

                {/* Seção: Detalhes do Atendimento */}
                <AccordionItem value="atendimento" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
                  <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Detalhes do Atendimento</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="data" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold uppercase">Data *</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="hora" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold uppercase">Hora *</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold uppercase">Status *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select></FormItem>
                      )} />
                      <FormField control={form.control} name="canal" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold uppercase">Canal *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{CANAIS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="motivo" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-bold uppercase">Motivo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{MOTIVOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select></FormItem>
                    )} />
                    <FormField control={form.control} name="operador_nome" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-bold uppercase">Operador *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="observacoes" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-bold uppercase">Observações Gerais</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>
                    )} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </form>
          </Form>

          <Separator className="my-8" />

          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-orange-500" />
                Histórico do Atendimento ({historico?.length || 0})
              </h3>
              <Button type="button" size="sm" onClick={() => setHForm({ show: true, editingId: null, data: "", hora: "", dets: "", status: "", pdf: null })} className="bg-orange-500 text-white font-bold h-9">
                <Plus className="h-4 w-4 mr-1" /> ADICIONAR REGISTRO
              </Button>
            </div>

            {hForm.show && !hForm.editingId && (
              <div className="bg-white rounded-xl border-2 border-orange-200 p-5 space-y-4 shadow-md animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 text-orange-600 font-bold text-sm mb-2">
                  <Plus className="h-4 w-4" />
                  NOVO REGISTRO NO HISTÓRICO
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-slate-500">Data do Evento</label>
                    <Input type="date" value={hForm.data} onChange={e => setHForm(prev => ({ ...prev, data: e.target.value }))} className="border-slate-300 focus:border-orange-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-slate-500">Hora</label>
                    <Input type="time" value={hForm.hora} onChange={e => setHForm(prev => ({ ...prev, hora: e.target.value }))} className="border-slate-300 focus:border-orange-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-slate-500">Status da Etapa</label>
                    <select value={hForm.status} onChange={e => setHForm(prev => ({ ...prev, status: e.target.value }))} className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                      <option value="">Selecione o status...</option>
                      {H_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Detalhes da Interação</label>
                  <Textarea value={hForm.dets} onChange={e => setHForm(prev => ({ ...prev, dets: e.target.value }))} placeholder="Descreva o que foi tratado com o cliente neste momento..." className="min-h-[100px] border-slate-300 focus:border-orange-500" />
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 border-dashed">
                  <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1 mb-3">
                    <Paperclip className="h-3 w-3 text-orange-500" />
                    Documento de Comprovação (PDF)
                  </label>
                  <PdfField value={hForm.pdf} onChange={f => setHForm(prev => ({ ...prev, pdf: f }))} />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                  <Button type="button" variant="outline" size="sm" onClick={resetHForm} className="h-10 px-4">Cancelar</Button>
                  <Button type="button" size="sm" onClick={saveHistorico} disabled={saving} className="bg-orange-600 text-white font-bold px-8 h-10 shadow-lg hover:bg-orange-700">
                    {saving ? "Salvando..." : "Salvar no Histórico"}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {historicoLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
                  <span className="text-sm text-slate-500">Carregando histórico...</span>
                </div>
              )}
              {historicoError && (
                <div className="text-center py-8 text-red-500 text-sm">
                  Erro ao carregar histórico. Verifique o console para detalhes.
                </div>
              )}
              {!historicoLoading && !historicoError && historico?.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum registro no histórico. Clique em "Adicionar Registro" para começar.
                </div>
              )}
              {historico?.map(item => (
                hForm.show && hForm.editingId === item.id ? (
                  <div key={item.id} className="bg-white rounded-xl border-2 border-orange-200 p-5 space-y-4 shadow-md animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-sm mb-2">
                      <Pencil className="h-4 w-4" />
                      EDITANDO REGISTRO SELECIONADO
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase text-slate-500">Data do Evento</label>
                        <Input type="date" value={hForm.data} onChange={e => setHForm(prev => ({ ...prev, data: e.target.value }))} className="border-slate-300 focus:border-orange-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase text-slate-500">Hora</label>
                        <Input type="time" value={hForm.hora} onChange={e => setHForm(prev => ({ ...prev, hora: e.target.value }))} className="border-slate-300 focus:border-orange-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase text-slate-500">Status da Etapa</label>
                        <select value={hForm.status} onChange={e => setHForm(prev => ({ ...prev, status: e.target.value }))} className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
                          <option value="">Selecione o status...</option>
                          {H_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-slate-500">Detalhes da Interação</label>
                      <Textarea value={hForm.dets} onChange={e => setHForm(prev => ({ ...prev, dets: e.target.value }))} placeholder="Descreva o que foi tratado com o cliente neste momento..." className="min-h-[100px] border-slate-300 focus:border-orange-500" />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 border-dashed">
                      <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1 mb-3">
                        <Paperclip className="h-3 w-3 text-orange-500" />
                        Documento de Comprovação (PDF)
                      </label>
                      <PdfField value={hForm.pdf} onChange={f => setHForm(prev => ({ ...prev, pdf: f }))} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                      <Button type="button" variant="outline" size="sm" onClick={resetHForm} className="h-10 px-4">Cancelar</Button>
                      <Button type="button" size="sm" onClick={saveHistorico} disabled={saving} className="bg-orange-600 text-white font-bold px-8 h-10 shadow-lg hover:bg-orange-700">
                        {saving ? "Salvando..." : "Atualizar Histórico"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className="bg-white rounded-xl border p-4 shadow-sm hover:border-orange-200 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="font-bold text-sm text-slate-800">{safeFormatDate(item.data)} às {safeHora(item.hora)}</span>
                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0.5", historicoStatusColor(item.status))}>{item.status}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-orange-600 hover:bg-orange-50" onClick={() => setHForm({ show: true, editingId: item.id, data: item.data || "", hora: safeHora(item.hora), dets: item.detalhes || "", status: item.status || "", pdf: null })}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => { if (confirm("Excluir?")) deleteHistorico.mutate(item); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border-l-4 border-orange-500 italic">"{item.detalhes || "—"}"</p>
                    <EditarHistoricoAnexos id={item.id} allowDelete />
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-white flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" className="h-11 px-6 font-semibold" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            type="submit" 
            form="edit-atendimento-form"
            variant="default" 
            className="h-11 px-8 font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg"
            disabled={updateAtendimento.isPending}
          >
            {updateAtendimento.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
