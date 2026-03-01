import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import DashboardCondominio from "./pages/DashboardCondominio";
import Atendimentos from "./pages/Atendimentos";
import Condominios from "./pages/Condominios";
import Comunicados from "./pages/Comunicados";
import Financeiro from "./pages/Financeiro";
import Boletos from "./pages/Boletos";
import BoletosRecorrentes from "./pages/BoletosRecorrentes";
import OrdensServico from "./pages/OrdensServico";
import Relatorios from "./pages/Relatorios";
import RelatorioInadimplencia from "./pages/RelatorioInadimplencia";
import Configuracoes from "./pages/Configuracoes";
import Unidades from "./pages/Unidades";
import Usuarios from "./pages/Usuarios";
import PortalMorador from "./pages/PortalMorador";
import AuditLogs from "./pages/AuditLogs";
import ContasBancarias from "./pages/ContasBancarias";
import OcorrenciasCondominio from "./pages/OcorrenciasCondominio";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Demandas from "./pages/Demandas";
import Servicos from "./pages/Servicos";
import Propostas from "./pages/Propostas";
import Acordos from "./pages/Acordos";
import Reservas from "./pages/Reservas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Routes>
                    {/* Portal do Morador - sem MainLayout para interface simplificada */}
                    <Route path="/portal" element={<PortalMorador />} />

                    {/* Rotas administrativas */}
                    <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
                    <Route path="/condominio/:id" element={<MainLayout><DashboardCondominio /></MainLayout>} />
                    <Route path="/atendimentos" element={<MainLayout><Atendimentos /></MainLayout>} />
                    <Route path="/condominios" element={<MainLayout><Condominios /></MainLayout>} />
                    <Route path="/comunicados" element={<MainLayout><Comunicados /></MainLayout>} />
                    <Route path="/financeiro" element={<MainLayout><Financeiro /></MainLayout>} />
                    <Route path="/boletos" element={<MainLayout><Boletos /></MainLayout>} />
                    <Route path="/boletos/recorrentes" element={<MainLayout><BoletosRecorrentes /></MainLayout>} />
                    <Route path="/contas-bancarias" element={<MainLayout><ContasBancarias /></MainLayout>} />
                    <Route path="/ordens-servico" element={<MainLayout><OrdensServico /></MainLayout>} />
                    <Route path="/ocorrencias" element={<MainLayout><OcorrenciasCondominio /></MainLayout>} />
                    <Route path="/demandas" element={<MainLayout><Demandas /></MainLayout>} />
                    <Route path="/servicos" element={<MainLayout><Servicos /></MainLayout>} />
                    <Route path="/propostas" element={<MainLayout><Propostas /></MainLayout>} />
                    <Route path="/acordos" element={<MainLayout><Acordos /></MainLayout>} />
                    <Route path="/reservas" element={<MainLayout><Reservas /></MainLayout>} />
                    <Route path="/relatorios" element={<MainLayout><Relatorios /></MainLayout>} />
                    <Route path="/relatorios/inadimplencia" element={<MainLayout><RelatorioInadimplencia /></MainLayout>} />
                    <Route path="/unidades" element={<MainLayout><Unidades /></MainLayout>} />
                    <Route path="/usuarios" element={<MainLayout><Usuarios /></MainLayout>} />
                    <Route path="/auditoria" element={<MainLayout><AuditLogs /></MainLayout>} />
                    <Route path="/configuracoes" element={<MainLayout><Configuracoes /></MainLayout>} />
                    <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
                  </Routes>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
