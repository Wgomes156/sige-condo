import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TransacaoFinanceira,
  useUpdateTransacao,
  useCategorias,
} from "@/hooks/useFinanceiro";
import { useCondominios } from "@/hooks/useCondominios";

interface EditarTransacaoDialogProps {
  transacao: TransacaoFinanceira | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarTransacaoDialog({
  transacao,
  open,
  onOpenChange,
}: EditarTransacaoDialogProps) {
  const { data: condominios } = useCondominios();
  const { data: categorias } = useCategorias(transacao?.tipo);
  const updateTransacao = useUpdateTransacao();

  const [form, setForm] = useState({
    condominio_id: "",
    categoria_id: "",
    descricao: "",
    valor: "",
    data_vencimento: "",
    data_pagamento: "",
    status: "pendente",
    forma_pagamento: "",
    documento: "",
    unidade: "",
    morador_nome: "",
    observacoes: "",
  });

  useEffect(() => {
    if (transacao) {
      setForm({
        condominio_id: transacao.condominio_id || "",
        categoria_id: transacao.categoria_id || "",
        descricao: transacao.descricao || "",
        valor: String(transacao.valor) || "",
        data_vencimento: transacao.data_vencimento || "",
        data_pagamento: transacao.data_pagamento || "",
        status: transacao.status || "pendente",
        forma_pagamento: transacao.forma_pagamento || "",
        documento: transacao.documento || "",
        unidade: transacao.unidade || "",
        morador_nome: transacao.morador_nome || "",
        observacoes: transacao.observacoes || "",
      });
    }
  }, [transacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transacao) return;

    await updateTransacao.mutateAsync({
      id: transacao.id,
      condominio_id: form.condominio_id,
      categoria_id: form.categoria_id || undefined,
      descricao: form.descricao,
      valor: parseFloat(form.valor.replace(",", ".")),
      data_vencimento: form.data_vencimento,
      data_pagamento: form.data_pagamento || undefined,
      status: form.status,
      forma_pagamento: form.forma_pagamento || undefined,
      documento: form.documento || undefined,
      unidade: form.unidade || undefined,
      morador_nome: form.morador_nome || undefined,
      observacoes: form.observacoes || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="condominio">Condomínio *</Label>
              <Select
                value={form.condominio_id}
                onValueChange={(v) => setForm({ ...form, condominio_id: v })}
              >
                <SelectTrigger id="condominio">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {condominios?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={form.categoria_id || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, categoria_id: v === "none" ? "" : v })
                }
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.cor || "#6b7280" }}
                        />
                        {cat.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data Vencimento *</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={form.data_vencimento}
                onChange={(e) =>
                  setForm({ ...form, data_vencimento: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Data Pagamento</Label>
              <Input
                id="data_pagamento"
                type="date"
                value={form.data_pagamento}
                onChange={(e) =>
                  setForm({ ...form, data_pagamento: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atraso">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={form.forma_pagamento || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, forma_pagamento: v === "none" ? "" : v })
                }
              >
                <SelectTrigger id="forma_pagamento">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="debito_automatico">
                    Débito Automático
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="documento">Documento</Label>
              <Input
                id="documento"
                value={form.documento}
                onChange={(e) => setForm({ ...form, documento: e.target.value })}
                placeholder="Nº NF, recibo..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                placeholder="Apto 101..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="morador_nome">Nome Morador</Label>
              <Input
                id="morador_nome"
                value={form.morador_nome}
                onChange={(e) =>
                  setForm({ ...form, morador_nome: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) =>
                setForm({ ...form, observacoes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateTransacao.isPending}>
              {updateTransacao.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
