import { useRef, useState } from "react";
import { Upload, Loader2, FileText, Trash2, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  useDocumentosUnidade,
  useUploadDocumentoUnidade,
  useDeleteDocumentoUnidade,
  getDocumentoUrl,
  formatFileSize,
  getTipoDocumentoLabel,
  TIPOS_DOCUMENTO,
  DocumentoUnidade,
} from "@/hooks/useDocumentosUnidade";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DocumentosInlineFormProps {
  unidadeId: string;
}

export function DocumentosInlineForm({ unidadeId }: DocumentosInlineFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState("procuracao");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);

  const { data: documentos, isLoading } = useDocumentosUnidade(unidadeId);
  const uploadDocumento = useUploadDocumentoUnidade();
  const deleteDocumento = useDeleteDocumentoUnidade();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      await uploadDocumento.mutateAsync({
        file,
        unidadeId,
        tipoDocumento,
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

  const handlePreview = async (documento: DocumentoUnidade) => {
    const url = await getDocumentoUrl(documento.storage_path);
    if (url) {
      const isPdf = documento.tipo_arquivo === "application/pdf";
      setPreviewUrl(url);
      setPreviewType(isPdf ? "pdf" : "image");
    }
  };

  const handleDownload = async (documento: DocumentoUnidade) => {
    const url = await getDocumentoUrl(documento.storage_path);
    if (url) {
      window.open(url, "_blank");
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando documentos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Seletor de tipo + Upload */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_DOCUMENTO.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          } ${uploadDocumento.isPending ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploadDocumento.isPending && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.bmp,.gif"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploadDocumento.isPending}
          />

          {uploadDocumento.isPending ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="h-6 w-6" />
              <span className="text-sm">Arraste ou clique para enviar</span>
              <span className="text-xs">PDF, JPG, PNG, BMP, GIF (máx. 10MB)</span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de documentos */}
      {documentos && documentos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Documentos anexados ({documentos.length})
          </p>
          <div className="space-y-2">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.nome_arquivo}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="bg-primary/10 px-1.5 py-0.5 rounded">
                        {getTipoDocumentoLabel(doc.tipo_documento)}
                      </span>
                      <span>{formatFileSize(doc.tamanho)}</span>
                      {doc.created_at && (
                        <span>
                          {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePreview(doc)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(doc)}
                    title="Baixar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir documento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir "{doc.nome_arquivo}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteDocumento.mutate(doc)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documentos?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhum documento anexado
        </p>
      )}

      {/* Modal de preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Documento</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[400px]">
            {previewType === "pdf" ? (
              <iframe
                src={previewUrl || ""}
                className="w-full h-[70vh] rounded-lg"
                title="PDF Preview"
              />
            ) : (
              <img
                src={previewUrl || ""}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
