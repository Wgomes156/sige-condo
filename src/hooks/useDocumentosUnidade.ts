import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentoUnidade {
  id: string;
  unidade_id: string;
  tipo_documento: string;
  nome_arquivo: string;
  storage_path: string;
  tamanho: number | null;
  tipo_arquivo: string | null;
  criado_por: string | null;
  created_at: string | null;
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const TIPOS_DOCUMENTO = [
  { value: 'procuracao', label: 'Procuração' },
  { value: 'contrato_locacao', label: 'Contrato de Locação' },
  { value: 'escritura', label: 'Escritura' },
  { value: 'matricula', label: 'Matrícula do Imóvel' },
  { value: 'iptu', label: 'IPTU' },
  { value: 'comprovante_residencia', label: 'Comprovante de Residência' },
  { value: 'outro', label: 'Outro' },
];

export function useDocumentosUnidade(unidadeId: string | null) {
  return useQuery({
    queryKey: ["documentos_unidade", unidadeId],
    queryFn: async () => {
      if (!unidadeId) return [];
      
      const { data, error } = await supabase
        .from("documentos_unidade")
        .select("*")
        .eq("unidade_id", unidadeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DocumentoUnidade[];
    },
    enabled: !!unidadeId,
  });
}

export function useUploadDocumentoUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      unidadeId,
      tipoDocumento,
    }: {
      file: File;
      unidadeId: string;
      tipoDocumento: string;
    }) => {
      // Validar tipo de arquivo
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        throw new Error("Tipo de arquivo não permitido. Use PDF, JPG, PNG, BMP ou GIF.");
      }

      // Validar tamanho
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Arquivo muito grande. Tamanho máximo: 10MB");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `documentos_unidade/${unidadeId}/${timestamp}.${fileExt}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("anexos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Registrar na tabela
      const { data, error } = await supabase
        .from("documentos_unidade")
        .insert({
          unidade_id: unidadeId,
          tipo_documento: tipoDocumento,
          nome_arquivo: file.name,
          storage_path: fileName,
          tamanho: file.size,
          tipo_arquivo: file.type,
          criado_por: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documentos_unidade", variables.unidadeId],
      });
      toast.success("Documento enviado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar documento");
    },
  });
}

export function useDeleteDocumentoUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documento: DocumentoUnidade) => {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from("anexos")
        .remove([documento.storage_path]);

      if (storageError) throw storageError;

      // Deletar registro
      const { error } = await supabase
        .from("documentos_unidade")
        .delete()
        .eq("id", documento.id);

      if (error) throw error;
    },
    onSuccess: (_, documento) => {
      queryClient.invalidateQueries({
        queryKey: ["documentos_unidade", documento.unidade_id],
      });
      toast.success("Documento removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover documento");
    },
  });
}

export async function getDocumentoUrl(storagePath: string): Promise<string> {
  // Use signed URLs for private bucket access
  const { data, error } = await supabase.storage
    .from("anexos")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry
  
  if (error || !data) {
    console.error("Error creating signed URL:", error);
    return "";
  }
  return data.signedUrl;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getTipoDocumentoLabel(tipo: string): string {
  const found = TIPOS_DOCUMENTO.find(t => t.value === tipo);
  return found?.label || tipo;
}
