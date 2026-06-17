import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Usuario } from "@/hooks/useUsuarios";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface Condominio {
  id: string;
  nome: string;
}

interface EditarUsuarioDialogProps {
  usuario: Usuario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userId: string, nome: string, email: string) => Promise<{ success: boolean }>;
  onAtribuirCondominio?: (userId: string, condominioId: string) => Promise<{ success: boolean }>;
  onRemoverCondominio?: (userId: string, condominioId: string) => Promise<{ success: boolean }>;
}

const ROLES_MULTI_COND = ["gerente", "operador", "sindico"];

export function EditarUsuarioDialog({
  usuario,
  open,
  onOpenChange,
  onSubmit,
  onAtribuirCondominio,
  onRemoverCondominio,
}: EditarUsuarioDialogProps) {
  const isMobile = useIsMobile();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loadingCond, setLoadingCond] = useState(false);

  const showCondSection =
    usuario && ROLES_MULTI_COND.includes(usuario.role) && onAtribuirCondominio && onRemoverCondominio;

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      setEmail(usuario.email);
    }
  }, [usuario]);

  useEffect(() => {
    if (open && showCondSection) {
      const fetch = async () => {
        const { data } = await supabase
          .from("condominios")
          .select("id, nome")
          .order("nome");
        setCondominios(data || []);
      };
      fetch();
    }
  }, [open, showCondSection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    setIsSubmitting(true);
    const result = await onSubmit(usuario.user_id, nome, email);
    setIsSubmitting(false);
    if (result.success) {
      onOpenChange(false);
    }
  };

  const handleToggleCond = async (condominioId: string, isAssigned: boolean) => {
    if (!usuario || !onAtribuirCondominio || !onRemoverCondominio) return;
    setLoadingCond(true);
    try {
      if (isAssigned) {
        await onRemoverCondominio(usuario.user_id, condominioId);
      } else {
        await onAtribuirCondominio(usuario.user_id, condominioId);
      }
    } finally {
      setLoadingCond(false);
    }
  };

  const assignedIds = usuario?.condominios_acesso.map((c) => c.condominio_id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[95vh] overflow-y-auto p-0",
        isMobile ? "max-w-[95vw] rounded-lg" : "sm:max-w-[500px]"
      )}>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Altere as informações do usuário abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
          </div>

          {showCondSection && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">Condomínios de Acesso</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Marque os condomínios que este {usuario.role} pode acessar.
                </p>

                {assignedIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {usuario.condominios_acesso.map((cond) => (
                      <Badge
                        key={cond.condominio_id}
                        variant="secondary"
                        className="flex items-center gap-1 text-xs"
                      >
                        {cond.condominio_nome}
                        <button
                          type="button"
                          onClick={() => handleToggleCond(cond.condominio_id, true)}
                          disabled={loadingCond}
                          className="ml-0.5 hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <ScrollArea className="h-[180px] border rounded-md p-2">
                  {condominios.map((cond) => {
                    const isAssigned = assignedIds.includes(cond.id);
                    return (
                      <div
                        key={cond.id}
                        className="flex items-center justify-between py-2 px-1 hover:bg-muted rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-cond-${cond.id}`}
                            checked={isAssigned}
                            onCheckedChange={() => handleToggleCond(cond.id, isAssigned)}
                            disabled={loadingCond}
                          />
                          <label
                            htmlFor={`edit-cond-${cond.id}`}
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
                <p className="text-xs text-muted-foreground">
                  {assignedIds.length === 0
                    ? "Nenhum condomínio atribuído — o usuário não terá acesso a nenhum."
                    : `${assignedIds.length} condomínio(s) atribuído(s).`}
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-12 sm:h-10 text-base"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 sm:h-10 text-base font-bold"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
