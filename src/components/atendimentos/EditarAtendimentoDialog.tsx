import { useEffect, useRef, useState } from "react";
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
  FileText, ExternalLink, Paperclip, X, Upload, UserCheck,
  Loader2, Calendar,
} from "lucide-react";
import { useUpdateAtendimento, type Atendimento } from "@/hooks/useAtendimentos";
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
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

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

const schema = z.object({
  data: z.string().min(1),
  hora: z.string().min(1),
  operador_nome: z.string().min(1),
  canal: z.string().min(1),
  status: z.string().min(1),
  motivo: z.string().min(1),
  observacoes: z.string().optional(),
  cliente_nome: z.string().min(1),
  cliente_telefone: z.string().min(1),
  cliente_email: z.string().email().optional().or(z.literal("")),
  condominio_nome: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

/* ── Subs ────────────────────────────────────────────────────────────────── */

function HistoricoAnexos({ id, allowDelete }: { id: string; allowDelete?: boolean }) {
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
  const updateAtendimento = useUpdateAtendimento();
  const { data: historico } = useAtendimentoHistorico(atendimento?.id);
  const createHistorico = useCreateAtendimentoHistorico();
  const updateHistorico = useUpdateAtendimentoHistorico();
  const deleteHistorico = useDeleteAtendimentoHistorico();
  const uploadAnexo = useUploadAnexo();

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
      });
      resetHForm();
    }
  }, [open, atendimento, form]);

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
    if (!atendimento || !hForm.data || !hForm.hora || !hForm.dets || !hForm.status) return;
    try {
      let id = hForm.editingId;
      if (hForm.editingId) {
        await updateHistorico.mutateAsync({ id: hForm.editingId, data: hForm.data, hora: hForm.hora, detalhes: hForm.dets, status: hForm.status });
      } else {
        const r = await createHistorico.mutateAsync({ atendimento_id: atendimento.id, data: hForm.data, hora: hForm.hora, detalhes: hForm.dets, status: hForm.status });
        id = r.id;
      }
      if (hForm.pdf && id) await uploadAnexo.mutateAsync({ file: hForm.pdf, entidadeTipo: "atendimento_historico", entidadeId: id });
      resetHForm();
    } catch { }
  };

  const onSubmit = async (data: FormData) => {
    if (!atendimento) return;
    await updateAtendimento.mutateAsync({ id: atendimento.id, ...data });
    onOpenChange(false);
  };

  const saving = createHistorico.isPending || updateHistorico.isPending || uploadAnexo.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={cn("flex flex-col p-0 gap-0", isMobile ? "h-[95vh]" : "w-full sm:max-w-[800px]")}>
        <SheetHeader className="px-6 py-4 border-b bg-orange-50 shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-orange-600" />
              Editar Atendimento
            </SheetTitle>
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Interface Atualizada</span>
          </div>
          <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-8">
          <Form {...form}>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField control={form.control} name="data" render={({ field }) => (<FormItem><FormLabel>Data *</FormLabel><Input type="date" {...field} /></FormItem>)} />
                <FormField control={form.control} name="hora" render={({ field }) => (<FormItem><FormLabel>Hora *</FormLabel><Input type="time" {...field} /></FormItem>)} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="cliente_nome" render={({ field }) => (<FormItem><FormLabel>Nome do Cliente *</FormLabel><Input {...field} /></FormItem>)} />
              <FormField control={form.control} name="observacoes" render={({ field }) => (<FormItem><FormLabel>Observações Gerais</FormLabel><Textarea rows={3} {...field} /></FormItem>)} />
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
                    <HistoricoAnexos id={item.id} allowDelete />
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-white flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" className="h-11 px-6 font-semibold" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" variant="default" className="h-11 px-8 font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg"
            onClick={form.handleSubmit(onSubmit)} disabled={updateAtendimento.isPending}>
            {updateAtendimento.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
