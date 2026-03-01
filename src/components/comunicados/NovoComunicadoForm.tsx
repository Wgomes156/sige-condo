import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCondominios } from "@/hooks/useCondominios";
import { useCreateComunicado, useUpdateComunicado, Comunicado } from "@/hooks/useComunicados";
import { useEffect } from "react";

const formSchema = z.object({
  condominio_id: z.string().min(1, "Selecione um condomínio"),
  titulo: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  conteudo: z.string().min(10, "O conteúdo deve ter pelo menos 10 caracteres"),
  tipo: z.enum(["aviso", "urgente", "manutencao", "assembleia", "financeiro"]),
  data_expiracao: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NovoComunicadoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comunicadoEdit?: Comunicado | null;
}

const tipoOptions = [
  { value: "aviso", label: "Aviso" },
  { value: "urgente", label: "Urgente" },
  { value: "manutencao", label: "Manutenção" },
  { value: "assembleia", label: "Assembleia" },
  { value: "financeiro", label: "Financeiro" },
];

export function NovoComunicadoForm({ open, onOpenChange, comunicadoEdit }: NovoComunicadoFormProps) {
  const { data: condominios } = useCondominios();
  const createComunicado = useCreateComunicado();
  const updateComunicado = useUpdateComunicado();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      condominio_id: "",
      titulo: "",
      conteudo: "",
      tipo: "aviso",
      data_expiracao: "",
    },
  });

  useEffect(() => {
    if (comunicadoEdit) {
      form.reset({
        condominio_id: comunicadoEdit.condominio_id,
        titulo: comunicadoEdit.titulo,
        conteudo: comunicadoEdit.conteudo,
        tipo: comunicadoEdit.tipo,
        data_expiracao: comunicadoEdit.data_expiracao?.split("T")[0] || "",
      });
    } else {
      form.reset({
        condominio_id: "",
        titulo: "",
        conteudo: "",
        tipo: "aviso",
        data_expiracao: "",
      });
    }
  }, [comunicadoEdit, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      condominio_id: values.condominio_id,
      titulo: values.titulo,
      conteudo: values.conteudo,
      tipo: values.tipo,
      data_expiracao: values.data_expiracao || null,
    };

    if (comunicadoEdit) {
      updateComunicado.mutate(
        { id: comunicadoEdit.id, ...data },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createComunicado.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  const isLoading = createComunicado.isPending || updateComunicado.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {comunicadoEdit ? "Editar Comunicado" : "Novo Comunicado"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="condominio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condomínio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o condomínio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {condominios?.map((cond) => (
                        <SelectItem key={cond.id} value={cond.id}>
                          {cond.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipoOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título do comunicado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conteudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva o conteúdo do comunicado..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_expiracao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Expiração (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : comunicadoEdit ? "Salvar" : "Publicar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
