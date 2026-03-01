import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, Building2, Home, Pencil, Key, Trash2 } from "lucide-react";
import type { Usuario } from "@/hooks/useUsuarios";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UsuariosTableProps {
  usuarios: Usuario[];
  currentUserId?: string;
  onEditRole: (usuario: Usuario) => void;
  onManageCondominios: (usuario: Usuario) => void;
  onManageUnidades: (usuario: Usuario) => void;
  onEditUsuario: (usuario: Usuario) => void;
  onChangePassword: (usuario: Usuario) => void;
  onDeleteUsuario: (usuario: Usuario) => void;
}

const roleLabels: Record<AppRole, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  admin: { label: "Administrador", variant: "destructive" },
  gerente: { label: "Gerente", variant: "default" },
  operador: { label: "Operador", variant: "secondary" },
  morador: { label: "Morador", variant: "outline" },
};

export function UsuariosTable({
  usuarios,
  currentUserId,
  onEditRole,
  onManageCondominios,
  onManageUnidades,
  onEditUsuario,
  onChangePassword,
  onDeleteUsuario,
}: UsuariosTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Acessos</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </TableCell>
            </TableRow>
          ) : (
            usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nome}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <Badge variant={roleLabels[usuario.role].variant}>
                    {roleLabels[usuario.role].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {usuario.role === "gerente" && usuario.condominios_acesso.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {usuario.condominios_acesso.length} condomínio(s)
                        </span>
                      </div>
                    )}
                    {usuario.role === "morador" && usuario.unidades_acesso.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Home className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {usuario.unidades_acesso.length} unidade(s)
                        </span>
                      </div>
                    )}
                    {usuario.role === "admin" && (
                      <span className="text-xs text-muted-foreground">Acesso total</span>
                    )}
                    {usuario.role === "operador" && (
                      <span className="text-xs text-muted-foreground">OS atribuídas</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEditUsuario(usuario)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar usuário
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditRole(usuario)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Alterar papel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onChangePassword(usuario)}>
                        <Key className="h-4 w-4 mr-2" />
                        Alterar senha
                      </DropdownMenuItem>
                      {(usuario.role === "gerente" || usuario.role === "admin") && (
                        <DropdownMenuItem onClick={() => onManageCondominios(usuario)}>
                          <Building2 className="h-4 w-4 mr-2" />
                          Gerenciar condomínios
                        </DropdownMenuItem>
                      )}
                      {usuario.role === "morador" && (
                        <DropdownMenuItem onClick={() => onManageUnidades(usuario)}>
                          <Home className="h-4 w-4 mr-2" />
                          Gerenciar unidades
                        </DropdownMenuItem>
                      )}
                      {usuario.user_id !== currentUserId && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteUsuario(usuario)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir usuário
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
