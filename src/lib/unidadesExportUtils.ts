import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { UnidadeCompleta, ProprietarioUnidade, InquilinoUnidade } from "@/hooks/useUnidadesCompleto";

const tipoUnidadeLabels: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  loja: "Loja",
  escritorio: "Escritório",
  sala: "Sala",
};

const situacaoLabels: Record<string, string> = {
  ativa: "Ativa",
  inativa: "Inativa",
  em_reforma: "Em Reforma",
  desocupada: "Desocupada",
};

const statusFinanceiroLabels: Record<string, string> = {
  em_dia: "Em dia",
  inadimplente: "Inadimplente",
  acordo: "Acordo",
};

const tipoOcupacaoLabels: Record<string, string> = {
  moradia: "Moradia",
  aluguel: "Aluguel",
  aluguel_temporada: "Aluguel Temporada",
  desocupado: "Desocupado",
};

export interface UnidadeExportData {
  unidade: UnidadeCompleta;
  proprietario?: ProprietarioUnidade | null;
  inquilino?: InquilinoUnidade | null;
}

export function exportUnidadesToCSV(data: UnidadeExportData[], filename: string) {
  const headers = [
    "Código",
    "Tipo",
    "Condomínio",
    "Bloco",
    "Andar",
    "Situação",
    "Tipo Ocupação",
    "Status Financeiro",
    // Proprietário
    "Proprietário Nome",
    "Proprietário CPF/CNPJ",
    "Proprietário Telefone",
    "Proprietário E-mail",
    // Inquilino
    "Inquilino Nome",
    "Inquilino CPF",
    "Inquilino Telefone",
    "Inquilino E-mail",
    "Inquilino Início Contrato",
    "Inquilino Fim Contrato",
    // Morador Principal
    "Morador Nome",
    "Morador Telefone",
    "Morador E-mail",
    "Observações",
  ];

  const rows = data.map(({ unidade: u, proprietario: p, inquilino: i }) => [
    u.codigo,
    tipoUnidadeLabels[u.tipo_unidade || ""] || u.tipo_unidade || "",
    u.condominios?.nome || "",
    u.bloco || "",
    u.andar?.toString() || "",
    situacaoLabels[u.situacao || ""] || u.situacao || "",
    tipoOcupacaoLabels[u.tipo_ocupacao || ""] || u.tipo_ocupacao || "",
    statusFinanceiroLabels[u.status_financeiro || ""] || u.status_financeiro || "",
    // Proprietário
    p?.nome_completo || "",
    p?.cpf || "",
    p?.telefone || "",
    p?.email || "",
    // Inquilino
    i?.nome_completo || "",
    i?.cpf || "",
    i?.telefone || "",
    i?.email || "",
    i?.data_inicio_contrato ? format(new Date(i.data_inicio_contrato), "dd/MM/yyyy") : "",
    i?.data_termino_contrato ? format(new Date(i.data_termino_contrato), "dd/MM/yyyy") : "",
    // Morador Principal
    u.morador_nome || "",
    u.morador_telefone || "",
    u.morador_email || "",
    u.observacoes_gerais || "",
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

interface UnidadesResumo {
  total: number;
  ativas: number;
  desocupadas: number;
  alugadas: number;
  inadimplentes: number;
}

export function exportUnidadesToPDF(
  data: UnidadeExportData[],
  resumo: UnidadesResumo,
  filename: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const unidades = data.map((d) => d.unidade);

  // Header
  doc.setFontSize(20);
  doc.setTextColor(26, 54, 93);
  doc.text("Relatório de Unidades", pageWidth / 2, 20, { align: "center" });

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
  doc.setFontSize(14);
  doc.setTextColor(26, 54, 93);
  doc.text("Resumo Geral", 14, 42);

  doc.setFontSize(10);
  doc.setTextColor(60);
  const summaryY = 50;
  doc.text(`Total de Unidades: ${resumo.total}`, 14, summaryY);
  doc.text(`Ativas: ${resumo.ativas}`, 14, summaryY + 6);
  doc.text(`Desocupadas: ${resumo.desocupadas}`, 14, summaryY + 12);
  doc.text(`Alugadas: ${resumo.alugadas}`, 100, summaryY);
  doc.text(`Inadimplentes: ${resumo.inadimplentes}`, 100, summaryY + 6);

  // Distribution by Type
  const countByTipo = unidades.reduce((acc, u) => {
    const tipo = u.tipo_unidade || "outros";
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tipoData = Object.entries(countByTipo)
    .map(([tipo, count]) => ({
      tipo: tipoUnidadeLabels[tipo] || tipo,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  if (tipoData.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Distribuição por Tipo", 14, summaryY + 26);

    autoTable(doc, {
      startY: summaryY + 32,
      head: [["Tipo de Unidade", "Quantidade", "Percentual"]],
      body: tipoData.map((t) => [
        t.tipo,
        t.count.toString(),
        `${resumo.total > 0 ? ((t.count / resumo.total) * 100).toFixed(1) : 0}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9 },
    });
  }

  // Distribution by Situation
  const countBySituacao = unidades.reduce((acc, u) => {
    const situacao = u.situacao || "ativa";
    acc[situacao] = (acc[situacao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const situacaoData = Object.entries(countBySituacao)
    .map(([situacao, count]) => ({
      situacao: situacaoLabels[situacao] || situacao,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  if (situacaoData.length > 0) {
    const tableEndY = (doc as any).lastAutoTable?.finalY || summaryY + 60;

    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Distribuição por Situação", 14, tableEndY + 12);

    autoTable(doc, {
      startY: tableEndY + 18,
      head: [["Situação", "Quantidade", "Percentual"]],
      body: situacaoData.map((s) => [
        s.situacao,
        s.count.toString(),
        `${resumo.total > 0 ? ((s.count / resumo.total) * 100).toFixed(1) : 0}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9 },
    });
  }

  // Detailed List with Proprietários e Inquilinos
  if (data.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Lista Detalhada de Unidades", 14, 20);

    autoTable(doc, {
      startY: 26,
      head: [["Código", "Condomínio", "Bloco", "Situação", "Status Fin."]],
      body: data.slice(0, 50).map(({ unidade: u }) => [
        u.codigo,
        (u.condominios?.nome || "-").substring(0, 25),
        u.bloco || "-",
        situacaoLabels[u.situacao || ""] || u.situacao || "-",
        statusFinanceiroLabels[u.status_financeiro || ""] || u.status_financeiro || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 8 },
    });

    // Proprietários e Inquilinos
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text("Proprietários e Inquilinos por Unidade", 14, 20);

    autoTable(doc, {
      startY: 26,
      head: [["Unidade", "Proprietário", "Telefone Prop.", "Inquilino", "Telefone Inq."]],
      body: data.slice(0, 50).map(({ unidade: u, proprietario: p, inquilino: i }) => [
        u.codigo,
        (p?.nome_completo || "-").substring(0, 20),
        p?.telefone || "-",
        (i?.nome_completo || "-").substring(0, 20),
        i?.telefone || "-",
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
