import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { DesktopSidebar } from "./DesktopSidebar";
import { BottomNav } from "./BottomNav";

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  cozinha: "Cozinha",
  compras: "Compras",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { profileName, role, signOut, user } = useAuth();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur-md px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <img src={logo} alt="Helena Rabelo" className="h-9 w-9 rounded-full object-cover" />
            <div className="leading-tight">
              <p className="font-display text-base text-secondary">Helena Rabelo</p>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Controle de Estoque</p>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-muted-foreground">Bem-vinda</p>
            <p className="font-medium text-secondary">{profileName ?? user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground md:hidden">{profileName ?? user?.email}</p>
              <p className="text-[11px] font-semibold text-primary">
                {role ? roleLabel[role] : "—"}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 pb-24 md:pb-6 animate-fade-in">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
