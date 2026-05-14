import { Badge } from "@/components/ui/badge";
import type { StatusEntrega } from "@/hooks/useMensageria";

interface Props {
  status: StatusEntrega;
}

const CONFIG: Record<StatusEntrega, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className: "bg-muted text-muted-foreground border-border hover:bg-muted",
  },
  enviando: {
    label: "Enviando",
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  },
  enviado: {
    label: "Enviado",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  falhou: {
    label: "Falhou",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  },
  lido: {
    label: "Lido",
    className: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

export function EntregaStatusBadge({ status }: Props) {
  const config = CONFIG[status] ?? CONFIG.pendente;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
