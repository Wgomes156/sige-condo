import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building,
  Bell,
  Shield,
  Palette,
  Database,
  FileText,
  Download,
} from "lucide-react";
import { exportEscopoToPDF } from "@/lib/escopoExportUtils";
import { toast } from "sonner";

const settingsSections = [
  {
    title: "Usuários e Permissões",
    description: "Gerencie operadores e níveis de acesso",
    icon: Users,
  },
  {
    title: "Administradoras",
    description: "Cadastre administradoras de condomínios",
    icon: Building,
  },
  {
    title: "Notificações",
    description: "Configure alertas e notificações do sistema",
    icon: Bell,
  },
  {
    title: "Segurança",
    description: "Políticas de senha e autenticação",
    icon: Shield,
  },
  {
    title: "Aparência",
    description: "Personalize cores e tema do sistema",
    icon: Palette,
  },
  {
    title: "Backup e Dados",
    description: "Exporte e faça backup dos dados",
    icon: Database,
  },
];

export default function Configuracoes() {
  const handleExportEscopo = () => {
    try {
      exportEscopoToPDF();
      toast.success("PDF do escopo gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF do escopo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
        <Button onClick={handleExportEscopo} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Escopo (PDF)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Card
            key={section.title}
            className="bg-card hover:border-secondary/50 transition-colors cursor-pointer"
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <section.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base text-foreground">
                  {section.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
