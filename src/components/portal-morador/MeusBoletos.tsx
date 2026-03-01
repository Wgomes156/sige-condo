import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Download, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BoletoMorador } from "@/hooks/usePortalMorador";

interface MeusBoletosProps {
  boletos: BoletoMorador[];
  isLoading: boolean;
}

const statusConfig = {
  pendente: { label: "Pendente", variant: "outline" as const },
  pago: { label: "Pago", variant: "default" as const },
  atraso: { label: "Atraso", variant: "destructive" as const },
  cancelado: { label: "Cancelado", variant: "secondary" as const },
};

export function MeusBoletos({ boletos, isLoading }: MeusBoletosProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Boletos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (boletos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Boletos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum boleto encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separar boletos abertos dos pagos
  const boletosAbertos = boletos.filter(b => b.status === "pendente" || b.status === "atraso");
  const boletosPagos = boletos.filter(b => b.status === "pago");

  return (
    <div className="space-y-6">
      {/* Boletos Abertos */}
      {boletosAbertos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Boletos em Aberto
              <Badge variant="destructive">{boletosAbertos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {boletosAbertos.map(boleto => (
                <div 
                  key={boleto.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    boleto.status === "atraso" ? "border-destructive bg-destructive/5" : "bg-muted/50"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{boleto.referencia}</span>
                      <Badge variant={statusConfig[boleto.status].variant}>
                        {statusConfig[boleto.status].label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>{boleto.condominios?.nome}</span>
                      <span className="mx-2">•</span>
                      <span>Unidade: {boleto.unidade}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Vencimento: {format(new Date(boleto.data_vencimento), "dd/MM/yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(boleto.valor)}
                    </div>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Boletos Pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {boletosPagos.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum pagamento registrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referência</TableHead>
                  <TableHead>Condomínio</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boletosPagos.slice(0, 10).map(boleto => (
                  <TableRow key={boleto.id}>
                    <TableCell className="font-medium">{boleto.referencia}</TableCell>
                    <TableCell>{boleto.condominios?.nome}</TableCell>
                    <TableCell>{boleto.unidade}</TableCell>
                    <TableCell>
                      {format(new Date(boleto.data_vencimento), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {boleto.data_pagamento 
                        ? format(new Date(boleto.data_pagamento), "dd/MM/yyyy") 
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(boleto.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
