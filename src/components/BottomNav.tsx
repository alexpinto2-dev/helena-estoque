import { NavLink, useLocation } from "react-router-dom";
import { Home, Package, ChefHat, FileText, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/materias", label: "Estoque", icon: Package },
  { to: "/producao", label: "Produção", icon: ChefHat },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
  { to: "/mais", label: "Mais", icon: MoreHorizontal },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-md shadow-elegant md:hidden safe-bottom">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active =
            it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <NavLink
                to={it.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span>{it.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
