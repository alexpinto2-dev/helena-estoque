import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeftRight,
  BookOpen,
  Bell,
  HelpCircle,
  Users,
  FileText,
  LogOut,
} from "lucide-react";

const all = [
  { to: "/movimentacoes", label: "Movimentação", icon: ArrowLeftRight, allow: ["admin", "cozinha", "compras"] },
  { to: "/receitas", label: "Receitas", icon: BookOpen, allow: ["admin", "cozinha", "compras"] },
  { to: "/relatorios", label: "Relatórios", icon: FileText, allow: ["admin", "compras"] },
  { to: "/alertas", label: "Alertas", icon: Bell, allow: ["admin", "cozinha", "compras"] },
  { to: "/usuarios", label: "Usuários", icon: Users, allow: ["admin"] },
  { to: "/ajuda", label: "Ajuda", icon: HelpCircle, allow: ["admin", "cozinha", "compras"] },
];

export default function Mais() {
  const { role, signOut, profileName } = useAuth();
  const items = all.filter((i) => !role || i.allow.includes(role));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-secondary">Mais</h1>
        <p className="text-sm text-muted-foreground">Olá, {profileName}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.to} to={it.to}>
              <Card className="shadow-card hover:shadow-soft transition-shadow">
                <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-secondary" />
                  </div>
                  <p className="font-medium">{it.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        <button onClick={signOut} className="col-span-2">
          <Card className="shadow-card hover:shadow-soft transition-shadow border-destructive/30">
            <CardContent className="p-4 flex items-center justify-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" /> <span className="font-medium">Sair da conta</span>
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
}
