import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadAnexo } from "@/hooks/useAnexos";

interface AnexoUploaderProps {
  entidadeTipo: "condominio" | "atendimento" | "ordem_servico" | "ocorrencia_condominio";
  entidadeId: string;
  disabled?: boolean;
}

export function AnexoUploader({ entidadeTipo, entidadeId, disabled }: AnexoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadAnexo = useUploadAnexo();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      await uploadAnexo.mutateAsync({
        file,
        entidadeTipo,
        entidadeId,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.bmp,.gif"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled || uploadAnexo.isPending}
      />
      
      {uploadAnexo.isPending ? (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Enviando arquivo...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Upload className="h-8 w-8" />
          <span className="text-sm">
            Arraste arquivos aqui ou clique para selecionar
          </span>
          <span className="text-xs">
            PDF, JPG, PNG, BMP, GIF (máx. 10MB)
          </span>
        </div>
      )}
    </div>
  );
}
