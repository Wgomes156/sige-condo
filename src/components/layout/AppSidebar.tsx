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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logo from "@/assets/logo-psc.png";
import { useAuth } from "@/hooks/useAuth";

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
  const isCollapsed = state === "collapsed";

  // Escolher menu baseado no role
  const menuItems = userRole === "morador"
    ? menuItemsMorador
    : userRole === "admin"
      ? [...menuItemsAdmin, ...menuItemsAdminOnly]
      : menuItemsAdmin;

  const isActive = (path: string) => {
    if (path === "/" || path === "/portal") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-0">
        <div className="bg-white w-full h-16 flex items-center justify-center px-3">
          <img
            src={logo}
            alt="CondoPlus"
            className={`transition-all duration-200 ${isCollapsed ? "w-8 h-8" : "h-24 w-auto"
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
            className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""
              }`}
          />
          {!isCollapsed && <span className="ml-2">Recolher</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
