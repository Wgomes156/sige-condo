import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BoletoCalculado } from "@/services/boletoService";
import { gerarPayloadPix } from "@/services/boletoService";

// ─── Bank name lookup ─────────────────────────────────────────────────────────

const BANCOS: Record<string, string> = {
  "001": "Banco do Brasil",
  "033": "Santander",
  "077": "Inter",
  "104": "Caixa Econômica Federal",
  "237": "Bradesco",
  "260": "Nubank",
  "336": "C6 Bank",
  "341": "Itaú",
  "748": "Sicredi",
  "756": "Sicoob",
};

function nomeBanco(codigo: string): string {
  return BANCOS[codigo] || `Banco ${codigo}`;
}

function fmtDate(d: Date): string {
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

function fmtCPFCNPJ(doc: string): string {
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 11)
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14)
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BoletoTemplateProps {
  dados: BoletoCalculado;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BoletoTemplate({ dados, className = "" }: BoletoTemplateProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [pixDataUrl, setPixDataUrl] = useState<string>("");

  useEffect(() => {
    if (barcodeRef.current && dados.codigoBarras && dados.codigoBarras.length === 44) {
      try {
        JsBarcode(barcodeRef.current, dados.codigoBarras, {
          format: "ITF",
          width: 1.2,
          height: 50,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch {
        // silently handle invalid barcode during preview
      }
    }
  }, [dados.codigoBarras]);

  useEffect(() => {
    if (dados.chavePix) {
      const payload = gerarPayloadPix({
        chave: dados.chavePix,
        nome: dados.cedente.nome,
        cidade: "Brasil",
        valor: dados.valorCentavos / 100,
        identificador: dados.nossoNumero,
      });
      QRCode.toDataURL(payload, { width: 100, margin: 1 }).then(setPixDataUrl).catch(() => {});
    }
  }, [dados.chavePix, dados.cedente.nome, dados.valorCentavos, dados.nossoNumero]);

  const dataVenc = new Date(dados.dataVencimento);
  const dataEmis = new Date(dados.dataEmissao);

  return (
    <div
      className={`bg-white text-black font-mono text-[11px] leading-tight border border-gray-300 rounded select-none ${className}`}
      style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}
    >
      {/* ── Aviso ── */}
      <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[10px] text-amber-700 text-center">
        BOLETO INTERNO — Não registrado no banco. Para compensação bancária oficial, contrate o serviço de cobrança registrada.
      </div>

      {/* ── Recibo do Sacado (topo) ── */}
      <div className="border-b border-dashed border-gray-400">
        {/* Cabeçalho */}
        <div className="flex items-stretch border-b border-gray-300">
          <div className="flex flex-col justify-center px-3 py-2 border-r border-gray-300 min-w-[110px]">
            <span className="text-[16px] font-bold text-blue-900">{dados.banco}</span>
            <span className="text-[9px] text-gray-600">{nomeBanco(dados.banco)}</span>
          </div>
          <div className="flex-1 px-3 py-2 flex flex-col justify-center">
            <span className="text-[9px] text-gray-500 uppercase tracking-wide">Linha Digitável</span>
            <span className="text-[11px] font-bold tracking-wider mt-0.5">{dados.linhaDigitavel}</span>
          </div>
        </div>

        {/* Beneficiário + dados recibo */}
        <div className="px-3 py-2 grid grid-cols-3 gap-x-4 gap-y-2">
          <div className="col-span-2">
            <Label>Beneficiário (Cedente)</Label>
            <Value>{dados.cedente.nome}</Value>
          </div>
          <div>
            <Label>CPF/CNPJ</Label>
            <Value>{fmtCPFCNPJ(dados.cedente.cpfCnpj)}</Value>
          </div>
          <div className="col-span-2">
            <Label>Sacado (Pagador)</Label>
            <Value>
              {dados.sacado.nome}
              {dados.sacado.unidade ? ` — ${dados.sacado.unidade}` : ""}
            </Value>
          </div>
          <div>
            <Label>CPF do Sacado</Label>
            <Value>{dados.sacado.cpfCnpj ? fmtCPFCNPJ(dados.sacado.cpfCnpj) : "—"}</Value>
          </div>
          <div>
            <Label>Valor do Documento</Label>
            <Value className="font-bold text-[12px]">{dados.valorFormatado}</Value>
          </div>
          <div>
            <Label>Vencimento</Label>
            <Value>{fmtDate(dataVenc)}</Value>
          </div>
          <div>
            <Label>Nosso Número</Label>
            <Value className="font-bold">{dados.nossoNumero}</Value>
          </div>
        </div>

        <div className="px-3 py-1 border-t border-gray-200 bg-gray-50">
          <span className="text-[9px] text-gray-500">Referência: {dados.descricao}</span>
        </div>

        <div className="px-3 py-1 flex justify-center border-t border-gray-200">
          <span className="text-[9px] text-gray-400 italic">Recibo do Sacado — Corte aqui</span>
        </div>
      </div>

      {/* ── Ficha de Compensação ── */}
      <div className="pt-1">
        {/* Cabeçalho ficha */}
        <div className="flex items-stretch border-b border-gray-300">
          <div className="flex flex-col justify-center px-3 py-2 border-r border-gray-300 min-w-[110px]">
            <span className="text-[18px] font-bold text-blue-900">{dados.banco}</span>
            <span className="text-[9px] text-gray-600">{nomeBanco(dados.banco)}</span>
          </div>
          <div className="flex-1 px-3 py-2">
            <span className="text-[9px] text-gray-500 uppercase tracking-wide">Linha Digitável</span>
            <p className="text-[11px] font-bold tracking-wider mt-0.5">{dados.linhaDigitavel}</p>
          </div>
        </div>

        {/* Cedente + campos */}
        <div className="px-3 pt-2 grid grid-cols-4 gap-x-4 gap-y-2 border-b border-gray-200 pb-2">
          <div className="col-span-3">
            <Label>Beneficiário</Label>
            <Value>{dados.cedente.nome}</Value>
          </div>
          <div>
            <Label>Agência / Conta</Label>
            <Value>
              {dados.agencia}{dados.agenciaDigito ? `-${dados.agenciaDigito}` : ""} / {dados.conta}{dados.contaDigito ? `-${dados.contaDigito}` : ""}
            </Value>
          </div>

          <div className="col-span-2">
            <Label>Local de Pagamento</Label>
            <Value>Pagável em qualquer banco até o vencimento</Value>
          </div>
          <div>
            <Label>Vencimento</Label>
            <Value className="font-bold text-[13px]">{fmtDate(dataVenc)}</Value>
          </div>
          <div>
            <Label>Valor do Documento</Label>
            <Value className="font-bold text-[13px]">{dados.valorFormatado}</Value>
          </div>

          <div>
            <Label>Nosso Número</Label>
            <Value className="font-bold">{dados.nossoNumero}</Value>
          </div>
          <div>
            <Label>Número do Documento</Label>
            <Value>{dados.nossoNumero}</Value>
          </div>
          <div>
            <Label>Data Emissão</Label>
            <Value>{fmtDate(dataEmis)}</Value>
          </div>
          <div>
            <Label>Carteira</Label>
            <Value>{dados.carteira || "109"}</Value>
          </div>

          <div>
            <Label>Espécie Doc.</Label>
            <Value>DM</Value>
          </div>
          <div>
            <Label>Aceite</Label>
            <Value>N</Value>
          </div>
          {dados.multa && (
            <div>
              <Label>Multa por Atraso</Label>
              <Value>{dados.multa}%</Value>
            </div>
          )}
          {dados.juros && (
            <div>
              <Label>Juros ao Dia</Label>
              <Value>{dados.juros}%</Value>
            </div>
          )}
          {dados.descontoValor && (
            <div>
              <Label>Desconto até {dados.descontoAte ? fmtDate(new Date(dados.descontoAte)) : "—"}</Label>
              <Value>
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dados.descontoValor)}
              </Value>
            </div>
          )}
        </div>

        {/* Sacado */}
        <div className="px-3 py-2 border-b border-gray-200">
          <Label>Sacado</Label>
          <Value>
            {dados.sacado.nome}
            {dados.sacado.unidade ? ` — ${dados.sacado.unidade}` : ""}
            {dados.sacado.cpfCnpj ? ` — CPF/CNPJ: ${fmtCPFCNPJ(dados.sacado.cpfCnpj)}` : ""}
          </Value>
        </div>

        {/* Instruções */}
        {dados.instrucoes && dados.instrucoes.length > 0 && (
          <div className="px-3 py-2 border-b border-gray-200">
            <Label>Instruções ao Banco / Sacado</Label>
            {dados.instrucoes.map((linha, i) => (
              <Value key={i}>{linha}</Value>
            ))}
          </div>
        )}

        {/* Descrição */}
        <div className="px-3 py-2 border-b border-gray-200">
          <Label>Descrição</Label>
          <Value>{dados.descricao}</Value>
        </div>

        {/* Barcode + PIX */}
        <div className="px-3 py-3 flex items-end justify-between gap-4">
          <div className="flex-1">
            <svg ref={barcodeRef} className="w-full max-h-[60px]" />
            <p className="text-[8px] text-gray-500 mt-1 text-center">{dados.codigoBarras}</p>
          </div>
          {pixDataUrl && (
            <div className="flex flex-col items-center shrink-0">
              <img src={pixDataUrl} alt="QR Code Pix" className="w-20 h-20" />
              <span className="text-[8px] text-gray-600 mt-1 text-center">Pague também via Pix</span>
              <span className="text-[7px] text-gray-500 text-center max-w-[80px] truncate">{dados.chavePix}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[8px] uppercase tracking-wide text-gray-500">{children}</p>;
}

function Value({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[11px] text-gray-900 ${className}`}>{children}</p>;
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

export async function gerarBoletoBancarioPDF(dados: BoletoCalculado): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  // Generate barcode data URL via canvas
  let barcodeDataUrl = "";
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, dados.codigoBarras, {
      format: "ITF",
      width: 1.5,
      height: 50,
      displayValue: false,
      margin: 0,
    });
    barcodeDataUrl = canvas.toDataURL("image/png");
  } catch {
    // barcode generation failed
  }

  // Generate PIX QR code if available
  let pixDataUrl = "";
  if (dados.chavePix) {
    try {
      const payload = gerarPayloadPix({
        chave: dados.chavePix,
        nome: dados.cedente.nome,
        cidade: "Brasil",
        valor: dados.valorCentavos / 100,
        identificador: dados.nossoNumero,
      });
      pixDataUrl = await QRCode.toDataURL(payload, { width: 80, margin: 1 });
    } catch {
      // PIX QR failed
    }
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const m = 12; // margin
  const cw = W - m * 2; // content width
  let y = 15;

  const blue = [26, 54, 93] as [number, number, number];
  const gray = [100, 100, 100] as [number, number, number];
  const black = [0, 0, 0] as [number, number, number];

  const text = (t: string, x: number, yy: number, opts?: { align?: "center" | "right"; color?: [number, number, number]; size?: number }) => {
    if (opts?.color) doc.setTextColor(...opts.color);
    if (opts?.size) doc.setFontSize(opts.size);
    doc.text(t, x, yy, { align: opts?.align });
  };

  const hline = (yy: number, x1 = m, x2 = W - m, dash = false) => {
    doc.setDrawColor(...gray);
    if (dash) doc.setLineDashPattern([2, 2], 0);
    doc.line(x1, yy, x2, yy);
    if (dash) doc.setLineDashPattern([], 0);
  };

  const vline = (x: number, y1: number, y2: number) => {
    doc.setDrawColor(...gray);
    doc.line(x, y1, x, y2);
  };

  const labelVal = (label: string, value: string, x: number, yy: number) => {
    doc.setFontSize(6);
    doc.setTextColor(...gray);
    doc.text(label, x, yy);
    doc.setFontSize(9);
    doc.setTextColor(...black);
    doc.text(value, x, yy + 4);
    return yy + 8;
  };

  const fmtDate = (d: Date) => format(d, "dd/MM/yyyy", { locale: ptBR });
  const fmtDoc = (doc_str: string) => {
    const digits = doc_str.replace(/\D/g, "");
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return doc_str;
  };

  // ── Aviso ──
  doc.setFillColor(255, 251, 235);
  doc.rect(m, y - 4, cw, 8, "F");
  doc.setFontSize(7);
  doc.setTextColor(180, 100, 0);
  doc.text("BOLETO INTERNO — Para compensação bancária oficial, contrate o serviço de cobrança registrada com seu banco.", W / 2, y + 0, { align: "center" });
  y += 8;

  // ── Cabeçalho ──
  doc.setFillColor(...blue);
  doc.rect(m, y, cw, 10, "F");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`${dados.banco} — ${nomeBanco(dados.banco)}`, m + 3, y + 7);
  doc.setFontSize(8);
  doc.text(dados.linhaDigitavel, W - m - 2, y + 7, { align: "right" });
  y += 13;

  // ── Beneficiário ──
  hline(y);
  y += 2;
  labelVal("Beneficiário (Cedente)", `${dados.cedente.nome} — CNPJ/CPF: ${fmtDoc(dados.cedente.cpfCnpj)}`, m, y);
  y += 9;

  const splitX = W - m - 50;
  hline(y);
  y += 2;
  // Local pagamento | Vencimento
  doc.setFontSize(6); doc.setTextColor(...gray);
  doc.text("Local de Pagamento", m, y);
  doc.text("Vencimento", splitX, y);
  vline(splitX - 2, y - 1, y + 8);
  doc.setFontSize(9); doc.setTextColor(...black);
  doc.text("Pagável em qualquer banco até o vencimento", m, y + 4);
  doc.setFontSize(11); doc.setFont(undefined as any, "bold");
  doc.text(fmtDate(new Date(dados.dataVencimento)), splitX, y + 4);
  doc.setFont(undefined as any, "normal");
  y += 10;

  hline(y);
  y += 2;
  // Beneficiário | Agência/Conta
  doc.setFontSize(6); doc.setTextColor(...gray);
  doc.text("Beneficiário", m, y);
  doc.text("Agência / Código Beneficiário", splitX, y);
  vline(splitX - 2, y - 1, y + 8);
  doc.setFontSize(9); doc.setTextColor(...black);
  doc.text(dados.cedente.nome, m, y + 4);
  doc.text(`${dados.agencia}${dados.agenciaDigito ? `-${dados.agenciaDigito}` : ""} / ${dados.conta}${dados.contaDigito ? `-${dados.contaDigito}` : ""}`, splitX, y + 4);
  y += 10;

  hline(y);
  y += 2;
  const col = cw / 5;
  const cols = [m, m + col, m + col * 2, m + col * 3, splitX];
  const labels2 = ["Data Emissão", "Nosso Número", "Espécie Doc.", "Aceite", "Valor do Documento"];
  const vals2 = [
    fmtDate(new Date(dados.dataEmissao)),
    dados.nossoNumero,
    "DM",
    "N",
    dados.valorFormatado,
  ];
  labels2.forEach((l, i) => {
    doc.setFontSize(6); doc.setTextColor(...gray); doc.text(l, cols[i], y);
    if (i < 4) vline(cols[i + 1] - 2, y - 1, y + 8);
    doc.setFontSize(9); doc.setTextColor(...black);
    if (i === 4) { doc.setFont(undefined as any, "bold"); }
    doc.text(vals2[i], cols[i], y + 4);
    doc.setFont(undefined as any, "normal");
  });
  y += 10;

  // ── Sacado ──
  hline(y);
  y += 2;
  doc.setFontSize(6); doc.setTextColor(...gray); doc.text("Sacado (Pagador)", m, y);
  doc.setFontSize(9); doc.setTextColor(...black);
  const sacadoStr = [
    dados.sacado.nome,
    dados.sacado.unidade,
    dados.sacado.cpfCnpj ? `CPF/CNPJ: ${fmtDoc(dados.sacado.cpfCnpj)}` : null,
  ].filter(Boolean).join(" — ");
  doc.text(sacadoStr, m, y + 4);
  y += 10;

  // ── Instruções ──
  if (dados.instrucoes && dados.instrucoes.length > 0) {
    hline(y);
    y += 2;
    doc.setFontSize(6); doc.setTextColor(...gray); doc.text("Instruções", m, y);
    y += 4;
    dados.instrucoes.slice(0, 4).forEach((linha) => {
      doc.setFontSize(8); doc.setTextColor(...black); doc.text(linha, m, y);
      y += 4;
    });
    y += 2;
  }

  // ── Encargos ──
  if (dados.multa || dados.juros || dados.descontoValor) {
    hline(y);
    y += 2;
    if (dados.multa) {
      doc.setFontSize(6); doc.setTextColor(...gray); doc.text("Multa por Atraso", m, y);
      doc.setFontSize(8); doc.setTextColor(...black); doc.text(`${dados.multa}%`, m, y + 4);
    }
    if (dados.juros) {
      doc.setFontSize(6); doc.setTextColor(...gray); doc.text("Juros ao Dia", m + 30, y);
      doc.setFontSize(8); doc.setTextColor(...black); doc.text(`${dados.juros}%`, m + 30, y + 4);
    }
    if (dados.descontoValor) {
      const fmtC = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
      doc.setFontSize(6); doc.setTextColor(...gray); doc.text("Desconto", m + 60, y);
      doc.setFontSize(8); doc.setTextColor(...black); doc.text(fmtC(dados.descontoValor), m + 60, y + 4);
    }
    y += 10;
  }

  // ── Código de Barras + PIX ──
  hline(y, m, W - m, true); // dashed separator
  y += 4;

  if (barcodeDataUrl) {
    const barcodeW = pixDataUrl ? cw - 35 : cw;
    doc.addImage(barcodeDataUrl, "PNG", m, y, barcodeW, 15);
  }
  if (pixDataUrl) {
    doc.addImage(pixDataUrl, "PNG", W - m - 28, y - 2, 28, 28);
    doc.setFontSize(6); doc.setTextColor(...gray);
    doc.text("Pague via Pix", W - m - 14, y + 28, { align: "center" });
    doc.setFontSize(7); doc.setTextColor(...black);
    const chave = dados.chavePix || "";
    doc.text(chave.length > 30 ? chave.slice(0, 30) + "..." : chave, W - m - 14, y + 32, { align: "center" });
  }
  y += 20;

  hline(y);
  y += 4;
  doc.setFontSize(7); doc.setTextColor(...gray);
  doc.text(`Código de Barras: ${dados.codigoBarras}`, m, y);
  y += 5;
  doc.setFontSize(6);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} — Sistema CondoPlus`, W / 2, y, { align: "center" });

  const filename = `boleto_${dados.nossoNumero}_${fmtDate(new Date(dados.dataVencimento)).replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}
