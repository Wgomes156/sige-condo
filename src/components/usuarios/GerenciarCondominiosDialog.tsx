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
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Usuario } from "@/hooks/useUsuarios";

interface Condominio {
  id: string;
  nome: string;
}

interface GerenciarCondominiosDialogProps {
  usuario: Usuario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAtribuir: (userId: string, condominioId: string) => Promise<{ success: boolean }>;
  onRemover: (userId: string, condominioId: string) => Promise<{ success: boolean }>;
}

export function GerenciarCondominiosDialog({
  usuario,
  open,
  onOpenChange,
  onAtribuir,
  onRemover,
}: GerenciarCondominiosDialogProps) {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCondominios = async () => {
      const { data } = await supabase
        .from("condominios")
        .select("id, nome")
        .order("nome");
      setCondominios(data || []);
    };

    if (open) {
      fetchCondominios();
    }
  }, [open]);

  const handleToggle = async (condominioId: string, isCurrentlyAssigned: boolean) => {
    if (!usuario) return;
    setLoading(true);
    try {
      if (isCurrentlyAssigned) {
        await onRemover(usuario.user_id, condominioId);
      } else {
        await onAtribuir(usuario.user_id, condominioId);
      }
    } finally {
      setLoading(false);
    }
  };

  const assignedIds = usuario?.condominios_acesso.map((c) => c.condominio_id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Condomínios</DialogTitle>
          <DialogDescription>
            Gerencie os condomínios que {usuario?.nome} pode acessar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {usuario?.condominios_acesso && usuario.condominios_acesso.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Condomínios atribuídos:</p>
              <div className="flex flex-wrap gap-2">
                {usuario.condominios_acesso.map((cond) => (
                  <Badge
                    key={cond.condominio_id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {cond.condominio_nome}
                    <button
                      onClick={() => handleToggle(cond.condominio_id, true)}
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
            <p className="text-sm font-medium">Todos os condomínios:</p>
            <ScrollArea className="h-[250px] border rounded-md p-2">
              {condominios.map((cond) => {
                const isAssigned = assignedIds.includes(cond.id);
                return (
                  <div
                    key={cond.id}
                    className="flex items-center justify-between py-2 px-1 hover:bg-muted rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`cond-${cond.id}`}
                        checked={isAssigned}
                        onCheckedChange={() => handleToggle(cond.id, isAssigned)}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`cond-${cond.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {cond.nome}
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
              {condominios.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum condomínio disponível
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
