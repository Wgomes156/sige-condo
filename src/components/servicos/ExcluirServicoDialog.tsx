import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Servico } from "@/hooks/useServicos";

interface ExcluirServicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico: Servico | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function ExcluirServicoDialog({
  open,
  onOpenChange,
  servico,
  onConfirm,
  loading,
}: ExcluirServicoDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o serviço{" "}
            <strong>{servico?.nome_servico}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. Todo o histórico de alterações
            também será removido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
