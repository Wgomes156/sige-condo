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

const safeHora = (v?: string | null) => (v ? v.slice(0, 5) : "");

const historicoStatusColor = (s: string) => {
  switch (s) {
    case "Aguardando":              return "bg-orange-500/20 text-orange-700 border-orange-500/30";
    case "Em andamento":           return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "Contrato fechado":       return "bg-green-500/20 text-green-700 border-green-500/30";
    case "Encerrado sem contrato": return "bg-red-500/20 text-red-700 border-red-500/30";
    default:                       return "bg-gray-500/20 text-gray-700 border-gray-500/30";
  }
};

/* ── Constantes ─────────────────────────────────────────────────────────── */
const CANAIS   = ["Telefone","WhatsApp","E-mail","Presencial","Chat","Redes Sociais"];
const STATUS   = ["Em andamento","Tem demanda","Finalizado","Aguardando retorno","Com Contrato","Finalizado sem contrato"];
const MOTIVOS  = ["Dúvida","Reclamação","Solicitação de serviço","Informação","Orçamento","Cancelamento","Outros"];
const H_STATUS = ["Aguardando","Em andamento","Contrato fechado","Encerrado sem contrato","Outros"];

/* ── Schema ──────────────────────────────────────────────────────────────── */
const schema = z.object({
  data:             z.string().min(1),
  hora:             z.string().min(1),
  operador_nome:    z.string().min(1),
  canal:            z.string().min(1),
  status:           z.string().min(1),
  motivo:           z.string().min(1),
  observacoes:      z.string().optional(),
  cliente_nome:     z.string().min(1),
  cliente_telefone: z.string().min(1),
  cliente_email:    z.string().email().optional().or(z.literal("")),
  condominio_nome:  z.string().min(1),
});
type FormData = z.infer<typeof schema>;

/* ── Sub: Anexos ─────────────────────────────────────────────────────────── */
function HistoricoAnexos({ id, allowDelete }: { id: string; allowDelete?: boolean }) {
  const { data: anexos, isLoading } = useAnexos("atendimento_historico", id);
  const del = useDeleteAnexo();
  if (isLoading || !anexos?.length) return null;
  const open = async (path: string) => { const u = await getAnexoUrl(path); if (u) window.open(u, "_blank"); };
  const remove = async (a: Anexo) => { if (confirm(`Remover "${a.nome_arquivo}"?`)) await del.mutateAsync(a); };
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {anexos.map(a => (
        <div key={a.id} className="flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] bg-muted/20">
          <FileText className="h-3 w-3 text-red-500 shrink-0" />
          <button type="button" className="max-w-[120px] truncate hover:underline" onClick={() => open(a.storage_path)}>{a.nome_arquivo}</button>
          <ExternalLink className="h-2.5 w-2.5 opacity-40 shrink-0" />
          {allowDelete && <button type="button" className="ml-0.5 text-red-400 hover:text-red-600" onClick={() => remove(a)} disabled={del.isPending}><X className="h-2.5 w-2.5" /></button>}
        </div>
      ))}
    </div>
  );
}

/* ── Sub: PDF Upload ─────────────────────────────────────────────────────── */
function PdfField({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-xs font-bold uppercase text-muted-foreground mb-1.5 flex items-center gap-1"><Paperclip className="h-3 w-3" />Anexar PDF</p>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border-2 border-primary/20 bg-muted/20 px-3 py-2">
          <FileText className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{value.name}</p><p className="text-[10px] text-muted-foreground">{formatFileSize(value.size)}</p></div>
          <button type="button" onClick={() => { onChange(null); if (ref.current) ref.current.value = ""; }}><X className="h-4 w-4 text-muted-foreground hover:text-red-500" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all">
          <Upload className="h-5 w-5" /><span>Selecionar arquivo PDF</span>
        </button>
      )}
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
    </div>
  );
}

/* ── Componente Principal ────────────────────────────────────────────────── */
interface Props { open: boolean; onOpenChange: (v: boolean) => void; atendimento: Atendimento | null; }

export function EditarAtendimentoDialog({ open, onOpenChange, atendimento }: Props) {
  const isMobile = useIsMobile();
  const updateAtendimento = useUpdateAtendimento();
  // Hooks devem ser chamados SEMPRE
  const atendimentoId = atendimento?.id;
  const { data: historico, isLoading: loadingHistorico } = useAtendimentoHistorico(atendimentoId);
  const createHistorico = useCreateAtendimentoHistorico();
  const updateHistorico = useUpdateAtendimentoHistorico();
  const deleteHistorico = useDeleteAtendimentoHistorico();
  const uploadAnexo     = useUploadAnexo();

  /* Estado do sub-formulário de histórico */
  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hData,     setHData]     = useState("");
  const [hHora,     setHHora]     = useState("");
  const [hDets,     setHDets]     = useState("");
  const [hStatus,   setHStatus]   = useState("");
  const [pdf,       setPdf]       = useState<File | null>(null);

  /* Formulário principal */
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { data:"",hora:"",operador_nome:"",canal:"",status:"",motivo:"",observacoes:"",cliente_nome:"",cliente_telefone:"",cliente_email:"",condominio_nome:"" },
  });

  /* Reset controlado por ID — evita reset durante edição de histórico */
  const prevIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open || !atendimento) return;
    if (prevIdRef.current === atendimento.id) return;
    prevIdRef.current = atendimento.id;
    form.reset({
      data:             atendimento.data             || "",
      hora:             safeHora(atendimento.hora),
      operador_nome:    atendimento.operador_nome    || "",
      canal:            atendimento.canal            || "",
      status:           atendimento.status           || "",
      motivo:           atendimento.motivo           || "",
      observacoes:      atendimento.observacoes      || "",
      cliente_nome:     atendimento.cliente_nome     || "",
      cliente_telefone: atendimento.cliente_telefone || "",
      cliente_email:    atendimento.cliente_email    || "",
      condominio_nome:  atendimento.condominio_nome  || "",
    });
    resetHistForm();
  }, [open, atendimento?.id]); // eslint-disable-line

  useEffect(() => { if (!open) { prevIdRef.current = null; resetHistForm(); } }, [open]);

  /* ── Ações Atendimento ── */
  const onSubmit = async (data: FormData) => {
    if (!atendimento) return;
    try {
      await updateAtendimento.mutateAsync({ id: atendimento.id, ...data, observacoes: data.observacoes || undefined, cliente_email: data.cliente_email || undefined });
      onOpenChange(false);
    } catch { /* mutation handles error */ }
  };

  /* ── Ações Histórico ── */
  const resetHistForm = () => { setShowForm(false); setEditingId(null); setHData(""); setHHora(""); setHDets(""); setHStatus(""); setPdf(null); };

  const startEdit = (item: AtendimentoHistorico) => {
    setEditingId(item.id);
    setHData(item.data    || "");
    setHHora(safeHora(item.hora));
    setHDets(item.detalhes || "");
    setHStatus(item.status  || "");
    setPdf(null);
    setShowForm(true);
  };

  const saveHistorico = async () => {
    if (!atendimento || !hData || !hHora || !hDets || !hStatus) return;
    try {
      let id = editingId;
      if (editingId) {
        await updateHistorico.mutateAsync({ id: editingId, data: hData, hora: hHora, detalhes: hDets, status: hStatus });
      } else {
        const r = await createHistorico.mutateAsync({ atendimento_id: atendimento.id, data: hData, hora: hHora, detalhes: hDets, status: hStatus });
        id = r.id;
      }
      if (pdf && id) await uploadAnexo.mutateAsync({ file: pdf, entidadeTipo: "atendimento_historico", entidadeId: id });
      resetHistForm();
    } catch (e) { console.error(e); }
  };

  const deleteHist = async (item: AtendimentoHistorico) => {
    if (!confirm("Excluir este registro?")) return;
    await deleteHistorico.mutateAsync(item);
  };

  const saving = createHistorico.isPending || updateHistorico.isPending || uploadAnexo.isPending;

  /* ── Render ── */
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col p-0 gap-0 h-full",
          isMobile ? "h-[95vh] rounded-t-2xl" : "w-[95vw] lg:w-[1200px]"
        )}
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-secondary" />
            Editar Atendimento
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto min-h-0 bg-background/50">
          <div className="px-6 py-5 space-y-8">

            {/* ─── DADOS GERAIS ─── */}
            <Form {...form}>
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Dados do Atendimento</h3>
                <Separator />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <FormField control={form.control} name="data" render={({ field }) => (
                    <FormItem><FormLabel>Data *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="hora" render={({ field }) => (
                    <FormItem><FormLabel>Hora *</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="operador_nome" render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1"><FormLabel>Operador *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField control={form.control} name="canal" render={({ field }) => (
                    <FormItem><FormLabel>Canal *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{CANAIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="motivo" render={({ field }) => (
                    <FormItem><FormLabel>Motivo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{MOTIVOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField control={form.control} name="cliente_nome" render={({ field }) => (
                    <FormItem><FormLabel>Cliente *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cliente_telefone" render={({ field }) => (
                    <FormItem><FormLabel>Telefone *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="condominio_nome" render={({ field }) => (
                    <FormItem><FormLabel>Condomínio *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="observacoes" render={({ field }) => (
                  <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </Form>

            {/* ─── HISTÓRICO ─── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico
                  {historico && historico.length > 0 && <Badge variant="secondary" className="text-xs">{historico.length}</Badge>}
                </h3>
                {!showForm && (
                  <Button type="button" size="sm" onClick={() => { resetHistForm(); setShowForm(true); }}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    <Plus className="h-3.5 w-3.5 mr-1" />Novo
                  </Button>
                )}
              </div>
              <Separator />

              {/* Formulário do histórico */}
              {showForm && (
                <div className={cn("rounded-xl border-2 p-4 space-y-3", editingId ? "border-blue-500 bg-blue-50/10 dark:bg-blue-950/10" : "border-secondary/40 bg-secondary/5")}>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[11px]", editingId ? "bg-blue-600 text-white" : "bg-secondary text-secondary-foreground")}>
                      {editingId ? <><Pencil className="h-3 w-3 mr-1 inline" />Editando</> : <><Plus className="h-3 w-3 mr-1 inline" />Novo registro</>}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Data *</label>
                      <Input type="date" value={hData} onChange={e => setHData(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Hora *</label>
                      <Input type="time" value={hHora} onChange={e => setHHora(e.target.value)} />
                    </div>
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Status *</label>
                      {/* Uso nativo de select para evitar conflito de portal com Sheet */}
                      <select
                        value={hStatus}
                        onChange={e => setHStatus(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Selecione...</option>
                        {H_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Detalhes *</label>
                    <Textarea placeholder="O que foi conversado?" value={hDets} onChange={e => setHDets(e.target.value)} className="min-h-[80px]" />
                  </div>
                  {editingId && <div className="rounded-lg bg-muted/20 p-2.5"><p className="text-[11px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1"><Paperclip className="h-3 w-3" />Anexos existentes</p><HistoricoAnexos id={editingId} allowDelete /></div>}
                  <PdfField value={pdf} onChange={setPdf} />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={resetHistForm} disabled={saving}>Cancelar</Button>
                    <Button type="button" size="sm" onClick={saveHistorico} disabled={saving || !hData || !hHora || !hDets || !hStatus}
                      className={cn("font-bold", editingId ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-secondary text-secondary-foreground hover:bg-secondary/90")}>
                      {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Confirmar"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de registros */}
              {loadingHistorico ? (
                <div className="flex justify-center py-6"><Clock className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : historico && historico.length > 0 ? (
                <div className="space-y-3">
                  {historico.map(item => (
                    <div key={item.id} className={cn(
                      "rounded-lg border p-3 transition-colors",
                      editingId === item.id ? "border-blue-400 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm" : "border-border hover:border-muted-foreground/20 bg-muted/5"
                    )}>
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-bold text-sm">{safeFormatDate(item.data)}</span>
                          <span className="text-muted-foreground text-xs">às {safeHora(item.hora) || "00:00"}</span>
                          <Badge variant="outline" className={cn("text-[11px] border font-medium", historicoStatusColor(item.status))}>
                            {item.status || "—"}
                          </Badge>
                        </div>
                        {/* Botões sempre visíveis */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 border-primary text-primary hover:bg-primary hover:text-white font-bold"
                            disabled={showForm && editingId !== item.id}
                            onClick={() => startEdit(item)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400"
                            disabled={deleteHistorico.isPending}
                            onClick={() => deleteHist(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground border-t pt-2 leading-relaxed">{item.detalhes || "—"}</p>
                      <HistoricoAnexos id={item.id} />
                    </div>
                  ))}
                </div>
              ) : (
                !showForm && (
                  <div className="text-center py-8 rounded-xl border border-dashed">
                    <History className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum registro de histórico ainda.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-6 py-4 border-t shrink-0">
          <Button type="button" variant="outline" className="h-10" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button type="button" className="h-10 px-6 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow"
            onClick={form.handleSubmit(onSubmit)} disabled={updateAtendimento.isPending}>
            {updateAtendimento.isPending ? "Salvando..." : "Salvar Atendimento"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
