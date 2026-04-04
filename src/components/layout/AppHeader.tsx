import { Bell, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useMobileMenu } from "./MainLayout";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toggleMobileMenu } = useMobileMenu();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.warn("Logout warning:", error.message);
      }
      toast.success("Você saiu do sistema");
      navigate("/auth");
    } catch (err) {
      console.error("Logout error:", err);
      toast.success("Você saiu do sistema");
      navigate("/auth");
    }
  };

  const userEmail = user?.email ?? "";
  const userName = user?.user_metadata?.nome ?? userEmail.split("@")[0];

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Botão hambúrguer — apenas mobile (< lg) */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
          aria-label="Abrir menu"
          id="mobile-menu-toggle"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Trigger da sidebar shadcn — apenas desktop (≥ lg) */}
        <SidebarTrigger className="hidden lg:flex">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>

        {/* Título — oculto em mobile, parcial em tablet */}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-secondary leading-tight hidden sm:block truncate">
            CondoPlus
          </h1>
          <p className="text-xs text-muted-foreground leading-tight hidden lg:block truncate">
            Sistema de Gestão de Condomínios
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <ThemeToggle />

        {/* Sino de notificações */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-secondary rounded-full" />
        </Button>

        {/* Botão Sair — visível apenas em sm+ */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-destructive hover:border-destructive h-9"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Sair</span>
        </Button>

        {/* Menu de perfil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Preferências</DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Sair no dropdown para mobile */}
            <DropdownMenuItem
              className="text-destructive cursor-pointer sm:hidden"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive cursor-pointer hidden sm:flex"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
