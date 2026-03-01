import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Usuario } from "@/hooks/useUsuarios";

interface Unidade {
  id: string;
  codigo: string;
  condominio_nome: string;
}

interface GerenciarUnidadesDialogProps {
  usuario: Usuario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAtribuir: (
    userId: string,
    unidadeId: string,
    tipoMorador: string
  ) => Promise<{ success: boolean }>;
  onRemover: (userId: string, unidadeId: string) => Promise<{ success: boolean }>;
}

export function GerenciarUnidadesDialog({
  usuario,
  open,
  onOpenChange,
  onAtribuir,
  onRemover,
}: GerenciarUnidadesDialogProps) {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [tipoMorador, setTipoMorador] = useState<string>("proprietario");

  useEffect(() => {
    const fetchUnidades = async () => {
      const { data } = await supabase
        .from("unidades")
        .select(`
          id, 
          codigo,
          condominios:condominio_id (nome)
        `)
        .order("codigo");

      const formatted =
        data?.map((u) => ({
          id: u.id,
          codigo: u.codigo,
          condominio_nome: (u.condominios as any)?.nome || "Desconhecido",
        })) || [];

      setUnidades(formatted);
    };

    if (open) {
      fetchUnidades();
    }
  }, [open]);

  const handleToggle = async (unidadeId: string, isCurrentlyAssigned: boolean) => {
    if (!usuario) return;
    setLoading(true);
    try {
      if (isCurrentlyAssigned) {
        await onRemover(usuario.user_id, unidadeId);
      } else {
        await onAtribuir(usuario.user_id, unidadeId, tipoMorador);
      }
    } finally {
      setLoading(false);
    }
  };

  const assignedIds = usuario?.unidades_acesso.map((u) => u.unidade_id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Unidades</DialogTitle>
          <DialogDescription>
            Gerencie as unidades que {usuario?.nome} pode acessar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {usuario?.unidades_acesso && usuario.unidades_acesso.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Unidades atribuídas:</p>
              <div className="flex flex-wrap gap-2">
                {usuario.unidades_acesso.map((unid) => (
                  <Badge
                    key={unid.unidade_id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {unid.unidade_codigo} ({unid.tipo_morador})
                    <button
                      onClick={() => handleToggle(unid.unidade_id, true)}
                      className="ml-1 hover:text-destructive"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Tipo de morador para novas atribuições:</p>
              <Select value={tipoMorador} onValueChange={setTipoMorador}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proprietario">Proprietário</SelectItem>
                  <SelectItem value="inquilino">Inquilino</SelectItem>
                  <SelectItem value="dependente">Dependente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Todas as unidades:</p>
            <ScrollArea className="h-[250px] border rounded-md p-2">
              {unidades.map((unid) => {
                const isAssigned = assignedIds.includes(unid.id);
                return (
                  <div
                    key={unid.id}
                    className="flex items-center justify-between py-2 px-1 hover:bg-muted rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`unid-${unid.id}`}
                        checked={isAssigned}
                        onCheckedChange={() => handleToggle(unid.id, isAssigned)}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`unid-${unid.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {unid.codigo}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({unid.condominio_nome})
                        </span>
                      </label>
                    </div>
                    {isAssigned && (
                      <Badge variant="outline" className="text-xs">
                        Atribuído
                      </Badge>
                    )}
                  </div>
                );
              })}
              {unidades.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma unidade disponível
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
