import {
  LayoutDashboard,
  Headphones,
  Building2,
  DollarSign,
  FileText,
  RefreshCw,
  ClipboardList,
  FileBarChart,
  Settings,
  ChevronLeft,
  AlertTriangle,
  Users,
  Home,
  Megaphone,
  Shield,
  Landmark,
  Wrench,
  Package,
  ScrollText,
  Handshake,
  CalendarDays,
  X,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logo from "@/assets/logo-psc.jpg";
import { useAuth } from "@/hooks/useAuth";
import { useMobileMenu } from "./MainLayout";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

// Menu para admin e gerente
const menuItemsAdmin = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Atendimentos", url: "/atendimentos", icon: Headphones },
  { title: "Condomínios", url: "/condominios", icon: Building2 },
  { title: "Unidades", url: "/unidades", icon: Building2 },
  { title: "Comunicados", url: "/comunicados", icon: Megaphone },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Boletos", url: "/boletos", icon: FileText },
  { title: "Recorrentes", url: "/boletos/recorrentes", icon: RefreshCw },
  { title: "Ordens de Serviço", url: "/ordens-servico", icon: ClipboardList },
  { title: "Ocorrências", url: "/ocorrencias", icon: AlertTriangle },
  { title: "Demandas", url: "/demandas", icon: Wrench },
  { title: "Serviços", url: "/servicos", icon: Package },
  { title: "Propostas", url: "/propostas", icon: ScrollText },
  { title: "Acordos", url: "/acordos", icon: Handshake },
  { title: "Reservas", url: "/reservas", icon: CalendarDays },
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Usuários", url: "/usuarios", icon: Users },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

// Menu adicional só para admin (inclui auditoria e contas bancárias)
const menuItemsAdminOnly = [
  { title: "Contas Bancárias", url: "/contas-bancarias", icon: Landmark },
  { title: "Auditoria", url: "/auditoria", icon: Shield },
];

// Menu simplificado para morador
const menuItemsMorador = [
  { title: "Meu Portal", url: "/portal", icon: Home },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { userRole } = useAuth();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();
  const isCollapsed = state === "collapsed";

  // Escolher menu baseado no role
  const menuItems =
    userRole === "morador"
      ? menuItemsMorador
      : userRole === "admin"
      ? [...menuItemsAdmin, ...menuItemsAdminOnly]
      : menuItemsAdmin;

  const isActive = (path: string) => {
    if (path === "/" || path === "/portal") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleMenuItemClick = () => {
    // Fecha o drawer ao clicar em item (apenas em mobile)
    closeMobileMenu();
  };

  return (
    <>
      {/* ===== SIDEBAR MOBILE: drawer deslizante (< lg) ===== */}
      <div
        className={`
          fixed top-0 left-0 h-full z-50 w-72
          bg-sidebar flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Header do drawer mobile */}
        <div className="bg-white flex items-center justify-between px-4 h-16 shrink-0">
          <img src={logo} alt="CondoPlus" className="h-16 w-auto" />
          <button
            onClick={closeMobileMenu}
            className="p-2 rounded-lg text-sidebar hover:bg-gray-100 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Itens do menu mobile */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 scroll-smooth-mobile">
          {menuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.url === "/"}
              onClick={handleMenuItemClick}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg mb-1
                text-sidebar-foreground transition-colors min-h-[48px]
                ${isActive(item.url)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/60"
                }
              `}
              activeClassName=""
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ===== SIDEBAR DESKTOP/TABLET: componente shadcn/ui (≥ lg) ===== */}
      <Sidebar collapsible="icon" className="border-r border-sidebar-border hidden lg:flex">
        <SidebarHeader className="p-0">
          <div className="bg-white w-full h-24 flex items-center justify-center px-3">
            <img
              src={logo}
              alt="CondoPlus"
              className={`transition-all duration-200 ${
                isCollapsed ? "w-12 h-12" : "h-20 w-auto"
              }`}
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-200 ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
            {!isCollapsed && <span className="ml-2">Recolher</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
