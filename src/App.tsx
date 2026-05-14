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
import Mensageria from "./pages/Mensageria";

import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              {/* Portal do Morador */}
              <Route 
                path="/portal" 
                element={
                  <ProtectedRoute allowedRoles={["morador", "admin"]}>
                    <PortalMorador />
                  </ProtectedRoute>
                } 
              />

              {/* Rotas Administrativas - Admin e Gerente */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute allowedRoles={["admin", "sindico", "gerente", "operador"]}>
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/condominio/:id" element={<DashboardCondominio />} />
                        
                        {/* Atendimentos e Demandas - Operador também acessa */}
                        <Route path="/atendimentos" element={<Atendimentos />} />
                        <Route path="/demandas" element={<Demandas />} />
                        <Route path="/servicos" element={<Servicos />} />
                        <Route path="/ocorrencias" element={<OcorrenciasCondominio />} />
                        <Route path="/ordens-servico" element={<OrdensServico />} />
                        <Route path="/reservas" element={<Reservas />} />

                        {/* Gestão de Condomínio e Financeiro - Geralmente Gerente+ */}
                        <Route path="/condominios" element={<Condominios />} />
                        <Route path="/unidades" element={<Unidades />} />
                        <Route path="/comunicados" element={<Comunicados />} />
                        <Route path="/mensageria" element={<Mensageria />} />
                        <Route path="/financeiro" element={<Financeiro />} />
                        <Route path="/boletos" element={<Boletos />} />
                        <Route path="/boletos/recorrentes" element={<BoletosRecorrentes />} />
                        <Route path="/propostas" element={<Propostas />} />
                        <Route path="/acordos" element={<Acordos />} />
                        <Route path="/relatorios" element={<Relatorios />} />
                        <Route path="/relatorios/inadimplencia" element={<RelatorioInadimplencia />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />

                        {/* Apenas Admin */}
                        <Route 
                          path="/usuarios" 
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <Usuarios />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/contas-bancarias" 
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <ContasBancarias />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/auditoria" 
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AuditLogs />
                            </ProtectedRoute>
                          } 
                        />

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
