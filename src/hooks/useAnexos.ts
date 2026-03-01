import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Anexo {
  id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho: number;
  storage_path: string;
  entidade_tipo: string;
  entidade_id: string;
  criado_por: string | null;
  created_at: string;
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useAnexos(entidadeTipo: string, entidadeId: string | null) {
  return useQuery({
    queryKey: ["anexos", entidadeTipo, entidadeId],
    queryFn: async () => {
      if (!entidadeId) return [];
      
      const { data, error } = await supabase
        .from("anexos")
        .select("*")
        .eq("entidade_tipo", entidadeTipo)
        .eq("entidade_id", entidadeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Anexo[];
    },
    enabled: !!entidadeId,
  });
}

export function useUploadAnexo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      entidadeTipo,
      entidadeId,
    }: {
      file: File;
      entidadeTipo: string;
      entidadeId: string;
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
      const fileName = `${entidadeTipo}/${entidadeId}/${timestamp}.${fileExt}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("anexos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Registrar na tabela
      const { data, error } = await supabase
        .from("anexos")
        .insert({
          nome_arquivo: file.name,
          tipo_arquivo: file.type,
          tamanho: file.size,
          storage_path: fileName,
          entidade_tipo: entidadeTipo,
          entidade_id: entidadeId,
          criado_por: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["anexos", variables.entidadeTipo, variables.entidadeId],
      });
      toast.success("Arquivo anexado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao anexar arquivo");
    },
  });
}

// Upload multiple files for a newly created entity
export async function uploadPendingFiles(
  files: File[],
  entidadeTipo: string,
  entidadeId: string
): Promise<{ success: number; failed: number }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Usuário não autenticado");

  let success = 0;
  let failed = 0;

  for (const file of files) {
    try {
      // Validate
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        failed++;
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        failed++;
        continue;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${entidadeTipo}/${entidadeId}/${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("anexos")
        .upload(fileName, file);

      if (uploadError) {
        failed++;
        continue;
      }

      // Register in table
      const { error } = await supabase
        .from("anexos")
        .insert({
          nome_arquivo: file.name,
          tipo_arquivo: file.type,
          tamanho: file.size,
          storage_path: fileName,
          entidade_tipo: entidadeTipo,
          entidade_id: entidadeId,
          criado_por: userData.user.id,
        });

      if (error) {
        // Try to clean up the uploaded file
        await supabase.storage.from("anexos").remove([fileName]);
        failed++;
      } else {
        success++;
      }
    } catch {
      failed++;
    }
  }

  return { success, failed };
}

export function useDeleteAnexo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (anexo: Anexo) => {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from("anexos")
        .remove([anexo.storage_path]);

      if (storageError) throw storageError;

      // Deletar registro
      const { error } = await supabase
        .from("anexos")
        .delete()
        .eq("id", anexo.id);

      if (error) throw error;
    },
    onSuccess: (_, anexo) => {
      queryClient.invalidateQueries({
        queryKey: ["anexos", anexo.entidade_tipo, anexo.entidade_id],
      });
      toast.success("Arquivo removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover arquivo");
    },
  });
}

export async function getAnexoUrl(storagePath: string): Promise<string> {
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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}
