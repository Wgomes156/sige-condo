import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OcorrenciaCondominio, TipoOcorrencia, StatusOcorrencia, PrioridadeOcorrencia } from "@/hooks/useOcorrenciasCondominio";

const tipoLabels: Record<TipoOcorrencia, string> = {
  manutencao: "Manutenção",
  seguranca: "Segurança",
  convivencia: "Convivência",
  outro: "Outro",
};

const statusLabels: Record<StatusOcorrencia, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  resolvida: "Resolvida",
  cancelada: "Cancelada",
};

const prioridadeLabels: Record<PrioridadeOcorrencia, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

function formatCurrency(value: number | null): string {
  if (!value) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function exportOcorrenciasToCSV(data: OcorrenciaCondominio[], filename: string) {
  const headers = [
    "Data",
    "Condomínio",
    "Tipo",
    "Categoria",
    "Título",
    "Descrição",
    "Local",
    "Prioridade",
    "Status",
    "Custo Estimado",
    "Custo Real",
    "Data Resolução",
    "Resolução",
    "Observações",
  ];

  const rows = data.map((item) => [
    format(new Date(item.data_ocorrencia), "dd/MM/yyyy HH:mm"),
    item.condominios?.nome || "",
    tipoLabels[item.tipo_ocorrencia] || item.tipo_ocorrencia,
    item.categoria || "",
    item.titulo,
    item.descricao,
    item.local_ocorrencia || "",
    prioridadeLabels[item.prioridade] || item.prioridade,
    statusLabels[item.status] || item.status,
    item.custo_estimado?.toFixed(2).replace(".", ",") || "",
    item.custo_real?.toFixed(2).replace(".", ",") || "",
    item.data_resolucao ? format(new Date(item.data_resolucao), "dd/MM/yyyy HH:mm") : "",
    item.resolucao || "",
    item.observacoes || "",
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

interface OcorrenciasResumo {
  total: number;
  abertas: number;
  emAndamento: number;
  resolvidas: number;
  urgentes: number;
  custoEstimadoTotal: number;
  custoRealTotal: number;
}

interface OcorrenciasPorTipo {
  tipo: string;
  quantidade: number;
}

interface OcorrenciasPorPrioridade {
  prioridade: string;
  quantidade: number;
}

export function exportOcorrenciasToPDF(
  data: OcorrenciaCondominio[],
  resumo: OcorrenciasResumo,
  porTipo: OcorrenciasPorTipo[],
  porPrioridade: OcorrenciasPorPrioridade[],
  condominioFiltro: string | null,
  filename: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(26, 54, 93);
  doc.text("Relatório de Ocorrências", pageWidth / 2, 20, { align: "center" });

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100);
  const subtitleText = condominioFiltro
    ? `Condomínio: ${condominioFiltro}`
    : "Todos os Condomínios";
  doc.text(subtitleText, pageWidth / 2, 28, { align: "center" });
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth / 2,
    34,
    { align: "center" }
  );

  // Summary
  doc.setFontSize(14);
  doc.setTextColor(26, 54, 93);
  doc.text("Resumo Geral", 14, 48);

  doc.setFontSize(10);
  doc.setTextColor(60);
  const summaryY = 56;
  doc.text(`Total de Ocorrências: ${resumo.total}`, 14, summaryY);
  doc.text(`Abertas: ${resumo.abertas}`, 14, summaryY + 6);
  doc.text(`Em Andamento: ${resumo.emAndamento}`, 14, summaryY + 12);
  doc.text(`Resolvidas: ${resumo.resolvidas}`, 100, summaryY);
  doc.text(`Urgentes: ${resumo.urgentes}`, 100, summaryY + 6);
  doc.text(`Custo Estimado Total: ${formatCurrency(resumo.custoEstimadoTotal)}`, 14, summaryY + 22);
  doc.text(`Custo Real Total: ${formatCurrency(resumo.custoRealTotal)}`, 100, summaryY + 22);

  // By Type
  if (porTipo.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Ocorrências por Tipo", 14, summaryY + 36);

    autoTable(doc, {
      startY: summaryY + 42,
      head: [["Tipo", "Quantidade", "Percentual"]],
      body: porTipo.map((t) => [
        t.tipo,
        t.quantidade.toString(),
        `${resumo.total > 0 ? ((t.quantidade / resumo.total) * 100).toFixed(1) : 0}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9 },
    });
  }

  // By Priority
  if (porPrioridade.length > 0) {
    const tableEndY = (doc as any).lastAutoTable?.finalY || summaryY + 80;

    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Ocorrências por Prioridade", 14, tableEndY + 12);

    autoTable(doc, {
      startY: tableEndY + 18,
      head: [["Prioridade", "Quantidade", "Percentual"]],
      body: porPrioridade.map((p) => [
        p.prioridade,
        p.quantidade.toString(),
        `${resumo.total > 0 ? ((p.quantidade / resumo.total) * 100).toFixed(1) : 0}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9 },
    });
  }

  // Detailed List
  if (data.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Lista Detalhada de Ocorrências", 14, 20);

    autoTable(doc, {
      startY: 26,
      head: [["Data", "Condomínio", "Tipo", "Título", "Local", "Prioridade", "Status"]],
      body: data.slice(0, 50).map((o) => [
        format(new Date(o.data_ocorrencia), "dd/MM/yy"),
        (o.condominios?.nome || "-").substring(0, 18),
        tipoLabels[o.tipo_ocorrencia] || o.tipo_ocorrencia,
        o.titulo.substring(0, 25),
        (o.local_ocorrencia || "-").substring(0, 15),
        prioridadeLabels[o.prioridade] || o.prioridade,
        statusLabels[o.status] || o.status,
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 8 },
    });

    if (data.length > 50) {
      const tableEndY = (doc as any).lastAutoTable?.finalY || 200;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `Exibindo 50 de ${data.length} registros. Exporte em CSV para ver todos.`,
        14,
        tableEndY + 8
      );
    }
  }

  doc.save(`${filename}.pdf`);
}

export function buildOcorrenciasResumo(data: OcorrenciaCondominio[]): OcorrenciasResumo {
  return {
    total: data.length,
    abertas: data.filter((o) => o.status === "aberta").length,
    emAndamento: data.filter((o) => o.status === "em_andamento").length,
    resolvidas: data.filter((o) => o.status === "resolvida").length,
    urgentes: data.filter((o) => o.prioridade === "urgente").length,
    custoEstimadoTotal: data.reduce((acc, o) => acc + (o.custo_estimado || 0), 0),
    custoRealTotal: data.reduce((acc, o) => acc + (o.custo_real || 0), 0),
  };
}

export function buildOcorrenciasPorTipo(data: OcorrenciaCondominio[]): OcorrenciasPorTipo[] {
  const countByTipo = data.reduce((acc, o) => {
    const tipo = o.tipo_ocorrencia;
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(countByTipo)
    .map(([tipo, quantidade]) => ({
      tipo: tipoLabels[tipo as TipoOcorrencia] || tipo,
      quantidade,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

export function buildOcorrenciasPorPrioridade(data: OcorrenciaCondominio[]): OcorrenciasPorPrioridade[] {
  const countByPrioridade = data.reduce((acc, o) => {
    const prioridade = o.prioridade;
    acc[prioridade] = (acc[prioridade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ordem: PrioridadeOcorrencia[] = ["urgente", "alta", "media", "baixa"];
  
  return ordem
    .filter((p) => countByPrioridade[p])
    .map((prioridade) => ({
      prioridade: prioridadeLabels[prioridade] || prioridade,
      quantidade: countByPrioridade[prioridade],
    }));
}
