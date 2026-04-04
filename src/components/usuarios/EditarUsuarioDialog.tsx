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
import type { Usuario } from "@/hooks/useUsuarios";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface EditarUsuarioDialogProps {
  usuario: Usuario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userId: string, nome: string, email: string) => Promise<{ success: boolean }>;
}

export function EditarUsuarioDialog({
  usuario,
  open,
  onOpenChange,
  onSubmit,
}: EditarUsuarioDialogProps) {
  const isMobile = useIsMobile();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      setEmail(usuario.email);
    }
  }, [usuario]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[95vh] overflow-y-auto p-0",
        isMobile ? "max-w-[95vw] rounded-lg" : "sm:max-w-[425px]"
      )}>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Altere as informações do usuário abaixo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-4 py-4">
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
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
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
