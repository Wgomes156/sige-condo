import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAnimal, useDeleteAnimal, useUpdateAnimalPhoto, useUpdateAnimal, type AnimalUnidade, type PorteAnimal } from "@/hooks/useUnidadesCompleto";
import { Plus, Save, X, Trash2, PawPrint, Search, Upload, Loader2, ImageIcon, Camera, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnimaisInlineFormProps {
  unidadeId: string;
  animais: AnimalUnidade[];
}

const porteLabels: Record<PorteAnimal, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function AnimaisInlineForm({ unidadeId, animais }: AnimaisInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  const createAnimal = useCreateAnimal();
  const deleteAnimal = useDeleteAnimal();
  const updateAnimalPhoto = useUpdateAnimalPhoto();
  const updateAnimal = useUpdateAnimal();

  const [formData, setFormData] = useState({
    nome: "",
    especie: "",
    raca: "",
    porte: "medio" as PorteAnimal,
    observacoes: "",
  });

  const isEditing = !!editingId;

  const filteredAnimais = useMemo(() => {
    if (!searchTerm.trim()) return animais;
    const term = searchTerm.toLowerCase();
    return animais.filter((a) =>
      a.nome.toLowerCase().includes(term) ||
      a.especie.toLowerCase().includes(term) ||
      (a.raca?.toLowerCase().includes(term)) ||
      (a.observacoes?.toLowerCase().includes(term))
    );
  }, [animais, searchTerm]);

  const resetForm = () => {
    setFormData({
      nome: "",
      especie: "",
      raca: "",
      porte: "medio",
      observacoes: "",
    });
    setSelectedFile(null);
    if (previewUrl && !previewUrl.startsWith('http')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setExistingPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsAdding(false);
    setEditingId(null);
  };

  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  const handleEdit = (animal: AnimalUnidade) => {
    setEditingId(animal.id);
    // Garante que o input de arquivo não fique com um valor antigo (senão o onChange pode não disparar)
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFormData({
      nome: animal.nome,
      especie: animal.especie,
      raca: animal.raca || "",
      porte: animal.porte,
      observacoes: animal.observacoes || "",
    });
    if (animal.foto_url) {
      setPreviewUrl(animal.foto_url);
      setExistingPhotoUrl(animal.foto_url);
    } else {
      setExistingPhotoUrl(null);
    }
    setIsAdding(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
      return;
    }

    setSelectedFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${unidadeId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    console.log('Uploading photo:', fileName, 'File size:', file.size);

    const { error, data } = await supabase.storage
      .from('animais-fotos')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload da foto: ' + error.message);
      throw new Error('Erro ao fazer upload da foto');
    }

    console.log('Upload success:', data);

    const { data: urlData } = supabase.storage
      .from('animais-fotos')
      .getPublicUrl(fileName);

    console.log('Public URL:', urlData.publicUrl);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.especie.trim()) return;

    setIsUploading(true);
    try {
      let fotoUrl: string | null = null;
      
      // Capture the file reference before any async operations
      const fileToUpload = selectedFile;
      
      if (fileToUpload) {
        console.log('Starting photo upload for file:', fileToUpload.name);
        fotoUrl = await uploadPhoto(fileToUpload);
        console.log('Photo uploaded, URL:', fotoUrl);
      }

      if (isEditing && editingId) {
        // Update existing animal - salva nova foto (se houver) ou preserva a foto existente
        const updateData: any = {
          id: editingId,
          nome: formData.nome,
          especie: formData.especie,
          raca: formData.raca || null,
          porte: formData.porte,
          observacoes: formData.observacoes || null,
        };

        // Sempre setar foto_url quando estiver editando:
        // - se fez upload agora, usa a nova URL
        // - senão, preserva a URL existente (se houver)
        // (evita cenários em que a foto some após editar outros campos)
        updateData.foto_url = fotoUrl ?? existingPhotoUrl;
        
        console.log('Updating animal:', updateData);
        await updateAnimal.mutateAsync(updateData);
      } else {
        // Create new animal
        console.log('Creating animal with foto_url:', fotoUrl);
        await createAnimal.mutateAsync({
          unidade_id: unidadeId,
          nome: formData.nome,
          especie: formData.especie,
          raca: formData.raca || null,
          porte: formData.porte,
          observacoes: formData.observacoes || null,
          foto_url: fotoUrl,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving animal:', error);
      toast.error('Erro ao salvar animal');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este animal?")) {
      await deleteAnimal.mutateAsync(id);
    }
  };

  const handleEditPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPhotoId) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${unidadeId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('animais-fotos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('animais-fotos')
        .getPublicUrl(fileName);

      await updateAnimalPhoto.mutateAsync({
        id: editingPhotoId,
        foto_url: urlData.publicUrl,
      });
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error('Erro ao atualizar foto');
    } finally {
      setIsUploading(false);
      setEditingPhotoId(null);
      if (editFileInputRef.current) {
        editFileInputRef.current.value = '';
      }
    }
  };

  const triggerEditPhoto = (animalId: string) => {
    setEditingPhotoId(animalId);
    editFileInputRef.current?.click();
  };

  const removePhoto = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden input for editing existing animal photos */}
      <input
        ref={editFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleEditPhotoSelect}
      />
      
      {animais.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, espécie, raça..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {filteredAnimais.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum animal encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {filteredAnimais.map((a) => (
                <div key={a.id} className="flex items-start justify-between text-sm border-b pb-2">
                  <div className="flex items-start gap-3">
                    <div className="relative group">
                      {a.foto_url ? (
                        <img 
                          src={a.foto_url} 
                          alt={a.nome}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <PawPrint className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute -bottom-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        onClick={() => triggerEditPhoto(a.id)}
                        disabled={isUploading && editingPhotoId === a.id}
                        title="Atualizar foto"
                      >
                        {isUploading && editingPhotoId === a.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Camera className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div>
                      <p className="font-medium">{a.nome}</p>
                      <p className="text-muted-foreground text-xs">
                        {a.especie} {a.raca && `• ${a.raca}`} • Porte {porteLabels[a.porte]}
                      </p>
                      {a.observacoes && (
                        <p className="text-muted-foreground text-xs mt-1 italic">
                          {a.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEdit(a)}
                      title="Editar animal"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isAdding ? (
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Animal
        </Button>
      ) : (
        <div className="border rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-medium">{isEditing ? "Editar Animal" : "Novo Animal"}</h4>
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-xs">Foto do Pet</Label>
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5"
                    onClick={removePhoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Foto</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileSelect}
              />
              {!previewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Foto
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP ou GIF (máx. 5MB)
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input
                placeholder="Nome do animal"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Espécie *</Label>
              <Input
                placeholder="Ex: Cachorro, Gato"
                value={formData.especie}
                onChange={(e) => setFormData({ ...formData, especie: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Raça</Label>
              <Input
                placeholder="Ex: Labrador"
                value={formData.raca}
                onChange={(e) => setFormData({ ...formData, raca: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Porte</Label>
              <Select
                value={formData.porte}
                onValueChange={(v) => setFormData({ ...formData, porte: v as PorteAnimal })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequeno">Pequeno</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea
              placeholder="Ex: Vacinado, dócil, não late..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isUploading || createAnimal.isPending || updateAnimal.isPending || !formData.nome.trim() || !formData.especie.trim()}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditing ? "Atualizar" : "Salvar"}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm} disabled={isUploading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
