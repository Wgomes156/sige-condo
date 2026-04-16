import { useState } from "react";
import { Landmark, Eye, EyeOff, Plus, Pencil, QrCode } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContaBancariaFormDialog } from "@/components/contas-bancarias/ContaBancariaFormDialog";
import { useContasBancarias, ContaBancaria } from "@/hooks/useContasBancarias";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLogger } from "@/hooks/useAuditLogger";
import { getBancoNome } from "@/lib/bancosBrasileiros";

interface DadosBancariosProps {
  condominioId: string;
}

function maskValue(value: string, keep = 1): string {
  if (!value) return "";
  return "****" + (keep > 0 ? `-${value.slice(-keep)}` : "");
}

function detectTipoChavePix(chave: string): string {
  if (!chave) return "";
  const digits = chave.replace(/\D/g, "");
  if (/^\d{11}$/.test(digits) && !chave.includes("@")) return "CPF";
  if (/^\d{14}$/.test(digits)) return "CNPJ";
  if (chave.includes("@")) return "E-mail";
  if (/^\+?55\d{10,11}$/.test(chave.replace(/\D/g, "")) && chave.length <= 15) return "Telefone";
  return "Chave Aleatória";
}

export function DadosBancariosSection({ condominioId }: DadosBancariosProps) {
  const { userRole } = useAuth();
  const { contas, loading, criarConta, atualizarConta } = useContasBancarias();
  const { logAction } = useAuditLogger();
  const [mostrar, setMostrar] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [contaParaEditar, setContaParaEditar] = useState<ContaBancaria | null>(null);

  if (userRole !== "admin" && userRole !== "sindico") return null;

  const conta = contas.find((c) => c.condominio_id === condominioId && c.conta_padrao)
    || contas.find((c) => c.condominio_id === condominioId && c.ativa)
    || contas.find((c) => c.condominio_id === condominioId);

  const handleToggleMostrar = () => {
    if (!mostrar && conta) {
      logAction({
        action: "view",
        entityType: "condominio",
        entityId: condominioId,
        entityName: "Dados Bancários",
        details: { conta_id: conta.id, banco: conta.banco_nome },
      });
    }
    setMostrar((prev) => !prev);
  };

  const handleEditar = () => {
    setContaParaEditar(conta || null);
    setFormOpen(true);
  };

  const handleNova = () => {
    setContaParaEditar(null);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setContaParaEditar(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Landmark className="h-4 w-4" />
          Dados Bancários
        </h3>
        <Separator />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Dados Bancários
          </h3>
          <div className="flex gap-2">
            {conta && (
              <Button variant="ghost" size="sm" onClick={handleToggleMostrar} className="h-7 text-xs gap-1">
                {mostrar ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {mostrar ? "Ocultar" : "Mostrar"}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={conta ? handleEditar : handleNova} className="h-7 text-xs gap-1">
              {conta ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {conta ? "Editar" : "Adicionar"}
            </Button>
          </div>
        </div>
        <Separator />

        {!conta ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <Landmark className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma conta bancária cadastrada.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleNova}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Cadastrar Conta Bancária
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Banco */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Banco</p>
                <p className="font-medium text-sm">
                  {conta.banco_codigo} – {conta.banco_nome || getBancoNome(conta.banco_codigo)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de Conta</p>
                <Badge variant="secondary" className="text-xs capitalize">
                  {conta.tipo_conta === "poupanca" ? "Poupança" : "Conta Corrente"}
                </Badge>
              </div>
            </div>

            {/* Agência e Conta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Agência</p>
                <p className="font-medium text-sm font-mono">
                  {mostrar
                    ? `${conta.agencia}${conta.agencia_digito ? `-${conta.agencia_digito}` : ""}`
                    : maskValue(conta.agencia, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conta Corrente</p>
                <p className="font-medium text-sm font-mono">
                  {mostrar
                    ? `${conta.conta}${conta.conta_digito ? `-${conta.conta_digito}` : ""}`
                    : maskValue(conta.conta, conta.conta_digito ? 0 : 1)}
                  {!mostrar && conta.conta_digito && `-${conta.conta_digito}`}
                </p>
              </div>
            </div>

            {/* Titular */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Titular</p>
                <p className="font-medium text-sm">{conta.titular_nome}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CPF / CNPJ</p>
                <p className="font-medium text-sm font-mono">
                  {mostrar ? conta.titular_documento : maskValue(conta.titular_documento, 2)}
                </p>
              </div>
            </div>

            {/* Chave Pix */}
            {conta.chave_pix && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <QrCode className="h-3 w-3" />
                  Chave Pix
                  <Badge variant="outline" className="text-xs ml-1">
                    {conta.tipo_chave_pix
                      ? conta.tipo_chave_pix.charAt(0).toUpperCase() + conta.tipo_chave_pix.slice(1)
                      : detectTipoChavePix(conta.chave_pix)}
                  </Badge>
                </p>
                <p className="font-medium text-sm font-mono mt-0.5">
                  {mostrar ? conta.chave_pix : maskValue(conta.chave_pix, 3)}
                </p>
              </div>
            )}

            {!mostrar && (
              <p className="text-xs text-muted-foreground italic">
                Clique em "Mostrar" para visualizar os dados completos. O acesso é registrado em auditoria.
              </p>
            )}
          </div>
        )}
      </div>

      <ContaBancariaFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        contaParaEditar={contaParaEditar}
        onSave={criarConta}
        onUpdate={atualizarConta}
        defaultCondominioId={condominioId}
      />
    </>
  );
}
