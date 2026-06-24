import { useRef } from "react";
import { Upload, X, Eye, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UploadPdfFieldProps {
  label: string;
  savedPath: string | null | undefined;
  selectedFile: File | null;
  markedForDelete: boolean;
  onFileSelect: (file: File) => void;
  onClearSelection: () => void;
  onMarkForDelete: () => void;
  onCancelDelete?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function UploadPdfField({
  label,
  savedPath,
  selectedFile,
  markedForDelete,
  onFileSelect,
  onClearSelection,
  onMarkForDelete,
  onCancelDelete,
}: UploadPdfFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      e.target.value = "";
      return;
    }
    onFileSelect(file);
  };

  const handleView = async () => {
    if (!savedPath) return;
    const { data, error } = await supabase.storage
      .from("anexos")
      .createSignedUrl(savedPath, 300);
    if (error || !data) {
      toast.error("Não foi possível abrir o arquivo. Tente novamente.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".pdf"
      className="hidden"
      onChange={handleChange}
    />
  );

  const dropzone = (
    <div
      className="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer border-muted-foreground/25 hover:border-primary/50"
      onClick={() => inputRef.current?.click()}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Upload className="h-8 w-8" />
        <span className="text-sm">Clique para selecionar {label}</span>
        <span className="text-xs">Apenas PDF (máx. 10MB)</span>
      </div>
    </div>
  );

  // Estado: arquivo novo selecionado (prioridade máxima)
  if (selectedFile) {
    return (
      <div className="space-y-2">
        {fileInput}
        <p className="text-sm font-medium leading-none">{label}</p>
        <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 transition-colors">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {formatBytes(selectedFile.size)}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Cancelar seleção"
            onClick={() => {
              onClearSelection();
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const fileName = savedPath ? (savedPath.split("/").pop() ?? savedPath) : null;

  // Estado: arquivo salvo marcado para exclusão
  if (savedPath && markedForDelete) {
    return (
      <div className="space-y-2">
        {fileInput}
        <p className="text-sm font-medium leading-none">{label}</p>
        <div className="flex items-center justify-between p-3 border border-destructive/30 rounded-lg bg-red-50 dark:bg-destructive/10 transition-colors">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-destructive">{fileName}</p>
              <p className="text-xs text-destructive">Arquivo será removido ao salvar</p>
            </div>
          </div>
          {onCancelDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={onCancelDelete}
            >
              Cancelar
            </Button>
          )}
        </div>
        {dropzone}
      </div>
    );
  }

  // Estado: arquivo salvo (não marcado para exclusão)
  if (savedPath) {
    return (
      <div className="space-y-2">
        {fileInput}
        <p className="text-sm font-medium leading-none">{label}</p>
        {dropzone}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleView}
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMarkForDelete}
              title="Remover"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Estado: vazio
  return (
    <div className="space-y-2">
      {fileInput}
      <p className="text-sm font-medium leading-none">{label}</p>
      {dropzone}
    </div>
  );
}
