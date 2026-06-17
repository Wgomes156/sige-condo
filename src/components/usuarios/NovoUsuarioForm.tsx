import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import type { NovoUsuarioData } from "@/hooks/useUsuarios";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["admin", "gerente", "operador", "morador", "sindico"] as const),
});

interface Condominio {
  id: string;
  nome: string;
}

interface Unidade {
  id: string;
  codigo: string;
  condominio_id: string;
}

interface NovoUsuarioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NovoUsuarioData) => Promise<{ success: boolean }>;
}

export function NovoUsuarioForm({
  open,
  onOpenChange,
  onSubmit,
}: NovoUsuarioFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedCondominioAcesso, setSelectedCondominioAcesso] = useState<string>("todos");
  const [selectedMultiCondominios, setSelectedMultiCondominios] = useState<string[]>([]);
  const [selectedUnidades, setSelectedUnidades] = useState<
    { unidade_id: string; tipo_morador: string }[]
  >([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      password: "",
      role: "operador",
    },
  });

  const selectedRole = form.watch("role");

  useEffect(() => {
    const fetchData = async () => {
      const { data: conds } = await supabase
        .from("condominios")
        .select("id, nome")
        .order("nome");
      setCondominios(conds || []);

      const { data: units } = await supabase
        .from("unidades")
        .select("id, codigo, condominio_id")
        .order("codigo");
      setUnidades(units || []);
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      let condominios_ids: string[] | undefined;
      if (selectedRole === "admin") {
        condominios_ids = undefined;
      } else if (selectedRole === "gerente" || selectedRole === "operador" || selectedRole === "sindico") {
        condominios_ids = selectedMultiCondominios.length > 0
          ? selectedMultiCondominios
          : condominios.map((c) => c.id);
      } else {
        condominios_ids = selectedCondominioAcesso === "todos"
          ? condominios.map((c) => c.id)
          : [selectedCondominioAcesso];
      }

      const data: NovoUsuarioData = {
        nome: values.nome,
        email: values.email,
        password: values.password,
        role: values.role,
        condominios_ids,
        unidades_ids:
          selectedRole === "morador" ? selectedUnidades : undefined,
      };

      const result = await onSubmit(data);
      if (result.success) {
        form.reset();
        setSelectedCondominioAcesso("todos");
        setSelectedMultiCondominios([]);
        setSelectedUnidades([]);
        onOpenChange(false);
      } else {
        setErrorMsg(result.error || "Erro desconhecido ao criar usuário.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const toggleCondominio = (condId: string) => {
    setSelectedMultiCondominios((prev) =>
      prev.includes(condId) ? prev.filter((id) => id !== condId) : [...prev, condId]
    );
  };

  const toggleUnidade = (unidadeId: string, tipoMorador: string = "proprietario") => {
    setSelectedUnidades((prev) => {
      const exists = prev.find((u) => u.unidade_id === unidadeId);
      if (exists) {
        return prev.filter((u) => u.unidade_id !== unidadeId);
      }
      return [...prev, { unidade_id: unidadeId, tipo_morador: tipoMorador }];
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Cadastre um novo usuário e defina suas permissões de acesso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel no sistema</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="sindico">Síndico</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="morador">Morador</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedRole === "morador" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Moradores têm acesso somente aos dados da sua unidade e boletos (somente leitura).
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {(selectedRole === "gerente" || selectedRole === "operador" || selectedRole === "sindico") && (
              <div className="space-y-2">
                <FormLabel>Condomínios de Acesso</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Selecione um ou mais condomínios. Se nenhum for selecionado, o acesso será a todos.
                </p>
                <ScrollArea className="h-[160px] border rounded-md p-2">
                  {condominios.map((cond) => (
                    <div key={cond.id} className="flex items-center space-x-2 py-1.5 px-1">
                      <Checkbox
                        id={`novo-cond-${cond.id}`}
                        checked={selectedMultiCondominios.includes(cond.id)}
                        onCheckedChange={() => toggleCondominio(cond.id)}
                      />
                      <label
                        htmlFor={`novo-cond-${cond.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {cond.nome}
                      </label>
                    </div>
                  ))}
                  {condominios.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum condomínio disponível</p>
                  )}
                </ScrollArea>
                {selectedMultiCondominios.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedMultiCondominios.length} condomínio(s) selecionado(s)
                  </p>
                )}
              </div>
            )}

            {selectedRole !== "admin" && selectedRole !== "gerente" && selectedRole !== "operador" && selectedRole !== "sindico" && (
              <div className="space-y-2">
                <FormLabel>Condomínio de Acesso</FormLabel>
                <Select
                  value={selectedCondominioAcesso}
                  onValueChange={setSelectedCondominioAcesso}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o condomínio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os condomínios</SelectItem>
                    {condominios.map((cond) => (
                      <SelectItem key={cond.id} value={cond.id}>
                        {cond.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedRole === "morador" && (
              <div className="space-y-2">
                <FormLabel>Unidades com acesso</FormLabel>
                <ScrollArea className="h-[150px] border rounded-md p-2">
                  {unidades
                    .filter((u) => selectedCondominioAcesso === "todos" || u.condominio_id === selectedCondominioAcesso)
                    .map((unid) => {
                    const cond = condominios.find((c) => c.id === unid.condominio_id);
                    return (
                      <div key={unid.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={unid.id}
                          checked={selectedUnidades.some((u) => u.unidade_id === unid.id)}
                          onCheckedChange={() => toggleUnidade(unid.id)}
                        />
                        <label
                          htmlFor={unid.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {unid.codigo} {cond ? `(${cond.nome})` : ""}
                        </label>
                      </div>
                    );
                  })}
                  {unidades.filter((u) => selectedCondominioAcesso === "todos" || u.condominio_id === selectedCondominioAcesso).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma unidade disponível
                    </p>
                  )}
                </ScrollArea>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md border border-destructive/20">
                {errorMsg}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
