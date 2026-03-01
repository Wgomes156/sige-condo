import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAtendimento } from "@/hooks/useAtendimentos";
import { useAuth } from "@/hooks/useAuth";
import type { UnidadeMorador } from "@/hooks/usePortalMorador";

const chamadoSchema = z.object({
  unidade_id: z.string().min(1, "Selecione uma unidade"),
  motivo: z.string().min(1, "Selecione o motivo"),
  descricao: z.string().min(10, "Descreva o chamado com pelo menos 10 caracteres"),
});

type ChamadoFormData = z.infer<typeof chamadoSchema>;

interface NovoChamadoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidades: UnidadeMorador[];
}

const motivosContato = [
  "Dúvida sobre boleto",
  "Reclamação",
  "Sugestão",
  "Solicitação de serviço",
  "Problemas na unidade",
  "Barulho/Perturbação",
  "Manutenção",
  "Outros",
];

export function NovoChamadoForm({ open, onOpenChange, unidades }: NovoChamadoFormProps) {
  const { profile } = useAuth();
  const { mutateAsync: createAtendimento, isPending } = useCreateAtendimento();

  const form = useForm<ChamadoFormData>({
    resolver: zodResolver(chamadoSchema),
    defaultValues: {
      unidade_id: "",
      motivo: "",
      descricao: "",
    },
  });

  const onSubmit = async (data: ChamadoFormData) => {
    const unidade = unidades.find(u => u.id === data.unidade_id);
    if (!unidade) return;

    await createAtendimento({
      data: new Date().toISOString().split("T")[0],
      hora: new Date().toTimeString().slice(0, 5),
      operador_nome: "Portal do Morador",
      cliente_nome: profile?.nome || "Morador",
      cliente_telefone: "-",
      cliente_email: profile?.email,
      canal: "Portal",
      motivo: data.motivo,
      status: "Em andamento",
      condominio_nome: unidade.condominios?.nome || "",
      condominio_id: unidade.condominio_id,
      observacoes: `Unidade: ${unidade.codigo}\n\n${data.descricao}`,
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Abrir Novo Chamado</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para registrar seu chamado. Nossa equipe entrará em contato.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="unidade_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unidades.map(unidade => (
                        <SelectItem key={unidade.id} value={unidade.id}>
                          {unidade.codigo} - {unidade.condominios?.nome}
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
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {motivosContato.map(motivo => (
                        <SelectItem key={motivo} value={motivo}>
                          {motivo}
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
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva seu chamado com detalhes..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Enviando..." : "Enviar Chamado"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
