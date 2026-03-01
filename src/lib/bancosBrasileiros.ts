// List of major Brazilian banks
export const bancosBrasileiros = [
  { codigo: "001", nome: "Banco do Brasil" },
  { codigo: "033", nome: "Santander" },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "237", nome: "Bradesco" },
  { codigo: "341", nome: "Itaú Unibanco" },
  { codigo: "356", nome: "Banco Real" },
  { codigo: "389", nome: "Banco Mercantil do Brasil" },
  { codigo: "399", nome: "HSBC" },
  { codigo: "422", nome: "Safra" },
  { codigo: "453", nome: "Banco Rural" },
  { codigo: "633", nome: "Rendimento" },
  { codigo: "652", nome: "Itaú Unibanco Holding" },
  { codigo: "707", nome: "Daycoval" },
  { codigo: "745", nome: "Citibank" },
  { codigo: "756", nome: "Sicoob" },
  { codigo: "041", nome: "Banrisul" },
  { codigo: "070", nome: "BRB" },
  { codigo: "077", nome: "Inter" },
  { codigo: "212", nome: "Banco Original" },
  { codigo: "260", nome: "Nu Pagamentos (Nubank)" },
  { codigo: "336", nome: "C6 Bank" },
  { codigo: "748", nome: "Sicredi" },
  { codigo: "655", nome: "Votorantim" },
  { codigo: "246", nome: "ABC Brasil" },
  { codigo: "318", nome: "BMG" },
  { codigo: "021", nome: "Banestes" },
  { codigo: "004", nome: "BNB" },
  { codigo: "047", nome: "Banese" },
  { codigo: "085", nome: "Ailos" },
  { codigo: "136", nome: "Unicred" },
] as const;

export function getBancoByCode(codigo: string) {
  return bancosBrasileiros.find((b) => b.codigo === codigo);
}

export function getBancoNome(codigo: string): string {
  const banco = getBancoByCode(codigo);
  return banco?.nome || codigo;
}
