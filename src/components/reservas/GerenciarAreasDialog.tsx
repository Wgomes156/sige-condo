import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useAllAreasComuns, useCreateAreaComum, useUpdateAreaComum, useDeleteAreaComum, AreaComum } from "@/hooks/useAreasComuns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarAreasDialog({ open, onOpenChange }: Props) {
  const { data: condominios } = useCondominios();
  const [condominioId, setCondominioId] = useState("");
  const { data: areas } = useAllAreasComuns(condominioId || undefined);
  const createArea = useCreateAreaComum();
  const updateArea = useUpdateAreaComum();
  const deleteArea = useDeleteAreaComum();

  const [editando, setEditando] = useState<AreaComum | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", capacidade: "", valor_taxa: "", regras: "", ativa: true });

  const resetForm = () => {
    setForm({ nome: "", descricao: "", capacidade: "", valor_taxa: "", regras: "", ativa: true });
    setEditando(null);
  };

  const iniciarEdicao = (area: AreaComum) => {
    setEditando(area);
    setForm({
      nome: area.nome,
      descricao: area.descricao || "",
      capacidade: area.capacidade?.toString() || "",
      valor_taxa: area.valor_taxa?.toString() || "",
      regras: area.regras || "",
      ativa: area.ativa ?? true,
    });
  };

  const salvar = () => {
    if (!form.nome) return;
    const payload = {
      nome: form.nome,
      descricao: form.descricao || null,
      capacidade: form.capacidade ? parseInt(form.capacidade) : null,
      valor_taxa: form.valor_taxa ? parseFloat(form.valor_taxa) : 0,
      regras: form.regras || null,
      ativa: form.ativa,
    };

    if (editando) {
      updateArea.mutate({ id: editando.id, ...payload }, { onSuccess: resetForm });
    } else {
      if (!condominioId) return;
      createArea.mutate({ ...payload, condominio_id: condominioId }, { onSuccess: resetForm });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Áreas Comuns</DialogTitle>
          <DialogDescription>Cadastre e gerencie as áreas comuns disponíveis para reserva.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={condominioId} onValueChange={setCondominioId}>
            <SelectTrigger><SelectValue placeholder="Selecione o condomínio" /></SelectTrigger>
            <SelectContent>
              {condominios?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {condominioId && (
            <>
              {/* Formulário */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">{editando ? "Editar Área" : "Nova Área"}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome *</Label>
                    <Input value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Churrasqueira" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Capacidade</Label>
                    <Input type="number" value={form.capacidade} onChange={(e) => setForm(f => ({ ...f, capacidade: e.target.value }))} placeholder="Nº de pessoas" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Taxa (R$)</Label>
                    <Input type="number" step="0.01" value={form.valor_taxa} onChange={(e) => setForm(f => ({ ...f, valor_taxa: e.target.value }))} placeholder="0,00" />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch checked={form.ativa} onCheckedChange={(v) => setForm(f => ({ ...f, ativa: v }))} />
                    <Label className="text-xs">Ativa</Label>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrição</Label>
                  <Textarea value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Regras de Uso</Label>
                  <Textarea value={form.regras} onChange={(e) => setForm(f => ({ ...f, regras: e.target.value }))} rows={2} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={salvar} disabled={!form.nome}>
                    {editando ? "Salvar" : <><Plus className="h-4 w-4 mr-1" /> Adicionar</>}
                  </Button>
                  {editando && <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>}
                </div>
              </div>

              {/* Lista */}
              {areas && areas.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Capacidade</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areas.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.nome}</TableCell>
                        <TableCell>{a.capacidade || "—"}</TableCell>
                        <TableCell>{a.valor_taxa ? `R$ ${Number(a.valor_taxa).toFixed(2)}` : "Gratuito"}</TableCell>
                        <TableCell>
                          <Badge variant={a.ativa ? "default" : "secondary"}>
                            {a.ativa ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => iniciarEdicao(a)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteArea.mutate(a.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
