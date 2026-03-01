import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransacaoExtrato {
  data_vencimento: string;
  data_pagamento?: string | null;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
  categoria?: string;
  condominio?: string;
}

interface ExtratoData {
  transacoes: TransacaoExtrato[];
  periodo?: { inicio?: string; fim?: string };
  condominio?: string;
}

export function exportExtratoCSV(data: ExtratoData) {
  const { transacoes, periodo, condominio } = data;

  if (!transacoes || transacoes.length === 0) {
    throw new Error("Não há dados para exportar");
  }

  // Ordenar por data
  const ordenadas = [...transacoes].sort(
    (a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
  );

  // Calcular totais
  const totalEntradas = ordenadas
    .filter((t) => t.tipo === "receita" && t.status === "pago")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalSaidas = ordenadas
    .filter((t) => t.tipo === "despesa" && t.status === "pago")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalEntradas - totalSaidas;

  const headers = [
    "Data",
    "Tipo",
    "Descrição",
    "Categoria",
    "Condomínio",
    "Valor",
    "Status",
    "Entrada",
    "Saída",
  ];

  const rows = ordenadas.map((t) => [
    format(new Date(t.data_vencimento), "dd/MM/yyyy"),
    t.tipo === "receita" ? "Entrada" : "Saída",
    t.descricao,
    t.categoria || "-",
    t.condominio || "-",
    t.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    t.status === "pago" ? "Pago" : t.status === "pendente" ? "Pendente" : "Em atraso",
    t.tipo === "receita" && t.status === "pago"
      ? t.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "-",
    t.tipo === "despesa" && t.status === "pago"
      ? t.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "-",
  ]);

  // Adicionar linha de totais
  rows.push([]);
  rows.push([
    "RESUMO",
    "",
    "",
    "",
    "",
    "",
    "",
    `Total Entradas: ${totalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    `Total Saídas: ${totalSaidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
  ]);
  rows.push([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    `Saldo: ${saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
  ]);

  const csvContent = [
    `EXTRATO FINANCEIRO`,
    condominio ? `Condomínio: ${condominio}` : "",
    periodo?.inicio && periodo?.fim
      ? `Período: ${format(new Date(periodo.inicio), "dd/MM/yyyy")} a ${format(new Date(periodo.fim), "dd/MM/yyyy")}`
      : "",
    `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    "",
    headers.join(";"),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `extrato-financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
}

export function exportExtratoPDF(data: ExtratoData) {
  const { transacoes, periodo, condominio } = data;

  if (!transacoes || transacoes.length === 0) {
    throw new Error("Não há dados para exportar");
  }

  // Ordenar por data
  const ordenadas = [...transacoes].sort(
    (a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
  );

  // Calcular totais
  const totalEntradas = ordenadas
    .filter((t) => t.tipo === "receita" && t.status === "pago")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalSaidas = ordenadas
    .filter((t) => t.tipo === "despesa" && t.status === "pago")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalEntradas - totalSaidas;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Título
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EXTRATO FINANCEIRO", pageWidth / 2, 20, { align: "center" });

  // Informações do cabeçalho
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let yPos = 30;

  if (condominio) {
    doc.text(`Condomínio: ${condominio}`, 14, yPos);
    yPos += 6;
  }

  if (periodo?.inicio && periodo?.fim) {
    doc.text(
      `Período: ${format(new Date(periodo.inicio), "dd/MM/yyyy")} a ${format(new Date(periodo.fim), "dd/MM/yyyy")}`,
      14,
      yPos
    );
    yPos += 6;
  }

  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, yPos);
  yPos += 10;

  // Cards de resumo
  const cardWidth = (pageWidth - 42) / 3;
  
  // Card Entradas
  doc.setFillColor(34, 197, 94); // green
  doc.roundedRect(14, yPos, cardWidth, 20, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Total Entradas", 14 + cardWidth / 2, yPos + 7, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    totalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    14 + cardWidth / 2,
    yPos + 15,
    { align: "center" }
  );

  // Card Saídas
  doc.setFillColor(239, 68, 68); // red
  doc.roundedRect(14 + cardWidth + 7, yPos, cardWidth, 20, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Total Saídas", 14 + cardWidth + 7 + cardWidth / 2, yPos + 7, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    totalSaidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    14 + cardWidth + 7 + cardWidth / 2,
    yPos + 15,
    { align: "center" }
  );

  // Card Saldo
  doc.setFillColor(saldo >= 0 ? 59 : 239, saldo >= 0 ? 130 : 68, saldo >= 0 ? 246 : 68); // blue or red
  doc.roundedRect(14 + (cardWidth + 7) * 2, yPos, cardWidth, 20, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Saldo", 14 + (cardWidth + 7) * 2 + cardWidth / 2, yPos + 7, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    14 + (cardWidth + 7) * 2 + cardWidth / 2,
    yPos + 15,
    { align: "center" }
  );

  doc.setTextColor(0, 0, 0);
  yPos += 30;

  // Tabela de transações
  const tableData = ordenadas.map((t) => [
    format(new Date(t.data_vencimento), "dd/MM/yyyy"),
    t.tipo === "receita" ? "Entrada" : "Saída",
    t.descricao.length > 30 ? t.descricao.substring(0, 30) + "..." : t.descricao,
    t.categoria || "-",
    t.tipo === "receita" && t.status === "pago"
      ? t.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "-",
    t.tipo === "despesa" && t.status === "pago"
      ? t.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "-",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Data", "Tipo", "Descrição", "Categoria", "Entrada", "Saída"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 18 },
      2: { cellWidth: 55 },
      3: { cellWidth: 35 },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 1) {
        if (data.cell.raw === "Entrada") {
          data.cell.styles.textColor = [34, 197, 94];
        } else {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
  });

  doc.save(`extrato-financeiro-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
