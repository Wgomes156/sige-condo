import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface BoletoParaExportar {
  id: string;
  condominio_id: string;
  unidade: string;
  morador_nome: string | null;
  morador_email: string | null;
  morador_telefone: string | null;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  nosso_numero: string | null;
  referencia: string;
  observacoes: string | null;
  condominios?: { nome: string };
  categorias_financeiras?: { nome: string; cor: string };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string): string {
  return format(new Date(dateString + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

export function gerarBoletoPDF(boleto: BoletoParaExportar): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header - Título
  doc.setFontSize(18);
  doc.setTextColor(26, 54, 93);
  doc.text("BOLETO DE COBRANÇA", pageWidth / 2, 25, { align: "center" });
  
  // Linha divisória
  doc.setDrawColor(26, 54, 93);
  doc.setLineWidth(0.5);
  doc.line(14, 32, pageWidth - 14, 32);
  
  // Informações do Condomínio
  doc.setFontSize(12);
  doc.setTextColor(60);
  doc.text("Condomínio:", 14, 45);
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text(boleto.condominios?.nome || "Não informado", 50, 45);
  
  // Box com informações principais
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 55, pageWidth - 28, 60, 3, 3, "F");
  
  // Dados do Morador
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("DADOS DO MORADOR", 20, 65);
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Unidade: ${boleto.unidade}`, 20, 75);
  doc.text(`Nome: ${boleto.morador_nome || "Não informado"}`, 20, 83);
  doc.text(`Telefone: ${boleto.morador_telefone || "Não informado"}`, 20, 91);
  doc.text(`E-mail: ${boleto.morador_email || "Não informado"}`, 20, 99);
  
  // Dados do Boleto (lado direito)
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("DADOS DO BOLETO", 120, 65);
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Referência: ${boleto.referencia}`, 120, 75);
  doc.text(`Nosso Número: ${boleto.nosso_numero || "N/A"}`, 120, 83);
  doc.text(`Vencimento: ${formatDate(boleto.data_vencimento)}`, 120, 91);
  
  // Status
  const statusLabels: Record<string, string> = {
    pendente: "Pendente",
    pago: "Pago",
    atraso: "Atraso",
    cancelado: "Cancelado",
  };
  doc.text(`Status: ${statusLabels[boleto.status] || boleto.status}`, 120, 99);
  
  // Valor em destaque
  doc.setFillColor(26, 54, 93);
  doc.roundedRect(14, 125, pageWidth - 28, 30, 3, 3, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("VALOR A PAGAR", pageWidth / 2, 137, { align: "center" });
  doc.setFontSize(24);
  doc.text(formatCurrency(boleto.valor), pageWidth / 2, 150, { align: "center" });
  
  // Data de pagamento (se houver)
  if (boleto.data_pagamento) {
    doc.setFontSize(11);
    doc.setTextColor(34, 139, 34);
    doc.text(`Pago em: ${formatDate(boleto.data_pagamento)}`, pageWidth / 2, 170, { align: "center" });
  }
  
  // Observações
  if (boleto.observacoes) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("OBSERVAÇÕES:", 14, 185);
    doc.setTextColor(0);
    doc.setFontSize(10);
    const obsLines = doc.splitTextToSize(boleto.observacoes, pageWidth - 28);
    doc.text(obsLines, 14, 193);
  }
  
  // Rodapé
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(14, 270, pageWidth - 14, 270);
  
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Documento gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth / 2,
    278,
    { align: "center" }
  );
  
  // Salvar o PDF
  const filename = `boleto_${boleto.unidade}_${boleto.referencia.replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}

export function imprimirBoleto(boleto: BoletoParaExportar): void {
  const statusLabels: Record<string, string> = {
    pendente: "Pendente",
    pago: "Pago",
    atrasado: "Atrasado",
    cancelado: "Cancelado",
  };

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Boleto - ${boleto.unidade} - ${boleto.referencia}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #1a365d;
          padding-bottom: 15px;
        }
        .header h1 {
          color: #1a365d;
          font-size: 24px;
        }
        .info-box {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          display: flex;
          gap: 40px;
        }
        .info-section {
          flex: 1;
        }
        .info-section h3 {
          color: #64748b;
          font-size: 12px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .info-section p {
          margin-bottom: 6px;
          font-size: 13px;
        }
        .condominio {
          margin-bottom: 20px;
        }
        .condominio span {
          color: #64748b;
          font-size: 13px;
        }
        .condominio strong {
          color: #1a365d;
          font-size: 16px;
          margin-left: 8px;
        }
        .valor-box {
          background: #1a365d;
          color: white;
          text-align: center;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .valor-box .label {
          font-size: 12px;
          margin-bottom: 8px;
        }
        .valor-box .valor {
          font-size: 28px;
          font-weight: bold;
        }
        .pago {
          text-align: center;
          color: #16a34a;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .observacoes {
          margin-top: 20px;
        }
        .observacoes h4 {
          color: #64748b;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .observacoes p {
          font-size: 13px;
          color: #333;
        }
        .footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BOLETO DE COBRANÇA</h1>
      </div>
      
      <div class="condominio">
        <span>Condomínio:</span>
        <strong>${boleto.condominios?.nome || "Não informado"}</strong>
      </div>
      
      <div class="info-box">
        <div class="info-section">
          <h3>Dados do Morador</h3>
          <p><strong>Unidade:</strong> ${boleto.unidade}</p>
          <p><strong>Nome:</strong> ${boleto.morador_nome || "Não informado"}</p>
          <p><strong>Telefone:</strong> ${boleto.morador_telefone || "Não informado"}</p>
          <p><strong>E-mail:</strong> ${boleto.morador_email || "Não informado"}</p>
        </div>
        <div class="info-section">
          <h3>Dados do Boleto</h3>
          <p><strong>Referência:</strong> ${boleto.referencia}</p>
          <p><strong>Nosso Número:</strong> ${boleto.nosso_numero || "N/A"}</p>
          <p><strong>Vencimento:</strong> ${formatDate(boleto.data_vencimento)}</p>
          <p><strong>Status:</strong> ${statusLabels[boleto.status] || boleto.status}</p>
        </div>
      </div>
      
      <div class="valor-box">
        <div class="label">VALOR A PAGAR</div>
        <div class="valor">${formatCurrency(boleto.valor)}</div>
      </div>
      
      ${boleto.data_pagamento ? `<div class="pago">Pago em: ${formatDate(boleto.data_pagamento)}</div>` : ""}
      
      ${boleto.observacoes ? `
        <div class="observacoes">
          <h4>OBSERVAÇÕES:</h4>
          <p>${boleto.observacoes}</p>
        </div>
      ` : ""}
      
      <div class="footer">
        Documento gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
