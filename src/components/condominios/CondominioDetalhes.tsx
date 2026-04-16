import { forwardRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, MapPin, User, Phone, Mail, Shield, Eye, Users, Home, Leaf, Car, FileText } from "lucide-react";
import { Condominio } from "@/hooks/useCondominios";
import { AnexosSection } from "@/components/anexos/AnexosSection";
import { DadosBancariosSection } from "@/components/condominios/DadosBancariosSection";

interface CondominioDetalhesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominio: Condominio | null;
}

export const CondominioDetalhes = forwardRef<HTMLDivElement, CondominioDetalhesProps>(
  function CondominioDetalhes({ open, onOpenChange, condominio }, ref) {
    if (!condominio) return null;

  const c = condominio as any;

  // Amenidades ativas
  const amenidades = [
    { key: 'salao_festa', label: 'Salão de Festa' },
    { key: 'area_kids', label: 'Área Kids' },
    { key: 'piscina', label: 'Piscina' },
    { key: 'sala_jogos', label: 'Sala de Jogos' },
    { key: 'quadra_futsal', label: 'Quadra de Futsal' },
    { key: 'quadra_tenis', label: 'Quadra de Tênis' },
    { key: 'sauna', label: 'Sauna' },
  ].filter(a => c[a.key]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={ref} className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {condominio.nome}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do condomínio {condominio.nome}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Identificação */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Identificação
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {condominio.cnpj && (
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{condominio.cnpj}</p>
                  </div>
                )}
                {condominio.tipo_imovel && (
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de Imóvel</p>
                    <Badge variant="outline">{condominio.tipo_imovel}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </h3>
              <Separator />
              <div className="space-y-2">
                {condominio.endereco && (
                  <p className="text-sm">{condominio.endereco}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {[condominio.cidade, condominio.uf].filter(Boolean).join(" - ") || "Localização não informada"}
                </p>
              </div>
            </div>

            {/* Estrutura */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Home className="h-4 w-4" />
                Estrutura
              </h3>
              <Separator />
              <div className="flex flex-wrap gap-3">
                {condominio.quantidade_unidades && (
                  <Badge variant="secondary" className="text-sm">
                    <Users className="h-3 w-3 mr-1" />
                    {condominio.quantidade_unidades} unidades
                  </Badge>
                )}
                {condominio.quantidade_blocos && (
                  <Badge variant="secondary" className="text-sm">
                    <Building2 className="h-3 w-3 mr-1" />
                    {condominio.quantidade_blocos} blocos
                  </Badge>
                )}
              </div>
            </div>

            {/* Síndico */}
            {condominio.tem_sindico && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Síndico
                </h3>
                <Separator />
                <div className="space-y-2">
                  {condominio.sindico_nome && (
                    <p className="font-medium">{condominio.sindico_nome}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {condominio.sindico_telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {condominio.sindico_telefone}
                      </span>
                    )}
                    {condominio.sindico_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {condominio.sindico_email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Amenidades */}
            {(amenidades.length > 0 || c.outras_areas) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Áreas Comuns
                </h3>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {amenidades.map(a => (
                    <Badge key={a.key} variant="secondary">{a.label}</Badge>
                  ))}
                  {c.outras_areas && c.outras_areas_descricao && (
                    <Badge variant="outline">{c.outras_areas_descricao}</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Estacionamento */}
            {c.tem_vagas_garagem && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Estacionamento
                </h3>
                <Separator />
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Possui Vagas</Badge>
                    {c.vagas_identificadas && (
                      <Badge variant="secondary">Vagas Identificadas</Badge>
                    )}
                    {c.vagas_visitantes && (
                      <Badge variant="secondary">Vagas para Visitantes</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {c.quantidade_total_vagas && (
                      <div>
                        <p className="text-xs text-muted-foreground">Total de Vagas</p>
                        <p className="font-medium">{c.quantidade_total_vagas}</p>
                      </div>
                    )}
                    {c.vagas_visitantes && c.quantidade_vagas_visitantes && (
                      <div>
                        <p className="text-xs text-muted-foreground">Vagas Visitantes</p>
                        <p className="font-medium">{c.quantidade_vagas_visitantes}</p>
                      </div>
                    )}
                    {c.controle_acesso_vagas && (
                      <div>
                        <p className="text-xs text-muted-foreground">Controle de Acesso</p>
                        <p className="font-medium capitalize">{c.controle_acesso_vagas}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ESG */}
            {c.programa_sustentabilidade && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  ESG - Sustentabilidade
                </h3>
                <Separator />
                <div className="space-y-2">
                  <Badge variant="default" className="bg-green-600">Programa de Sustentabilidade Ativo</Badge>
                  {c.descricao_sustentabilidade && (
                    <p className="text-sm text-muted-foreground">{c.descricao_sustentabilidade}</p>
                  )}
                </div>
              </div>
            )}

            {/* Infraestrutura */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Infraestrutura
              </h3>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Badge variant={condominio.tem_administradora ? "default" : "outline"}>
                  {condominio.tem_administradora ? "✓" : "✗"} Administradora
                </Badge>
                {condominio.tem_administradora && c.nome_administradora && (
                  <Badge variant="secondary">{c.nome_administradora}</Badge>
                )}
                {condominio.tem_administradora && c.administradora_tem_contrato && (
                  <Badge variant="default" className="bg-green-600">
                    <FileText className="h-3 w-3 mr-1" />
                    Com Contrato
                  </Badge>
                )}
                <Badge variant={condominio.tem_seguranca ? "default" : "outline"}>
                  {condominio.tem_seguranca ? "✓" : "✗"} Segurança
                </Badge>
                <Badge variant={condominio.tem_monitoramento ? "default" : "outline"}>
                  {condominio.tem_monitoramento ? "✓" : "✗"} Monitoramento
                </Badge>
                {condominio.tem_porteiro && (
                  <Badge variant="secondary">
                    Portaria: {condominio.tem_porteiro}
                  </Badge>
                )}
              </div>
            </div>

            {/* Observações */}
            {condominio.observacoes && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Observações
                </h3>
                <Separator />
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {condominio.observacoes}
                </p>
              </div>
            )}

            {/* Dados Bancários */}
            <DadosBancariosSection condominioId={condominio.id} />

            {/* Anexos */}
            <AnexosSection
              entidadeTipo="condominio"
              entidadeId={condominio.id}
              showUploader={false}
              showDelete={false}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
  }
);
