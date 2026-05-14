import { useState, useEffect } from "react";
import { Mail, MessageSquare, Bell, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useConfiguracaoMensageria,
  useSalvarConfiguracao,
  type CanalMensageria,
  type MensageriaConfig,
} from "@/hooks/useMensageria";

interface Props {
  condominioId: string;
}

type ConfigLocal = Record<CanalMensageria, { ativo: boolean; config_json: Record<string, string> }>;

const DEFAULTS: ConfigLocal = {
  email: { ativo: false, config_json: { resend_api_key: "", from_email: "" } },
  whatsapp: { ativo: false, config_json: { api_url: "", api_key: "", instance: "" } },
  inapp: { ativo: true, config_json: {} },
};

function obfuscar(value: string): string {
  if (!value || value.length <= 6) return value;
  return value.slice(0, 4) + "•".repeat(Math.min(value.length - 6, 20)) + value.slice(-2);
}

function MaskedInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function ConfiguracaoCanaisForm({ condominioId }: Props) {
  const { data: configs = [], isLoading } = useConfiguracaoMensageria(condominioId);
  const salvar = useSalvarConfiguracao();

  const [local, setLocal] = useState<ConfigLocal>(DEFAULTS);

  // Preenche estado local quando dados chegam
  useEffect(() => {
    if (!configs.length) return;
    setLocal((prev) => {
      const next = { ...prev };
      for (const cfg of configs as MensageriaConfig[]) {
        const canal = cfg.canal as CanalMensageria;
        next[canal] = { ativo: cfg.ativo, config_json: { ...cfg.config_json } };
      }
      return next;
    });
  }, [configs]);

  const setAtivo = (canal: CanalMensageria, ativo: boolean) => {
    setLocal((prev) => ({ ...prev, [canal]: { ...prev[canal], ativo } }));
  };

  const setConfigField = (canal: CanalMensageria, field: string, value: string) => {
    setLocal((prev) => ({
      ...prev,
      [canal]: { ...prev[canal], config_json: { ...prev[canal].config_json, [field]: value } },
    }));
  };

  const handleSalvar = async (canal: CanalMensageria) => {
    await salvar.mutateAsync({
      condominio_id: condominioId,
      canal,
      ativo: local[canal].ativo,
      config_json: local[canal].config_json,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando configurações...
      </div>
    );
  }

  return (
    <Tabs defaultValue="email" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="email" className="gap-1.5">
          <Mail className="h-4 w-4" />
          E-mail
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="gap-1.5">
          <MessageSquare className="h-4 w-4" />
          WhatsApp
        </TabsTrigger>
        <TabsTrigger value="inapp" className="gap-1.5">
          <Bell className="h-4 w-4" />
          In-app
        </TabsTrigger>
      </TabsList>

      {/* E-MAIL */}
      <TabsContent value="email">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Canal E-mail</CardTitle>
                <CardDescription>
                  Utiliza Resend para disparo de e-mails transacionais.
                </CardDescription>
              </div>
              <Switch
                checked={local.email.ativo}
                onCheckedChange={(v) => setAtivo("email", v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="resend-key">Resend API Key</Label>
              <MaskedInput
                id="resend-key"
                value={local.email.config_json.resend_api_key ?? ""}
                onChange={(v) => setConfigField("email", "resend_api_key", v)}
                placeholder="re_xxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                Obtenha em{" "}
                <span className="font-mono">resend.com/api-keys</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="from-email">E-mail remetente</Label>
              <Input
                id="from-email"
                type="email"
                value={local.email.config_json.from_email ?? ""}
                onChange={(e) => setConfigField("email", "from_email", e.target.value)}
                placeholder="noreply@seucondominio.com.br"
              />
            </div>
            <Button
              onClick={() => handleSalvar("email")}
              disabled={salvar.isPending}
              className="w-full sm:w-auto"
            >
              {salvar.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar E-mail
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* WHATSAPP */}
      <TabsContent value="whatsapp">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Canal WhatsApp</CardTitle>
                <CardDescription>
                  Integração com Evolution API ou Z-API.
                </CardDescription>
              </div>
              <Switch
                checked={local.whatsapp.ativo}
                onCheckedChange={(v) => setAtivo("whatsapp", v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wa-url">URL da API (Webhook)</Label>
              <Input
                id="wa-url"
                value={local.whatsapp.config_json.api_url ?? ""}
                onChange={(e) => setConfigField("whatsapp", "api_url", e.target.value)}
                placeholder="https://api.seuservidor.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-key">Token / API Key</Label>
              <MaskedInput
                id="wa-key"
                value={local.whatsapp.config_json.api_key ?? ""}
                onChange={(v) => setConfigField("whatsapp", "api_key", v)}
                placeholder="Token de autenticação"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-instance">Instance Name</Label>
              <Input
                id="wa-instance"
                value={local.whatsapp.config_json.instance ?? ""}
                onChange={(e) => setConfigField("whatsapp", "instance", e.target.value)}
                placeholder="minha-instancia"
              />
            </div>
            <Button
              onClick={() => handleSalvar("whatsapp")}
              disabled={salvar.isPending}
              className="w-full sm:w-auto"
            >
              {salvar.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar WhatsApp
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* IN-APP */}
      <TabsContent value="inapp">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Notificações In-app</CardTitle>
                <CardDescription>
                  Exibe notificações diretamente no painel do morador.
                  Não requer configuração adicional.
                </CardDescription>
              </div>
              <Switch
                checked={local.inapp.ativo}
                onCheckedChange={(v) => setAtivo("inapp", v)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleSalvar("inapp")}
              disabled={salvar.isPending}
              className="w-full sm:w-auto"
            >
              {salvar.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar In-app
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
