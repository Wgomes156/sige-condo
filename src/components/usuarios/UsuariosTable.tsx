import { Card, CardContent } from "@/components/ui/card";
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
import { MoreHorizontal, Shield, Building2, Home, Pencil, Key, Trash2, Mail, User as UserIcon } from "lucide-react";
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
    <div className="space-y-4">
      {/* View de Cards para Mobile (< 640px) */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {usuarios.length === 0 ? (
          <div className="text-center py-8 bg-card border rounded-lg text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          usuarios.map((usuario) => (
            <Card key={usuario.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-tight">{usuario.nome}</h3>
                      <Badge variant={roleLabels[usuario.role].variant} className="mt-1 h-5 text-[10px] uppercase">
                        {roleLabels[usuario.role].label}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEditUsuario(usuario)}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar usuário
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditRole(usuario)}>
                        <Shield className="h-4 w-4 mr-2" /> Alterar papel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onChangePassword(usuario)}>
                        <Key className="h-4 w-4 mr-2" /> Alterar senha
                      </DropdownMenuItem>
                      {(usuario.role === "gerente" || usuario.role === "admin") && (
                        <DropdownMenuItem onClick={() => onManageCondominios(usuario)}>
                          <Building2 className="h-4 w-4 mr-2" /> Gerenciar condomínios
                        </DropdownMenuItem>
                      )}
                      {usuario.role === "morador" && (
                        <DropdownMenuItem onClick={() => onManageUnidades(usuario)}>
                          <Home className="h-4 w-4 mr-2" /> Gerenciar unidades
                        </DropdownMenuItem>
                      )}
                      {usuario.user_id !== currentUserId && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteUsuario(usuario)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir usuário
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{usuario.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {usuario.role === "gerente" && usuario.condominios_acesso.length > 0 && (
                      <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[11px]">
                        <Building2 className="h-3 w-3" />
                        <span>{usuario.condominios_acesso.length} condomínio(s)</span>
                      </div>
                    )}
                    {usuario.role === "morador" && usuario.unidades_acesso.length > 0 && (
                      <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[11px]">
                        <Home className="h-3 w-3" />
                        <span>{usuario.unidades_acesso.length} unidade(s)</span>
                      </div>
                    )}
                    {usuario.role === "admin" && (
                      <span className="text-[11px] font-medium text-destructive px-2 py-0.5 bg-destructive/10 rounded">Acesso total</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View de Tabela para Tablet e Desktop (>= 640px) */}
      <div className="hidden sm:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden lg:table-cell">E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead className="hidden md:table-cell">Acessos</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
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
                <TableRow key={usuario.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{usuario.nome}</span>
                      <span className="text-xs text-muted-foreground lg:hidden">{usuario.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleLabels[usuario.role].variant}>
                      {roleLabels[usuario.role].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
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
                  <TableCell className="text-right">
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
                          <Pencil className="h-4 w-4 mr-2" /> Editar usuário
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditRole(usuario)}>
                          <Shield className="h-4 w-4 mr-2" /> Alterar papel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangePassword(usuario)}>
                          <Key className="h-4 w-4 mr-2" /> Alterar senha
                        </DropdownMenuItem>
                        {(usuario.role === "gerente" || usuario.role === "admin") && (
                          <DropdownMenuItem onClick={() => onManageCondominios(usuario)}>
                            <Building2 className="h-4 w-4 mr-2" /> Gerenciar condomínios
                          </DropdownMenuItem>
                        )}
                        {usuario.role === "morador" && (
                          <DropdownMenuItem onClick={() => onManageUnidades(usuario)}>
                            <Home className="h-4 w-4 mr-2" /> Gerenciar unidades
                          </DropdownMenuItem>
                        )}
                        {usuario.user_id !== currentUserId && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteUsuario(usuario)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir usuário
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
    </div>
  );
}
