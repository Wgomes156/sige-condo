import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Users, Shield } from "lucide-react";
import { useUsuarios, type Usuario } from "@/hooks/useUsuarios";
import { useAuth } from "@/hooks/useAuth";
import { UsuariosTable } from "@/components/usuarios/UsuariosTable";
import { NovoUsuarioForm } from "@/components/usuarios/NovoUsuarioForm";
import { EditarRoleDialog } from "@/components/usuarios/EditarRoleDialog";
import { GerenciarCondominiosDialog } from "@/components/usuarios/GerenciarCondominiosDialog";
import { GerenciarUnidadesDialog } from "@/components/usuarios/GerenciarUnidadesDialog";
import { EditarUsuarioDialog } from "@/components/usuarios/EditarUsuarioDialog";
import { AlterarSenhaDialog } from "@/components/usuarios/AlterarSenhaDialog";
import { ExcluirUsuarioDialog } from "@/components/usuarios/ExcluirUsuarioDialog";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function Usuarios() {
  const { userRole, user } = useAuth();
  const {
    usuarios,
    loading,
    criarUsuario,
    excluirUsuario,
    editarUsuario,
    alterarSenha,
    atualizarRole,
    atribuirCondominio,
    removerCondominio,
    atribuirUnidade,
    removerUnidade,
  } = useUsuarios();

  const [searchTerm, setSearchTerm] = useState("");
  const [showNovoUsuario, setShowNovoUsuario] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [showEditRole, setShowEditRole] = useState(false);
  const [showCondominios, setShowCondominios] = useState(false);
  const [showUnidades, setShowUnidades] = useState(false);
  const [showEditUsuario, setShowEditUsuario] = useState(false);
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [showExcluirUsuario, setShowExcluirUsuario] = useState(false);

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditRole = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowEditRole(true);
  };

  const handleManageCondominios = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowCondominios(true);
  };

  const handleManageUnidades = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowUnidades(true);
  };

  const handleEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowEditUsuario(true);
  };

  const handleChangePassword = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowAlterarSenha(true);
  };

  const handleDeleteUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowExcluirUsuario(true);
  };

  // Only admins can access this page
  if (userRole !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Apenas administradores podem acessar a gestão de usuários.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const roleStats = {
    total: usuarios.length,
    admins: usuarios.filter((u) => u.role === "admin").length,
    gerentes: usuarios.filter((u) => u.role === "gerente").length,
    operadores: usuarios.filter((u) => u.role === "operador").length,
    moradores: usuarios.filter((u) => u.role === "morador").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, papéis e permissões de acesso
          </p>
        </div>
        <Button onClick={() => setShowNovoUsuario(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{roleStats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{roleStats.gerentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{roleStats.operadores}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{roleStats.moradores}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">
                Carregando usuários...
              </div>
            </div>
          ) : (
            <UsuariosTable
              usuarios={filteredUsuarios}
              currentUserId={user?.id}
              onEditRole={handleEditRole}
              onManageCondominios={handleManageCondominios}
              onManageUnidades={handleManageUnidades}
              onEditUsuario={handleEditUsuario}
              onChangePassword={handleChangePassword}
              onDeleteUsuario={handleDeleteUsuario}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NovoUsuarioForm
        open={showNovoUsuario}
        onOpenChange={setShowNovoUsuario}
        onSubmit={criarUsuario}
      />

      <EditarRoleDialog
        usuario={selectedUsuario}
        open={showEditRole}
        onOpenChange={setShowEditRole}
        onSubmit={atualizarRole}
      />

      <GerenciarCondominiosDialog
        usuario={selectedUsuario}
        open={showCondominios}
        onOpenChange={setShowCondominios}
        onAtribuir={atribuirCondominio}
        onRemover={removerCondominio}
      />

      <GerenciarUnidadesDialog
        usuario={selectedUsuario}
        open={showUnidades}
        onOpenChange={setShowUnidades}
        onAtribuir={atribuirUnidade}
        onRemover={removerUnidade}
      />

      <EditarUsuarioDialog
        usuario={selectedUsuario}
        open={showEditUsuario}
        onOpenChange={setShowEditUsuario}
        onSubmit={editarUsuario}
      />

      <AlterarSenhaDialog
        usuario={selectedUsuario}
        open={showAlterarSenha}
        onOpenChange={setShowAlterarSenha}
        onSubmit={alterarSenha}
      />

      <ExcluirUsuarioDialog
        usuario={selectedUsuario}
        open={showExcluirUsuario}
        onOpenChange={setShowExcluirUsuario}
        onConfirm={excluirUsuario}
      />
    </div>
  );
}
