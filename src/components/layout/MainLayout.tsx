import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useState, createContext, useContext } from "react";
import { AssistenteIAChat } from "@/components/atendimentos/AssistenteIAChat";

interface MainLayoutProps {
  children: React.ReactNode;
}

// Contexto para controle do menu mobile
interface MobileMenuContextType {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const MobileMenuContext = createContext<MobileMenuContextType>({
  isMobileMenuOpen: false,
  toggleMobileMenu: () => {},
  closeMobileMenu: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);

export function MainLayout({ children }: MainLayoutProps) {
  const [isAssistenteOpen, setIsAssistenteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <MobileMenuContext.Provider
      value={{ isMobileMenuOpen, toggleMobileMenu, closeMobileMenu }}
    >
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background relative overflow-x-hidden">
          {/* Overlay mobile — fecha o menu ao clicar fora */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 mobile-overlay lg:hidden"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
          )}

          <AppSidebar />

          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto scroll-smooth-mobile">
              {children}
            </main>
          </div>

          {/* Floating Button para Assistente IA — sobe acima da nav em mobile */}
          <button
            onClick={() => setIsAssistenteOpen(true)}
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl hover:shadow-xl transition-all hover:scale-105 z-50 flex items-center justify-center overflow-hidden border-2 border-primary bg-background ring-4 ring-primary/20"
            title="Falar com Ana (Assistente Virtual)"
          >
            <img src="/ana-avatar.png" alt="Assistente Ana" className="w-full h-full object-cover" />
          </button>

          <AssistenteIAChat open={isAssistenteOpen} onOpenChange={setIsAssistenteOpen} />
        </div>
      </SidebarProvider>
    </MobileMenuContext.Provider>
  );
}
