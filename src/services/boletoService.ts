import type { ContaBancaria } from "@/hooks/useContasBancarias";

// ─── Data Types ───────────────────────────────────────────────────────────────

export interface DadosGeracaoBoleto {
  banco: string;
  moeda?: string;
  agencia: string;
  agenciaDigito: string;
  conta: string;
  contaDigito: string;
  carteira: string;
  convenio?: string;
  nossoNumero: string;
  valorCentavos: number;
  dataVencimento: Date;
  dataEmissao: Date;
  cedente: { nome: string; cpfCnpj: string; endereco?: string };
  sacado: { nome: string; cpfCnpj?: string; endereco?: string; unidade?: string };
  descricao: string;
  instrucoes: string[];
  multa?: number;
  juros?: number;
  descontoValor?: number;
  descontoAte?: Date;
  chavePix?: string;
  tipoChavePix?: string;
  condominioNome?: string;
  condominioId?: string;
}

export interface BoletoCalculado extends DadosGeracaoBoleto {
  codigoBarras: string;
  linhaDigitavel: string;
  fatorVencimento: string;
  valorFormatado: string;
}

export interface ValidationResult {
  valido: boolean;
  erros: string[];
}

// ─── FEBRABAN Calculations ────────────────────────────────────────────────────

export function calcularFatorVencimento(dataVencimento: Date): string {
  const BASE = new Date("1997-10-07T12:00:00");
  const d = new Date(dataVencimento);
  d.setHours(12, 0, 0, 0);
  const diff = Math.floor((d.getTime() - BASE.getTime()) / 86_400_000);
  if (diff <= 0 || diff > 9999) return "0000";
  return diff.toString().padStart(4, "0");
}

function modulo10(num: string): string {
  let sum = 0;
  let mult = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    let r = parseInt(num[i]) * mult;
    if (r > 9) r -= 9;
    sum += r;
    mult = mult === 2 ? 1 : 2;
  }
  const rem = sum % 10;
  return rem === 0 ? "0" : String(10 - rem);
}

function modulo11(num: string): string {
  const weights = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  for (let i = num.length - 1, w = 0; i >= 0; i--, w++) {
    sum += parseInt(num[i]) * weights[w % 8];
  }
  const rem = sum % 11;
  if (rem === 0 || rem === 1) return "1";
  return String(11 - rem);
}

// ─── Campo Livre per bank ─────────────────────────────────────────────────────

function campoLivreItau(ag: string, ct: string, ctDv: string, cart: string, nn: string): string {
  const c = cart.padStart(3, "0").slice(-3);
  const n = nn.padStart(8, "0").slice(-8);
  const a = ag.padStart(4, "0").slice(-4);
  const cc = ct.padStart(5, "0").slice(-5);
  const dac = modulo10(c + n + a + cc);
  return (c + n + dac + a + cc + (ctDv || "0") + "000").slice(0, 25);
}

function campoLivreBradesco(ag: string, ct: string, cart: string, nn: string): string {
  const a = ag.padStart(4, "0").slice(-4);
  const n = nn.padStart(11, "0").slice(-11);
  const cc = ct.padStart(7, "0").slice(-7);
  const c = cart.padStart(2, "0").slice(-2);
  return (a + n + cc + "0" + c).slice(0, 25);
}

function campoLivreSantander(ct: string, nn: string): string {
  const conv = ct.padStart(7, "0").slice(-7);
  const n = nn.padStart(13, "0").slice(-13);
  return ("9" + conv + n + "0000").slice(0, 25);
}

function campoLivreCEF(ag: string, ct: string, nn: string): string {
  const n = nn.padStart(15, "0").slice(-15);
  const a = ag.padStart(4, "0").slice(-4);
  const cc = ct.padStart(3, "0").slice(-3);
  const base = "11" + n + a + cc;
  const dac = modulo11(base);
  return (base + dac).slice(0, 25);
}

function campoLivreBB(ag: string, ct: string, nn: string, conv?: string): string {
  if (conv && conv.length === 6) {
    const n = nn.padStart(10, "0").slice(-10);
    return (conv + n + "000000000").slice(0, 25);
  }
  const n = nn.padStart(10, "0").slice(-10);
  const a = ag.padStart(4, "0").slice(-4);
  const cc = ct.padStart(8, "0").slice(-8);
  return (n + a + cc + "000").slice(0, 25);
}

function campoLivreGenerico(ag: string, ct: string, nn: string): string {
  const n = nn.padStart(17, "0").slice(-17);
  const a = ag.padStart(4, "0").slice(-4);
  const cc = ct.padStart(4, "0").slice(-4);
  return (n + a + cc + "000000").slice(0, 25);
}

export function gerarCampoLivre(
  banco: string,
  ag: string,
  agDv: string,
  ct: string,
  ctDv: string,
  cart: string,
  nn: string,
  conv?: string
): string {
  let campo = "";
  switch (banco) {
    case "341": campo = campoLivreItau(ag, ct, ctDv, cart, nn); break;
    case "237": campo = campoLivreBradesco(ag, ct, cart, nn); break;
    case "033": campo = campoLivreSantander(ct, nn); break;
    case "104": campo = campoLivreCEF(ag, ct, nn); break;
    case "001": campo = campoLivreBB(ag, ct, nn, conv); break;
    default:    campo = campoLivreGenerico(ag, ct, nn); break;
  }
  return campo.padEnd(25, "0").slice(0, 25);
}

export function gerarCodigoBarras44(dados: {
  banco: string;
  moeda: string;
  fatorVencimento: string;
  valorCentavos: number;
  campoLivre: string;
}): string {
  const valorStr = dados.valorCentavos.toString().padStart(10, "0").slice(-10);
  // Barcode structure: banco(3) + moeda(1) + DV(1) + fator(4) + valor(10) + campoLivre(25)
  // Build without DV first: banco(3) + moeda(1) + fator(4) + valor(10) + campoLivre(25) = 43 chars
  const semDv =
    dados.banco.slice(0, 3) +
    dados.moeda +
    dados.fatorVencimento +
    valorStr +
    dados.campoLivre.slice(0, 25);
  const dv = modulo11(semDv);
  return semDv.slice(0, 4) + dv + semDv.slice(4);
}

export function gerarLinhaDigitavel(cod44: string): string {
  const banco = cod44.slice(0, 3);
  const moeda = cod44.slice(3, 4);
  const dvGeral = cod44.slice(4, 5);
  const fator = cod44.slice(5, 9);
  const valor = cod44.slice(9, 19);
  const campoLivre = cod44.slice(19, 44);

  // Campo 1: banco(3)+moeda(1)+campoLivre[0..4](5) → 9 digits + dv = 10
  const c1b = banco + moeda + campoLivre.slice(0, 5);
  const dv1 = modulo10(c1b);
  const campo1 = c1b.slice(0, 5) + "." + c1b.slice(5) + dv1;

  // Campo 2: campoLivre[5..14](10) + dv = 11
  const c2b = campoLivre.slice(5, 15);
  const dv2 = modulo10(c2b);
  const campo2 = c2b.slice(0, 5) + "." + c2b.slice(5) + dv2;

  // Campo 3: campoLivre[15..24](10) + dv = 11
  const c3b = campoLivre.slice(15, 25);
  const dv3 = modulo10(c3b);
  const campo3 = c3b.slice(0, 5) + "." + c3b.slice(5) + dv3;

  // Campo 4: dvGeral(1)
  // Campo 5: fator(4)+valor(10) = 14
  return `${campo1} ${campo2} ${campo3} ${dvGeral} ${fator}${valor}`;
}

// ─── PIX Payload (EMV / BACEN) ────────────────────────────────────────────────

function tlv(tag: string, value: string): string {
  return tag + value.length.toString().padStart(2, "0") + value;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function gerarPayloadPix(dados: {
  chave: string;
  nome: string;
  cidade: string;
  valor?: number;
  identificador?: string;
}): string {
  const mai = tlv("26",
    tlv("00", "BR.GOV.BCB.PIX") + tlv("01", dados.chave)
  );
  const mcc = tlv("52", "0000");
  const currency = tlv("53", "986");
  const amount = dados.valor && dados.valor > 0
    ? tlv("54", dados.valor.toFixed(2))
    : "";
  const country = tlv("58", "BR");
  const name = tlv("59", dados.nome.slice(0, 25));
  const city = tlv("60", dados.cidade.slice(0, 15));
  const addData = tlv("62", tlv("05", (dados.identificador || "***").slice(0, 25)));
  const semCrc = mai + mcc + currency + amount + country + name + city + addData;
  return semCrc + tlv("63", crc16(semCrc + "6304"));
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validarPreRequisitos(conta: ContaBancaria | undefined): ValidationResult {
  const erros: string[] = [];
  if (!conta) {
    return { valido: false, erros: ["Condomínio sem dados bancários cadastrados"] };
  }
  if (!conta.banco_codigo) erros.push("Número do banco não informado");
  if (!conta.agencia) erros.push("Agência não informada");
  if (!conta.conta) erros.push("Conta corrente não informada");
  if (!conta.titular_documento) erros.push("CPF/CNPJ do titular não informado");
  if (!conta.titular_nome) erros.push("Nome do titular não informado");
  return { valido: erros.length === 0, erros };
}

// ─── Main calculation ─────────────────────────────────────────────────────────

export function calcularBoleto(dados: DadosGeracaoBoleto): BoletoCalculado {
  const fatorVencimento = calcularFatorVencimento(dados.dataVencimento);
  const campoLivre = gerarCampoLivre(
    dados.banco,
    dados.agencia,
    dados.agenciaDigito,
    dados.conta,
    dados.contaDigito,
    dados.carteira || "109",
    dados.nossoNumero,
    dados.convenio
  );
  const codigoBarras = gerarCodigoBarras44({
    banco: dados.banco,
    moeda: dados.moeda || "9",
    fatorVencimento,
    valorCentavos: dados.valorCentavos,
    campoLivre,
  });
  const linhaDigitavel = gerarLinhaDigitavel(codigoBarras);
  const valorFormatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(dados.valorCentavos / 100);

  return { ...dados, codigoBarras, linhaDigitavel, fatorVencimento, valorFormatado };
}

// ─── Build from DB data ───────────────────────────────────────────────────────

export function construirDadosBoleto(
  conta: ContaBancaria,
  boleto: {
    nossoNumero: string;
    valorCentavos: number;
    dataVencimento: Date;
    dataEmissao: Date;
    descricao: string;
    instrucoes?: string[];
    multa?: number;
    juros?: number;
    descontoValor?: number;
    descontoAte?: Date;
    sacadoNome: string;
    sacadoCpf?: string;
    sacadoUnidade?: string;
    condominioNome?: string;
    condominioId?: string;
  }
): BoletoCalculado {
  return calcularBoleto({
    banco: conta.banco_codigo,
    agencia: conta.agencia,
    agenciaDigito: conta.agencia_digito || "",
    conta: conta.conta,
    contaDigito: conta.conta_digito || "",
    carteira: conta.carteira || "109",
    convenio: conta.convenio || undefined,
    nossoNumero: boleto.nossoNumero,
    valorCentavos: boleto.valorCentavos,
    dataVencimento: boleto.dataVencimento,
    dataEmissao: boleto.dataEmissao,
    cedente: {
      nome: conta.titular_nome,
      cpfCnpj: conta.titular_documento,
    },
    sacado: {
      nome: boleto.sacadoNome,
      cpfCnpj: boleto.sacadoCpf,
      unidade: boleto.sacadoUnidade,
    },
    descricao: boleto.descricao,
    instrucoes: boleto.instrucoes || [],
    multa: boleto.multa,
    juros: boleto.juros,
    descontoValor: boleto.descontoValor,
    descontoAte: boleto.descontoAte,
    chavePix: conta.chave_pix || undefined,
    tipoChavePix: conta.tipo_chave_pix || undefined,
    condominioNome: boleto.condominioNome,
    condominioId: boleto.condominioId,
  });
}
