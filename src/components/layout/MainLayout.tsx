import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useState } from "react";
import { AssistenteIAChat } from "@/components/atendimentos/AssistenteIAChat";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isAssistenteOpen, setIsAssistenteOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>

        {/* Floating Button for Assistente IA */}
        <button
          onClick={() => setIsAssistenteOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl hover:shadow-xl transition-all hover:scale-105 z-50 flex items-center justify-center overflow-hidden border-2 border-primary bg-background ring-4 ring-primary/20"
          title="Falar com Ana (Assistente Virtual)"
        >
          <img src="/ana-avatar.png" alt="Assistente Ana" className="w-full h-full object-cover" />
        </button>

        <AssistenteIAChat open={isAssistenteOpen} onOpenChange={setIsAssistenteOpen} />
      </div>
    </SidebarProvider>
  );
}
