import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Servico, CategoriaServico } from "@/hooks/useServicos";

interface ServicoPorCategoria extends CategoriaServico {
  servicos: Servico[];
}

export function exportarServicosPDF(servicosPorCategoria: ServicoPorCategoria[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Título
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Tabela de Serviços e Preços", pageWidth / 2, 20, { align: "center" });

  // Data de geração
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    pageWidth / 2,
    28,
    { align: "center" }
  );

  let currentY = 40;

  servicosPorCategoria.forEach((categoria) => {
    if (categoria.servicos.length === 0) return;

    // Verificar se precisa de nova página
    if (currentY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      currentY = 20;
    }

    // Nome da categoria
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246); // Azul
    doc.text(categoria.nome_categoria, 14, currentY);
    currentY += 8;

    // Tabela de serviços
    const tableData = categoria.servicos.map((servico) => [
      servico.nome_servico,
      servico.descricao || "-",
      servico.valor,
      servico.tipo_valor === "fixo"
        ? "Fixo"
        : servico.tipo_valor === "percentual"
        ? "Percentual"
        : "Variável",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Serviço", "Descrição", "Valor", "Tipo"]],
      body: tableData,
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 70 },
        2: { cellWidth: 40 },
        3: { cellWidth: 25 },
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  });

  // Rodapé
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save("tabela-servicos-precos.pdf");
}

export function exportarServicosCSV(servicosPorCategoria: ServicoPorCategoria[]) {
  const headers = ["Categoria", "Serviço", "Descrição", "Valor", "Tipo"];
  const rows: string[][] = [];

  servicosPorCategoria.forEach((categoria) => {
    categoria.servicos.forEach((servico) => {
      rows.push([
        categoria.nome_categoria,
        servico.nome_servico,
        servico.descricao || "",
        servico.valor,
        servico.tipo_valor === "fixo"
          ? "Fixo"
          : servico.tipo_valor === "percentual"
          ? "Percentual"
          : "Variável",
      ]);
    });
  });

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tabela-servicos-precos.csv";
  link.click();
  URL.revokeObjectURL(url);
}
