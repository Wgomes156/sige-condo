import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface FiltrosPropostasProps {
  busca: string;
  onBuscaChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  pacote: string;
  onPacoteChange: (value: string) => void;
  tipoCondominio: string;
  onTipoCondominioChange: (value: string) => void;
}

export function FiltrosPropostas({
  busca,
  onBuscaChange,
  status,
  onStatusChange,
  pacote,
  onPacoteChange,
  tipoCondominio,
  onTipoCondominioChange,
}: FiltrosPropostasProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, condomínio ou responsável..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos os status</SelectItem>
          <SelectItem value="rascunho">Rascunho</SelectItem>
          <SelectItem value="enviada">Enviada</SelectItem>
          <SelectItem value="em_analise">Em Análise</SelectItem>
          <SelectItem value="aprovada">Aprovada</SelectItem>
          <SelectItem value="recusada">Recusada</SelectItem>
          <SelectItem value="expirada">Expirada</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={pacote} onValueChange={onPacoteChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Pacote" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos os pacotes</SelectItem>
          <SelectItem value="basico">Básico</SelectItem>
          <SelectItem value="intermediario">Intermediário</SelectItem>
          <SelectItem value="completo">Completo</SelectItem>
          <SelectItem value="personalizado">Personalizado</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={tipoCondominio} onValueChange={onTipoCondominioChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tipo Condomínio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos os tipos</SelectItem>
          <SelectItem value="residencial">Residencial</SelectItem>
          <SelectItem value="comercial">Comercial</SelectItem>
          <SelectItem value="misto">Misto</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
