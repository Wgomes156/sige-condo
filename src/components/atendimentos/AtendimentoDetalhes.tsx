import { type ReactNode } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, Phone, Mail, Building2, User, UserCheck, MessageSquare, Calendar, Pencil, Clock, History, FileText, ExternalLink, MapPin, Shield, Info, Map, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Atendimento } from "@/hooks/useAtendimentos";
import { AnexosSection } from "@/components/anexos/AnexosSection";
import { useAtendimentoHistorico } from "@/hooks/useAtendimentoHistorico";
import { useAnexos, getAnexoUrl } from "@/hooks/useAnexos";
import { useCondominio } from "@/hooks/useCondominios";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const safeFormatDate = (dateStr: string | null | undefined) => {
  try {
    if (!dateStr) return "S/D";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "S/D" : format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch { return "S/D"; }
};

interface AtendimentoDetalhesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atendimento: Atendimento | null;
  onEdit?: (atendimento: Atendimento) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Finalizado":
      return "bg-green-100 text-green-800 border-green-200";
    case "Em andamento":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Tem demanda":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Aguardando retorno":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Com Contrato":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Finalizado sem contrato":
      return "bg-slate-100 text-slate-800 border-slate-200";
    default:
      return "";
  }
};

function InfoRow({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}:
      </span>
      <span className="col-span-2 text-sm font-semibold text-slate-700">{value || "Não informado"}</span>
    </div>
  );
}

export function AtendimentoDetalhes({ open, onOpenChange, atendimento, onEdit }: AtendimentoDetalhesProps) {
  // Hooks devem ser chamados no topo do componente
  const { data: historico, isLoading: loadingHistorico } = useAtendimentoHistorico(atendimento?.id);
  const { data: condominio, isLoading: loadingCondominio } = useCondominio(atendimento?.condominio_id || null);

  // Guard DEPOIS dos hooks (regra fundamental do React)
  // Renderiza Sheet vazio em vez de null para preservar animação de fechamento
  if (!atendimento) return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg" />
    </Sheet>
  );

  const getHistoricoStatusColor = (status: string) => {
    switch (status) {
      case "Aguardando":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "Em andamento":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "Contrato fechado":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "Encerrado sem contrato":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const handlePrint = () => {
    if (!atendimento) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Atendimento - ${atendimento.cliente_nome || ""}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 18px; margin-bottom: 20px; }
              .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
              .label { width: 40%; font-weight: bold; color: #666; }
              .value { width: 60%; }
              .section { margin-top: 20px; }
              .section-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h1>ATENDIMENTO</h1>
            
            <div class="section">
              <div class="section-title">Dados do Atendimento</div>
              <div class="info-row">
                <span class="label">Data:</span>
                <span class="value">${safeFormatDate(atendimento.data)}</span>
              </div>
              <div class="info-row">
                <span class="label">Hora:</span>
                <span class="value">${atendimento.hora ? atendimento.hora.slice(0, 5) : "--:--"}</span>
              </div>
              <div class="info-row">
                <span class="label">Operador:</span>
                <span class="value">${atendimento.operador_nome || ""}</span>
              </div>
              <div class="info-row">
                <span class="label">Canal:</span>
                <span class="value">${atendimento.canal || ""}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">${atendimento.status || ""}</span>
              </div>
              <div class="info-row">
                <span class="label">Motivo:</span>
                <span class="value">${atendimento.motivo || ""}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Dados do Cliente</div>
              <div class="info-row">
                <span class="label">Nome:</span>
                <span class="value">${atendimento.cliente_nome || ""}</span>
              </div>
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">${atendimento.cliente_telefone || ""}</span>
              </div>
              <div class="info-row">
                <span class="label">E-mail:</span>
                <span class="value">${atendimento.cliente_email || "Não informado"}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Condomínio</div>
              <div class="info-row">
                <span class="label">Nome:</span>
                <span class="value">${atendimento.condominio_nome || ""}</span>
              </div>
            </div>
            
            ${atendimento.observacoes ? `
            <div class="section">
              <div class="section-title">Observações</div>
              <p>${atendimento.observacoes}</p>
            </div>
            ` : ""}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent hideClose className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between gap-2">
          <SheetTitle className="flex items-center gap-2">
            Detalhes do Atendimento
          </SheetTitle>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                size="sm"
                className="bg-orange-500 text-white hover:bg-orange-600 font-bold"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(atendimento);
                }}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint} title="Imprimir Detalhes">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="font-bold border-slate-300 hover:bg-slate-50">
              Fechar
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-10">
          <Accordion type="multiple" defaultValue={["cliente", "atendimento"]} className="space-y-4">
            {/* Seção: Dados do Cliente */}
            <AccordionItem value="cliente" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
              <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Dados do Cliente</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <InfoRow label="Nome" value={atendimento.cliente_nome} icon={<User className="h-3 w-3" />} />
                <InfoRow label="Telefone" value={atendimento.cliente_telefone} icon={<Phone className="h-3 w-3" />} />
                <InfoRow label="E-mail" value={atendimento.cliente_email} icon={<Mail className="h-3 w-3" />} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <InfoRow label="Nome" value={condominio?.nome || atendimento.condominio_nome} icon={<Building2 className="h-3.5 w-3.5" />} />
                  <InfoRow label="CNPJ" value={condominio?.cnpj} icon={<FileText className="h-3.5 w-3.5" />} />
                  <InfoRow label="Tipo" value={condominio?.tipo_imovel} icon={<Info className="h-3.5 w-3.5" />} />
                  <InfoRow 
                    label="Endereço" 
                    value={
                      loadingCondominio ? (
                        <span className="flex items-center gap-2 text-slate-400 italic">
                          <Loader2 className="h-3 w-3 animate-spin" /> Carregando endereço...
                        </span>
                      ) : condominio ? (
                        <div className="flex flex-col gap-0.5">
                          <span>{condominio.endereco || ""}{condominio.numero ? `, ${condominio.numero}` : ""}</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            {condominio.bairro ? `${condominio.bairro} - ` : ""}{condominio.cep ? `CEP: ${condominio.cep} - ` : ""}{condominio.cidade || ""} / {condominio.uf || ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Não disponível</span>
                      )
                    } 
                    icon={<MapPin className="h-3.5 w-3.5" />} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Unidades</span>
                    <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700 border-blue-100 font-bold">
                      {condominio?.quantidade_unidades || 0} unidades
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Blocos</span>
                    <Badge variant="outline" className="w-fit bg-purple-50 text-purple-700 border-purple-100 font-bold">
                      {condominio?.quantidade_blocos || 0} blocos
                    </Badge>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Seção: Síndico */}
            <AccordionItem value="sindico" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
              <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Dados do Síndico</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <InfoRow label="Possui Síndico?" value={condominio?.tem_sindico ? "Sim" : "Não"} icon={<Info className="h-3.5 w-3.5" />} />
                {condominio?.tem_sindico && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border-t pt-2">
                    <InfoRow label="Nome" value={condominio?.sindico_nome} icon={<User className="h-3.5 w-3.5" />} />
                    <InfoRow label="Telefone" value={condominio?.sindico_telefone} icon={<Phone className="h-3 w-3" />} />
                    <InfoRow label="E-mail" value={condominio?.sindico_email} icon={<Mail className="h-3 w-3" />} />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Seção: Administradora */}
            <AccordionItem value="administradora" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
              <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Administradora</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <InfoRow label="Possui Administradora?" value={condominio?.tem_administradora ? "Sim" : "Não"} />
                {condominio?.tem_administradora && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border-t pt-2">
                    <InfoRow label="Empresa" value={condominio?.nome_administradora || condominio?.administradora_nome} icon={<Shield className="h-3.5 w-3.5" />} />
                    <InfoRow label="Responsável" value={condominio?.administradora_responsavel} icon={<UserCheck className="h-3 w-3" />} />
                    <InfoRow label="Telefone" value={condominio?.administradora_telefone} icon={<Phone className="h-3 w-3" />} />
                    <InfoRow label="E-mail" value={condominio?.administradora_email} icon={<Mail className="h-3 w-3" />} />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Seção: Detalhes do Atendimento */}
            <AccordionItem value="atendimento" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
              <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Detalhes do Atendimento</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <InfoRow label="Data" value={safeFormatDate(atendimento.data)} icon={<Calendar className="h-3 w-3" />} />
                  <InfoRow label="Hora" value={atendimento.hora?.slice(0, 5)} icon={<Clock className="h-3 w-3" />} />
                  <InfoRow label="Operador" value={atendimento.operador_nome} icon={<User className="h-3 w-3" />} />
                  <InfoRow label="Canal" value={atendimento.canal} icon={<MessageSquare className="h-3 w-3" />} />
                  <InfoRow label="Motivo" value={atendimento.motivo} />
                  <InfoRow 
                    label="Status" 
                    value={
                      <Badge variant="outline" className={getStatusColor(atendimento.status)}>
                        {atendimento.status}
                      </Badge>
                    } 
                  />
                </div>

                {atendimento.observacoes && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Observações</h4>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {atendimento.observacoes}
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Seção: Histórico */}
            <AccordionItem value="historico" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
              <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Histórico ({historico?.length || 0})</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                {loadingHistorico ? (
                  <p className="text-sm text-muted-foreground py-4 text-center animate-pulse">Carregando histórico...</p>
                ) : historico && historico.length > 0 ? (
                  <div className="space-y-4">
                    {historico.map((item) => (
                      <div key={item.id} className="bg-white rounded-xl border p-4 shadow-sm hover:border-orange-200 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="font-bold text-sm text-slate-800">
                              {safeFormatDate(item.data)} às {item.hora ? item.hora.slice(0, 5) : "00:00"}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0.5", getHistoricoStatusColor(item.status))}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border-l-4 border-orange-500 italic">
                          "{item.detalhes || "—"}"
                        </p>
                        <AtendimentoHistoricoAnexos historicoId={item.id} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2 italic text-center">Nenhum registro de histórico.</p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Seção: Anexos */}
            <AccordionItem value="anexos" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0">
              <AccordionTrigger className="bg-slate-50 px-4 py-2 hover:no-underline border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Anexos e Documentos</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4">
                <AnexosSection
                  entidadeTipo="atendimento"
                  entidadeId={atendimento.id}
                  showUploader={true}
                  showDelete={true}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Botão Fechar inferior */}
          <div className="pt-6 pb-2">
            <Button
              variant="outline"
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
function AtendimentoHistoricoAnexos({ historicoId }: { historicoId: string }) {
  const { data: anexos, isLoading } = useAnexos("atendimento_historico", historicoId);

  if (isLoading || !anexos || anexos.length === 0) return null;

  const handleOpenAnexo = async (path: string) => {
    const url = await getAnexoUrl(path);
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {anexos.map((anexo) => (
        <div key={anexo.id} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 bg-white shadow-sm hover:border-orange-200 transition-colors">
          <FileText className="h-3 w-3 text-red-500" />
          <button
            type="button"
            className="text-[11px] font-bold uppercase text-slate-700 hover:text-orange-600 truncate max-w-[150px]"
            onClick={() => handleOpenAnexo(anexo.storage_path)}
          >
            {anexo.nome_arquivo || "Documento PDF"}
          </button>
        </div>
      ))}
    </div>
  );
}
