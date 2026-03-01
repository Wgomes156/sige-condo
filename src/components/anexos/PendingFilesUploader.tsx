import { useRef, useState } from "react";
import { Upload, Loader2, X, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export interface PendingFile {
  id: string;
  file: File;
  preview?: string;
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PendingFilesUploaderProps {
  pendingFiles: PendingFile[];
  onFilesChange: (files: PendingFile[]) => void;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function PendingFilesUploader({ 
  pendingFiles, 
  onFilesChange, 
  disabled 
}: PendingFilesUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error(`Tipo de arquivo não permitido: ${file.name}. Use PDF, JPG, PNG, BMP ou GIF.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Arquivo muito grande: ${file.name}. Tamanho máximo: 10MB`);
      return false;
    }
    return true;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: PendingFile[] = [];
    
    for (const file of Array.from(files)) {
      if (validateFile(file)) {
        const preview = isImageFile(file.type) 
          ? URL.createObjectURL(file) 
          : undefined;
        
        newFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
        });
      }
    }

    if (newFiles.length > 0) {
      onFilesChange([...pendingFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const file = pendingFiles.find(f => f.id === fileId);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFilesChange(pendingFiles.filter(f => f.id !== fileId));
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

  const getFileIcon = (mimeType: string) => {
    if (isImageFile(mimeType)) return <Image className="h-4 w-4 text-blue-500" />;
    return <FileText className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Upload className="h-5 w-5" />
        Anexos
      </h3>
      <Separator />

      {/* Dropzone */}
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
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Upload className="h-8 w-8" />
          <span className="text-sm">
            Arraste arquivos aqui ou clique para selecionar
          </span>
          <span className="text-xs">
            PDF, JPG, PNG, BMP, GIF (máx. 10MB)
          </span>
        </div>
      </div>

      {/* Pending files list */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {pendingFiles.length} arquivo(s) pendente(s) - serão enviados ao salvar
          </p>
          {pendingFiles.map((pf) => (
            <div
              key={pf.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {pf.preview ? (
                  <img 
                    src={pf.preview} 
                    alt={pf.file.name} 
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  getFileIcon(pf.file.type)
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pf.file.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(pf.file.size)}
                  </Badge>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(pf.id);
                }}
                disabled={disabled}
                title="Remover"
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
