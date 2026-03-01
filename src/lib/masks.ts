// Máscara para CNPJ: 00.000.000/0000-00
export const formatCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

// Remove formatação do CNPJ (mantém apenas números)
export const unformatCnpj = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Validação de CNPJ
export const validateCnpj = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  
  if (digits.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(digits[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(digits[12]) !== digito1) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(digits[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(digits[13]) !== digito2) return false;
  
  return true;
};

// Máscara para CPF: 000.000.000-00
export const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

// Validação de CPF
export const validateCpf = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  
  // CPF deve ter 11 dígitos
  if (digits.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digits[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  let digito1 = resto === 10 ? 0 : resto;
  
  if (parseInt(digits[9]) !== digito1) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digits[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  let digito2 = resto === 10 ? 0 : resto;
  
  if (parseInt(digits[10]) !== digito2) return false;
  
  return true;
};

// Máscara para CEP: 00000-000
export const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// Máscara para telefone: (00) 00000-0000 ou (00) 0000-0000
export const formatTelefone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Validação de E-mail
export const validateEmail = (email: string): boolean => {
  if (!email || email.trim() === '') return true; // Campo vazio é válido (não obrigatório)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Validação de Telefone
export const validateTelefone = (telefone: string): boolean => {
  if (!telefone || telefone.trim() === '') return true; // Campo vazio é válido (não obrigatório)
  const digits = telefone.replace(/\D/g, '');
  // Telefone deve ter 10 (fixo) ou 11 (celular) dígitos
  return digits.length === 10 || digits.length === 11;
};

// Máscara para Placa de Veículo (padrão antigo: ABC-1234 ou Mercosul: ABC1D23)
export const formatPlaca = (value: string): string => {
  // Remove caracteres especiais exceto letras e números
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  
  if (cleaned.length <= 3) {
    // Apenas letras nos 3 primeiros caracteres
    return cleaned.replace(/[^A-Z]/g, '');
  }
  
  const letters = cleaned.slice(0, 3).replace(/[^A-Z]/g, '');
  const rest = cleaned.slice(3);
  
  if (rest.length === 0) return letters;
  
  // Detecta padrão Mercosul (4º caractere é número, 5º é letra)
  // Padrão antigo: ABC-1234 (3 letras + 4 números)
  // Padrão Mercosul: ABC1D23 (3 letras + 1 número + 1 letra + 2 números)
  
  // Verifica se é padrão Mercosul (tem letra na 5ª posição)
  const isMercosul = rest.length >= 2 && /[A-Z]/.test(rest[1]);
  
  if (isMercosul) {
    // Mercosul: ABC1D23
    return `${letters}${rest}`;
  } else {
    // Padrão antigo: ABC-1234
    const numbers = rest.replace(/[^0-9]/g, '').slice(0, 4);
    if (numbers.length === 0) return letters;
    return `${letters}-${numbers}`;
  }
};

// Validação de Placa de Veículo
export const validatePlaca = (placa: string): boolean => {
  if (!placa || placa.trim() === '') return false;
  
  const cleaned = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Padrão antigo: 3 letras + 4 números = 7 caracteres
  const antigoRegex = /^[A-Z]{3}[0-9]{4}$/;
  
  // Padrão Mercosul: 3 letras + 1 número + 1 letra + 2 números = 7 caracteres
  const mercosulRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  
  return antigoRegex.test(cleaned) || mercosulRegex.test(cleaned);
};
