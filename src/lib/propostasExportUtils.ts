import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PropostaExport {
  numero_proposta: string;
  status: string;
  condominio_nome: string;
  condominio_tipo: string;
  condominio_endereco?: string | null;
  condominio_cidade?: string | null;
  condominio_estado?: string | null;
  condominio_cep?: string | null;
  condominio_qtd_unidades: number;
  condominio_qtd_blocos?: number | null;
  condominio_qtd_funcionarios?: number | null;
  condominio_sindico_nome?: string | null;
  condominio_sindico_telefone?: string | null;
  condominio_sindico_email?: string | null;
  responsavel_nome: string;
  responsavel_cargo?: string | null;
  responsavel_telefone: string;
  responsavel_email: string;
  pacote_tipo: string;
  cobranca_modelo?: string | null;
  valor_administracao?: number | null;
  valor_rh?: number | null;
  valor_sindico_profissional?: number | null;
  valor_servicos_extras?: number | null;
  valor_total: number;
  resumo_servicos?: string | null;
  diferenciais?: string | null;
  observacoes?: string | null;
  sla_atendimento?: string | null;
  data_emissao: string;
  data_validade: string;
  previsao_inicio_servicos?: string | null;
  proposta_servicos?: Array<{
    servico_nome: string;
    servico_descricao?: string | null;
    selecionado: boolean;
    valor_unitario?: number | null;
    quantidade: number;
    valor_total?: number | null;
  }>;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    rascunho: "Rascunho",
    enviada: "Enviada",
    em_analise: "Em Análise",
    aprovada: "Aprovada",
    recusada: "Recusada",
    expirada: "Expirada",
  };
  return labels[status] || status;
};

const getPacoteLabel = (pacote: string): string => {
  const labels: Record<string, string> = {
    basico: "Básico",
    intermediario: "Intermediário",
    completo: "Completo",
    personalizado: "Personalizado",
  };
  return labels[pacote] || pacote;
};

const getCondominioTipoLabel = (tipo: string): string => {
  const labels: Record<string, string> = {
    residencial: "Residencial",
    comercial: "Comercial",
    misto: "Misto",
  };
  return labels[tipo] || tipo;
};

export const exportPropostaToPDF = (proposta: PropostaExport): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Cabeçalho
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PROPOSTA COMERCIAL", pageWidth / 2, yPos, { align: "center" });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Nº ${proposta.numero_proposta}`, pageWidth / 2, yPos, { align: "center" });

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Status: ${getStatusLabel(proposta.status)}`, pageWidth / 2, yPos, { align: "center" });
  doc.setTextColor(0);

  // Dados do Condomínio
  yPos += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CONDOMÍNIO", 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const condominioData = [
    ["Nome:", proposta.condominio_nome],
    ["Tipo:", getCondominioTipoLabel(proposta.condominio_tipo)],
    ["Endereço:", proposta.condominio_endereco || "-"],
    ["Cidade/UF:", `${proposta.condominio_cidade || "-"} / ${proposta.condominio_estado || "-"}`],
    ["CEP:", proposta.condominio_cep || "-"],
    ["Unidades:", String(proposta.condominio_qtd_unidades)],
    ["Blocos:", String(proposta.condominio_qtd_blocos || "-")],
    ["Funcionários:", String(proposta.condominio_qtd_funcionarios || "-")],
  ];

  autoTable(doc, {
    startY: yPos,
    body: condominioData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Dados do Síndico
  if (proposta.condominio_sindico_nome) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SÍNDICO", 14, yPos);
    
    yPos += 8;
    const sindicoData = [
      ["Nome:", proposta.condominio_sindico_nome],
      ["Telefone:", proposta.condominio_sindico_telefone || "-"],
      ["E-mail:", proposta.condominio_sindico_email || "-"],
    ];

    autoTable(doc, {
      startY: yPos,
      body: sindicoData,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Responsável pela Contratação
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RESPONSÁVEL PELA CONTRATAÇÃO", 14, yPos);
  
  yPos += 8;
  const responsavelData = [
    ["Nome:", proposta.responsavel_nome],
    ["Cargo:", proposta.responsavel_cargo || "-"],
    ["Telefone:", proposta.responsavel_telefone],
    ["E-mail:", proposta.responsavel_email],
  ];

  autoTable(doc, {
    startY: yPos,
    body: responsavelData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Pacote e Serviços
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PACOTE CONTRATADO", 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tipo: ${getPacoteLabel(proposta.pacote_tipo)}`, 14, yPos);

  // Serviços Incluídos
  const servicosSelecionados = proposta.proposta_servicos?.filter(s => s.selecionado) || [];
  if (servicosSelecionados.length > 0) {
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SERVIÇOS INCLUÍDOS", 14, yPos);
    
    yPos += 5;
    const servicosData = servicosSelecionados.map(s => [
      s.servico_nome,
      s.servico_descricao || "-",
      String(s.quantidade),
      formatCurrency(s.valor_total),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Serviço", "Descrição", "Qtd", "Valor"]],
      body: servicosData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: { 
        0: { cellWidth: 50 },
        1: { cellWidth: 70 },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
      },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Verificar se precisa de nova página
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Resumo Financeiro
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO FINANCEIRO", 14, yPos);
  
  yPos += 8;
  const financeiroData = [
    ["Taxa de Administração:", formatCurrency(proposta.valor_administracao)],
    ["Gestão de RH:", formatCurrency(proposta.valor_rh)],
    ["Síndico Profissional:", formatCurrency(proposta.valor_sindico_profissional)],
    ["Serviços Extras:", formatCurrency(proposta.valor_servicos_extras)],
  ];

  autoTable(doc, {
    startY: yPos,
    body: financeiroData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { halign: "right" } },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // Total
  doc.setFillColor(30, 41, 59);
  doc.rect(14, yPos, pageWidth - 28, 12, "F");
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR TOTAL MENSAL:", 20, yPos + 8);
  doc.text(formatCurrency(proposta.valor_total), pageWidth - 20, yPos + 8, { align: "right" });
  doc.setTextColor(0);

  yPos += 20;

  // Validade
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PRAZOS", 14, yPos);
  
  yPos += 8;
  const prazosData = [
    ["Data de Emissão:", formatDate(proposta.data_emissao)],
    ["Validade da Proposta:", formatDate(proposta.data_validade)],
    ["Previsão de Início:", formatDate(proposta.previsao_inicio_servicos)],
  ];

  autoTable(doc, {
    startY: yPos,
    body: prazosData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Diferenciais
  if (proposta.diferenciais) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("NOSSOS DIFERENCIAIS", 14, yPos);
    
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const diferenciais = doc.splitTextToSize(proposta.diferenciais, pageWidth - 28);
    doc.text(diferenciais, 14, yPos);
    yPos += diferenciais.length * 5 + 10;
  }

  // Observações
  if (proposta.observacoes) {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVAÇÕES", 14, yPos);
    
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const obs = doc.splitTextToSize(proposta.observacoes, pageWidth - 28);
    doc.text(obs, 14, yPos);
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} | Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`proposta_${proposta.numero_proposta}.pdf`);
};

export const exportPropostasToCSV = (propostas: PropostaExport[]): void => {
  const headers = [
    "Número",
    "Status",
    "Condomínio",
    "Tipo",
    "Cidade",
    "UF",
    "Unidades",
    "Responsável",
    "Telefone",
    "E-mail",
    "Pacote",
    "Valor Total",
    "Data Emissão",
    "Validade",
  ];

  const rows = propostas.map((p) => [
    p.numero_proposta,
    getStatusLabel(p.status),
    p.condominio_nome,
    getCondominioTipoLabel(p.condominio_tipo),
    p.condominio_cidade || "",
    p.condominio_estado || "",
    String(p.condominio_qtd_unidades),
    p.responsavel_nome,
    p.responsavel_telefone,
    p.responsavel_email,
    getPacoteLabel(p.pacote_tipo),
    formatCurrency(p.valor_total),
    formatDate(p.data_emissao),
    formatDate(p.data_validade),
  ]);

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
  link.download = `propostas_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
