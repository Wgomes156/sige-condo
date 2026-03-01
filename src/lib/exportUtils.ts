import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AtendimentoExport,
  AtendimentoPorOperador,
  AtendimentoPorCondominio,
  AtendimentoPorMotivo,
  ResumoGeral,
} from "@/hooks/useRelatorios";
import {
  InadimplenteItem,
  ResumoInadimplencia,
  InadimplenciaPorCondominio as InadimplenciaCondominio,
  InadimplenciaPorFaixaAtraso,
} from "@/hooks/useRelatorioInadimplencia";

export function exportToCSV(data: AtendimentoExport[], filename: string) {
  const headers = [
    "Data",
    "Hora",
    "Cliente",
    "Telefone",
    "E-mail",
    "Condomínio",
    "Operador",
    "Canal",
    "Status",
    "Motivo",
    "Observações",
  ];

  const rows = data.map((item) => [
    format(new Date(item.data), "dd/MM/yyyy"),
    item.hora,
    item.cliente_nome,
    item.cliente_telefone,
    item.cliente_email || "",
    item.condominio_nome,
    item.operador_nome,
    item.canal,
    item.status,
    item.motivo,
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

export function exportToPDF(
  data: AtendimentoExport[],
  resumo: ResumoGeral,
  porOperador: AtendimentoPorOperador[],
  porCondominio: AtendimentoPorCondominio[],
  porMotivo: AtendimentoPorMotivo[],
  periodoInicio: Date | undefined,
  periodoFim: Date | undefined,
  filename: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(26, 54, 93); // Primary color
  doc.text("Relatório de Atendimentos", pageWidth / 2, 20, { align: "center" });
  
  // Period
  doc.setFontSize(10);
  doc.setTextColor(100);
  const periodoText = periodoInicio && periodoFim
    ? `Período: ${format(periodoInicio, "dd/MM/yyyy")} a ${format(periodoFim, "dd/MM/yyyy")}`
    : "Período: Todos os atendimentos";
  doc.text(periodoText, pageWidth / 2, 28, { align: "center" });
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, 34, { align: "center" });

  // Summary Cards
  doc.setFontSize(14);
  doc.setTextColor(26, 54, 93);
  doc.text("Resumo Geral", 14, 48);
  
  doc.setFontSize(10);
  doc.setTextColor(60);
  const summaryY = 56;
  doc.text(`Total de Atendimentos: ${resumo.totalAtendimentos}`, 14, summaryY);
  doc.text(`Finalizados: ${resumo.totalFinalizados}`, 14, summaryY + 6);
  doc.text(`Em Andamento: ${resumo.totalEmAndamento}`, 14, summaryY + 12);
  doc.text(`Condomínios Atendidos: ${resumo.totalCondominios}`, 100, summaryY);
  doc.text(`Operadores Ativos: ${resumo.totalOperadores}`, 100, summaryY + 6);

  // Performance by Operator
  if (porOperador.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Performance por Operador", 14, summaryY + 26);

    autoTable(doc, {
      startY: summaryY + 32,
      head: [["Operador", "Total", "Finalizados", "Em Andamento", "Taxa Finalização"]],
      body: porOperador.slice(0, 10).map((op) => [
        op.operador_nome,
        op.total.toString(),
        op.finalizados.toString(),
        op.em_andamento.toString(),
        `${op.total > 0 ? ((op.finalizados / op.total) * 100).toFixed(1) : 0}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9 },
    });
  }

  // Top Condominiums
  if (porCondominio.length > 0) {
    const tableEndY = (doc as any).lastAutoTable?.finalY || summaryY + 70;
    
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Top Condomínios", 14, tableEndY + 12);

    autoTable(doc, {
      startY: tableEndY + 18,
      head: [["Condomínio", "Total de Atendimentos"]],
      body: porCondominio.slice(0, 10).map((c) => [c.condominio_nome, c.total.toString()]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9 },
    });
  }

  // Reasons
  if (porMotivo.length > 0) {
    const tableEndY = (doc as any).lastAutoTable?.finalY || 150;
    
    if (tableEndY > 220) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(26, 54, 93);
      doc.text("Motivos de Contato", 14, 20);
      
      autoTable(doc, {
        startY: 26,
        head: [["Motivo", "Total", "Percentual"]],
        body: porMotivo.map((m) => [
          m.motivo,
          m.total.toString(),
          `${resumo.totalAtendimentos > 0 ? ((m.total / resumo.totalAtendimentos) * 100).toFixed(1) : 0}%`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [26, 54, 93] },
        styles: { fontSize: 9 },
      });
    } else {
      doc.setFontSize(14);
      doc.setTextColor(26, 54, 93);
      doc.text("Motivos de Contato", 14, tableEndY + 12);

      autoTable(doc, {
        startY: tableEndY + 18,
        head: [["Motivo", "Total", "Percentual"]],
        body: porMotivo.map((m) => [
          m.motivo,
          m.total.toString(),
          `${resumo.totalAtendimentos > 0 ? ((m.total / resumo.totalAtendimentos) * 100).toFixed(1) : 0}%`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [26, 54, 93] },
        styles: { fontSize: 9 },
      });
    }
  }

  // Detailed List (new page)
  if (data.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Lista Detalhada de Atendimentos", 14, 20);

    autoTable(doc, {
      startY: 26,
      head: [["Data", "Cliente", "Condomínio", "Operador", "Canal", "Status", "Motivo"]],
      body: data.slice(0, 50).map((a) => [
        format(new Date(a.data), "dd/MM/yyyy"),
        a.cliente_nome.substring(0, 20),
        a.condominio_nome.substring(0, 20),
        a.operador_nome.substring(0, 15),
        a.canal,
        a.status,
        a.motivo,
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 8 },
    });

    if (data.length > 50) {
      const tableEndY = (doc as any).lastAutoTable?.finalY || 200;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Exibindo 50 de ${data.length} registros. Exporte em CSV para ver todos.`, 14, tableEndY + 8);
    }
  }

  doc.save(`${filename}.pdf`);
}

// Inadimplência exports
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function exportInadimplentesToCSV(data: InadimplenteItem[], filename: string) {
  const headers = [
    "Condomínio",
    "Unidade",
    "Morador",
    "Telefone",
    "E-mail",
    "Referência",
    "Valor",
    "Vencimento",
    "Dias em Atraso",
    "Categoria",
  ];

  const rows = data.map((item) => [
    item.condominio_nome,
    item.unidade,
    item.morador_nome || "",
    item.morador_telefone || "",
    item.morador_email || "",
    item.referencia,
    item.valor.toFixed(2).replace(".", ","),
    format(new Date(item.data_vencimento), "dd/MM/yyyy"),
    item.dias_atraso.toString(),
    item.categoria_nome || "",
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

export function exportInadimplenciaToPDF(
  resumo: ResumoInadimplencia,
  inadimplentes: InadimplenteItem[],
  porCondominio: InadimplenciaCondominio[],
  porFaixa: InadimplenciaPorFaixaAtraso[],
  condominioFiltro: string | null,
  filename: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(26, 54, 93);
  doc.text("Relatório de Inadimplência", pageWidth / 2, 20, { align: "center" });

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
  doc.text(`Total de Inadimplentes: ${resumo.totalInadimplentes}`, 14, summaryY);
  doc.text(`Valor Total Devido: ${formatCurrency(resumo.valorTotalDevido)}`, 14, summaryY + 6);
  doc.text(`Média de Atraso: ${resumo.mediaAtraso} dias`, 100, summaryY);
  doc.text(`Maior Débito: ${formatCurrency(resumo.maiorDebito)}`, 100, summaryY + 6);

  // By Range
  if (porFaixa.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Inadimplência por Faixa de Atraso", 14, summaryY + 20);

    autoTable(doc, {
      startY: summaryY + 26,
      head: [["Faixa", "Quantidade", "Valor Total"]],
      body: porFaixa.map((f) => [
        f.faixa,
        f.quantidade.toString(),
        formatCurrency(f.valor_total),
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9 },
    });
  }

  // By Condominium
  if (porCondominio.length > 0) {
    const tableEndY = (doc as any).lastAutoTable?.finalY || summaryY + 60;

    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Inadimplência por Condomínio", 14, tableEndY + 12);

    autoTable(doc, {
      startY: tableEndY + 18,
      head: [["Condomínio", "Quantidade", "Valor Total"]],
      body: porCondominio.slice(0, 10).map((c) => [
        c.condominio_nome,
        c.quantidade_inadimplentes.toString(),
        formatCurrency(c.valor_total),
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9 },
    });
  }

  // Detailed List
  if (inadimplentes.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Lista Detalhada de Inadimplentes", 14, 20);

    autoTable(doc, {
      startY: 26,
      head: [["Condomínio", "Unidade", "Morador", "Referência", "Valor", "Venc.", "Atraso"]],
      body: inadimplentes.slice(0, 50).map((i) => [
        i.condominio_nome.substring(0, 18),
        i.unidade,
        (i.morador_nome || "-").substring(0, 15),
        i.referencia,
        formatCurrency(i.valor),
        format(new Date(i.data_vencimento), "dd/MM/yy"),
        `${i.dias_atraso}d`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 8 },
    });

    if (inadimplentes.length > 50) {
      const tableEndY = (doc as any).lastAutoTable?.finalY || 200;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `Exibindo 50 de ${inadimplentes.length} registros. Exporte em CSV para ver todos.`,
        14,
        tableEndY + 8
      );
    }
  }

  doc.save(`${filename}.pdf`);
}

// Ordens de Serviço exports
export interface OrdemServicoExport {
  numero_os: number;
  data_solicitacao: string;
  hora_solicitacao: string;
  solicitante: string;
  condominio_nome: string;
  descricao_servico: string;
  status: string;
  prioridade: string;
  data_atendimento: string | null;
  observacoes: string | null;
}

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const prioridadeLabels: Record<string, string> = {
  urgente: "Urgente",
  periodico: "Periódico",
  nao_urgente: "Não Urgente",
};

export function exportOSToCSV(data: OrdemServicoExport[], filename: string) {
  const headers = [
    "Nº OS",
    "Data Solicitação",
    "Hora Solicitação",
    "Solicitante",
    "Condomínio",
    "Descrição do Serviço",
    "Status",
    "Prioridade",
    "Data Atendimento",
    "Observações",
  ];

  const rows = data.map((item) => [
    item.numero_os.toString(),
    format(new Date(item.data_solicitacao), "dd/MM/yyyy"),
    item.hora_solicitacao,
    item.solicitante,
    item.condominio_nome,
    item.descricao_servico,
    statusLabels[item.status] || item.status,
    prioridadeLabels[item.prioridade] || item.prioridade,
    item.data_atendimento
      ? format(new Date(item.data_atendimento), "dd/MM/yyyy")
      : "Não informado",
    item.observacoes || "Não informado",
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

export function exportOSToPDF(data: OrdemServicoExport[], filename: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(26, 54, 93);
  doc.text("Relatório de Ordens de Serviço", pageWidth / 2, 20, { align: "center" });

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth / 2,
    28,
    { align: "center" }
  );

  // Summary
  const totalOS = data.length;
  const abertas = data.filter((os) => os.status === "aberta").length;
  const emAndamento = data.filter((os) => os.status === "em_andamento").length;
  const concluidas = data.filter((os) => os.status === "concluida").length;
  const canceladas = data.filter((os) => os.status === "cancelada").length;

  const urgentes = data.filter((os) => os.prioridade === "urgente").length;
  const periodicas = data.filter((os) => os.prioridade === "periodico").length;
  const naoUrgentes = data.filter((os) => os.prioridade === "nao_urgente").length;

  doc.setFontSize(14);
  doc.setTextColor(26, 54, 93);
  doc.text("Resumo", 14, 42);

  doc.setFontSize(10);
  doc.setTextColor(60);
  const summaryY = 50;
  doc.text(`Total de OS: ${totalOS}`, 14, summaryY);
  doc.text(`Abertas: ${abertas}`, 14, summaryY + 6);
  doc.text(`Em Andamento: ${emAndamento}`, 14, summaryY + 12);
  doc.text(`Concluídas: ${concluidas}`, 70, summaryY + 6);
  doc.text(`Canceladas: ${canceladas}`, 70, summaryY + 12);
  
  doc.text(`Urgentes: ${urgentes}`, 130, summaryY);
  doc.text(`Periódicas: ${periodicas}`, 130, summaryY + 6);
  doc.text(`Não Urgentes: ${naoUrgentes}`, 130, summaryY + 12);

  // Table
  if (data.length > 0) {
    autoTable(doc, {
      startY: summaryY + 24,
      head: [["Nº OS", "Data", "Solicitante", "Condomínio", "Status", "Prioridade", "Atend."]],
      body: data.map((os) => [
        `#${os.numero_os}`,
        format(new Date(os.data_solicitacao), "dd/MM/yy"),
        os.solicitante.substring(0, 18),
        os.condominio_nome.substring(0, 18),
        statusLabels[os.status] || os.status,
        prioridadeLabels[os.prioridade] || os.prioridade,
        os.data_atendimento
          ? format(new Date(os.data_atendimento), "dd/MM/yy")
          : "-",
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
        `Exibindo ${data.length} registros.`,
        14,
        tableEndY + 8
      );
    }
  }

  doc.save(`${filename}.pdf`);
}
