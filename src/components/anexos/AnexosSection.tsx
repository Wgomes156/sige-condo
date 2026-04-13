import { Paperclip } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AnexoUploader } from "./AnexoUploader";
import { AnexosList } from "./AnexosList";

interface AnexosSectionProps {
  entidadeTipo: "condominio" | "atendimento" | "ordem_servico" | "ocorrencia_condominio" | "atendimento_historico";
  entidadeId: string | null;
  showUploader?: boolean;
  showDelete?: boolean;
}

export function AnexosSection({
  entidadeTipo,
  entidadeId,
  showUploader = true,
  showDelete = true,
}: AnexosSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Paperclip className="h-5 w-5" />
        Documentos / Anexos
      </h3>
      <Separator />

      {showUploader && entidadeId && (
        <AnexoUploader entidadeTipo={entidadeTipo} entidadeId={entidadeId} />
      )}

      <AnexosList
        entidadeTipo={entidadeTipo}
        entidadeId={entidadeId}
        showDelete={showDelete}
      />
    </div>
  );
}
