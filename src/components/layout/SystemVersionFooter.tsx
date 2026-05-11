import { useSystemVersion } from "@/hooks/useSystemVersion";
import { Info } from "lucide-react";

export function SystemVersionFooter() {
  const { versionDate } = useSystemVersion();

  return (
    <footer className="w-full py-4 px-6 border-t border-border/40 bg-background/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          <span>SIGE-Condo &copy; {new Date().getFullYear()} — Todos os direitos reservados.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-secondary/50 px-2.5 py-0.5 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
            Última atualização: {versionDate}
          </span>
        </div>
      </div>
    </footer>
  );
}
