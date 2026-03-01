import { useState, useEffect } from "react";
import { Download, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Anexo, getAnexoUrl, isImageFile, isPdfFile } from "@/hooks/useAnexos";

interface AnexoViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anexo: Anexo;
}

export function AnexoViewer({ open, onOpenChange, anexo }: AnexoViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);

  useEffect(() => {
    if (open && anexo) {
      setIsLoadingUrl(true);
      setLoadError(false);
      getAnexoUrl(anexo.storage_path)
        .then((signedUrl) => {
          setUrl(signedUrl);
          setIsLoadingUrl(false);
        })
        .catch(() => {
          setLoadError(true);
          setIsLoadingUrl(false);
        });
    }
  }, [open, anexo]);

  const handleDownload = () => {
    if (url) window.open(url, "_blank");
  };

  const handleOpenInNewTab = () => {
    if (url) window.open(url, "_blank");
  };

  const renderContent = () => {
    if (isLoadingUrl) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Carregando arquivo...</p>
        </div>
      );
    }

    if (loadError || !url) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-center">
            Não foi possível carregar o arquivo.
            <br />
            O arquivo pode estar corrompido ou inacessível.
          </p>
          <Button variant="outline" onClick={handleDownload} disabled={!url}>
            <Download className="h-4 w-4 mr-2" />
            Tentar download
          </Button>
        </div>
      );
    }

    if (isImageFile(anexo.tipo_arquivo)) {
      return (
        <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
          <img
            src={url}
            alt={anexo.nome_arquivo}
            className="max-w-full max-h-[70vh] object-contain rounded-md"
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    if (isPdfFile(anexo.tipo_arquivo)) {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={`${url}#toolbar=1`}
            className="w-full h-full rounded-md border"
            title={anexo.nome_arquivo}
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
        <p>Visualização não disponível para este tipo de arquivo.</p>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Baixar arquivo
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="truncate">{anexo.nome_arquivo}</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleOpenInNewTab} 
                title="Abrir em nova aba"
                disabled={isLoadingUrl || !url}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDownload} 
                title="Baixar"
                disabled={isLoadingUrl || !url}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
