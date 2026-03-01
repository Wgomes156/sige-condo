import { useState } from "react";
import { Eye, Trash2, FileText, Image, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  useAnexos,
  useDeleteAnexo,
  formatFileSize,
  isImageFile,
  isPdfFile,
  Anexo,
} from "@/hooks/useAnexos";
import { AnexoViewer } from "./AnexoViewer";

interface AnexosListProps {
  entidadeTipo: "condominio" | "atendimento" | "ordem_servico" | "ocorrencia_condominio";
  entidadeId: string | null;
  showDelete?: boolean;
}

export function AnexosList({ entidadeTipo, entidadeId, showDelete = true }: AnexosListProps) {
  const { data: anexos, isLoading, error } = useAnexos(entidadeTipo, entidadeId);
  const deleteAnexo = useDeleteAnexo();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedAnexo, setSelectedAnexo] = useState<Anexo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anexoToDelete, setAnexoToDelete] = useState<Anexo | null>(null);

  const handleView = (anexo: Anexo) => {
    setSelectedAnexo(anexo);
    setViewerOpen(true);
  };

  const handleDeleteClick = (anexo: Anexo) => {
    setAnexoToDelete(anexo);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (anexoToDelete) {
      await deleteAnexo.mutateAsync(anexoToDelete);
      setDeleteDialogOpen(false);
      setAnexoToDelete(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (isImageFile(mimeType)) return <Image className="h-4 w-4 text-blue-500" />;
    if (isPdfFile(mimeType)) return <FileText className="h-4 w-4 text-red-500" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  if (!entidadeId) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Salve o registro para poder anexar arquivos
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Erro ao carregar anexos</span>
      </div>
    );
  }

  if (!anexos || anexos.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4 text-sm">
        Nenhum arquivo anexado
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {anexos.map((anexo) => (
          <div
            key={anexo.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(anexo.tipo_arquivo)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{anexo.nome_arquivo}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(anexo.tamanho)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(anexo.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(anexo)}
                title="Visualizar"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {showDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(anexo)}
                  disabled={deleteAnexo.isPending}
                  title="Excluir"
                >
                  {deleteAnexo.isPending && anexoToDelete?.id === anexo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Viewer Modal */}
      {selectedAnexo && (
        <AnexoViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          anexo={selectedAnexo}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o arquivo "{anexoToDelete?.nome_arquivo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
