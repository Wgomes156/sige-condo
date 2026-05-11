/**
 * Utilities for masking sensitive data in the UI
 */

export const maskAccountNumber = (account: string) => {
  if (!account) return "";
  if (account.length <= 4) return "****";
  return account.slice(0, 2) + "****" + account.slice(-2);
};

export const maskDocument = (doc: string) => {
  if (!doc) return "";
  const clean = doc.replace(/\D/g, "");
  if (clean.length === 11) {
    // CPF: 000.***.***-00
    return `${clean.slice(0, 3)}.***.***-${clean.slice(-2)}`;
  }
  if (clean.length === 14) {
    // CNPJ: 00.***.***/0000-00
    return `${clean.slice(0, 2)}.***.***/${clean.slice(8, 12)}-${clean.slice(-2)}`;
  }
  return "****" + doc.slice(-4);
};

export const maskEmail = (email: string) => {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return "****";
  return user.slice(0, 2) + "****@" + domain;
};
