import { useState } from "react";
import { Plus, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContasBancarias, ContaBancaria } from "@/hooks/useContasBancarias";
import { ContasBancariasTable } from "@/components/contas-bancarias/ContasBancariasTable";
import { ContaBancariaFormDialog } from "@/components/contas-bancarias/ContaBancariaFormDialog";
import { useAuth } from "@/hooks/useAuth";

export default function ContasBancarias() {
  const { userRole } = useAuth();
  const {
    contas,
    loading,
    criarConta,
    atualizarConta,
    excluirConta,
    definirContaPadrao,
  } = useContasBancarias();

  const [formOpen, setFormOpen] = useState(false);
  const [contaParaEditar, setContaParaEditar] = useState<ContaBancaria | null>(null);

  const handleEdit = (conta: ContaBancaria) => {
    setContaParaEditar(conta);
    setFormOpen(true);
  };

  const handleNewConta = () => {
    setContaParaEditar(null);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setContaParaEditar(null);
    }
  };

  // Only admin can manage bank accounts
  if (userRole !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas administradores podem gerenciar contas bancárias.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            Contas Bancárias
          </h1>
          <p className="text-muted-foreground">
            Gerencie as contas bancárias para emissão de boletos e cobranças
          </p>
        </div>
        <Button onClick={handleNewConta}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{contas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {contas.filter((c) => c.ativa).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Por Condomínio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {contas.filter((c) => c.condominio_id).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compartilhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {contas.filter((c) => c.administradora_id).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <ContasBancariasTable
            contas={contas}
            loading={loading}
            onEdit={handleEdit}
            onDelete={excluirConta}
            onSetDefault={definirContaPadrao}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ContaBancariaFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        contaParaEditar={contaParaEditar}
        onSave={criarConta}
        onUpdate={atualizarConta}
      />
    </div>
  );
}
