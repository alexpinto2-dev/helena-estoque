import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  ArrowLeftRight,
  BookOpen,
  ChefHat,
  FileText,
  Bell,
  HelpCircle,
  Users,
  Building2,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const allItems = [
  { to: "/", label: "Início", icon: Home, allow: ["admin", "cozinha", "compras"] },
  { to: "/materias", label: "Matérias-primas", icon: Package, allow: ["admin", "cozinha", "compras"] },
  { to: "/fornecedores", label: "Fornecedores", icon: Building2, allow: ["admin", "cozinha", "compras"] },
  { to: "/movimentacoes", label: "Movimentação", icon: ArrowLeftRight, allow: ["admin", "cozinha", "compras"] },
  { to: "/receitas", label: "Receitas", icon: BookOpen, allow: ["admin", "cozinha", "compras"] },
  { to: "/producao", label: "Produção", icon: ChefHat, allow: ["admin", "cozinha"] },
  { to: "/relatorios", label: "Relatórios", icon: FileText, allow: ["admin", "compras"] },
  { to: "/alertas", label: "Alertas", icon: Bell, allow: ["admin", "cozinha", "compras"] },
  { to: "/usuarios", label: "Usuários", icon: Users, allow: ["admin"] },
  { to: "/ajuda", label: "Ajuda", icon: HelpCircle, allow: ["admin", "cozinha", "compras"] },
];

export function DesktopSidebar() {
  const { role } = useAuth();
  const { pathname } = useLocation();
  const items = allItems.filter((i) => !role || i.allow.includes(role));

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <img src={logo} alt="Helena Rabelo" className="h-12 w-12 rounded-full object-cover shadow-soft" />
        <div className="leading-tight">
          <p className="font-display text-lg text-secondary">Helena Rabelo</p>
          <p className="text-xs text-muted-foreground">Controle de Estoque</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-1">
          {items.map((it) => {
            const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
