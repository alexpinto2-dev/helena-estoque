import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { brl, num, diasAte } from "@/lib/format";
import {
  Banknote,
  PackageX,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

type Materia = {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  estoque_minimo: number;
  validade: string | null;
  custo_medio: number;
};

export default function Dashboard() {
  const [materias, setMaterias] = useState<Materia[] | null>(null);
  const [topUsadas, setTopUsadas] = useState<{ nome: string; qtd: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("materias_primas")
        .select("id,nome,unidade,quantidade,estoque_minimo,validade,custo_medio");
      setMaterias((data as any) || []);

      const desde = new Date();
      desde.setDate(desde.getDate() - 30);
      const { data: movs } = await supabase
        .from("movimentacoes")
        .select("quantidade,materia_prima_id,materias_primas(nome)")
        .eq("tipo", "saida")
        .gte("created_at", desde.toISOString());
      const map = new Map<string, number>();
      (movs ?? []).forEach((m: any) => {
        const nome = m.materias_primas?.nome ?? "—";
        map.set(nome, (map.get(nome) ?? 0) + Number(m.quantidade));
      });
      const top = Array.from(map.entries())
        .map(([nome, qtd]) => ({ nome, qtd }))
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 5);
      setTopUsadas(top);
    })();
  }, []);

  if (!materias) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    );
  }

  const valorTotal = materias.reduce((s, m) => s + Number(m.quantidade) * Number(m.custo_medio), 0);
  const baixo = materias.filter((m) => Number(m.quantidade) <= Number(m.estoque_minimo));
  const vencendo = materias.filter((m) => {
    const d = diasAte(m.validade);
    return d !== null && d >= 0 && d <= 30;
  });
  const vencidos = materias.filter((m) => {
    const d = diasAte(m.validade);
    return d !== null && d < 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-secondary">Olá, doceira! 💕</h1>
        <p className="text-sm text-muted-foreground">Resumo do estoque hoje</p>
      </div>

      {(baixo.length > 0 || vencendo.length > 0 || vencidos.length > 0) && (
        <Link to="/alertas">
          <Card className="border-warning/40 bg-warning/10 shadow-soft hover:shadow-elegant transition-shadow">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">
                  {baixo.length + vencendo.length + vencidos.length} alerta(s) ativos
                </p>
                <p className="text-muted-foreground">
                  {baixo.length} item(ns) com estoque baixo • {vencendo.length} vencendo em 30 dias
                  {vencidos.length > 0 && ` • ${vencidos.length} vencido(s)`}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashCard
          title="Valor total do estoque"
          value={brl(valorTotal)}
          icon={Banknote}
          gradient
        />
        <DashCard
          title="Itens com estoque baixo"
          value={String(baixo.length)}
          icon={PackageX}
          accent="warning"
        />
        <DashCard
          title="Vencendo em 30 dias"
          value={String(vencendo.length)}
          icon={CalendarClock}
          accent="primary"
        />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <h2 className="font-display text-xl text-secondary">Top 5 mais usadas (30 dias)</h2>
          </div>
          {topUsadas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma saída nos últimos 30 dias.
            </p>
          ) : (
            <ul className="space-y-3">
              {topUsadas.map((t, i) => {
                const max = topUsadas[0].qtd;
                const pct = (t.qtd / max) * 100;
                return (
                  <li key={t.nome}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">
                        {i + 1}. {t.nome}
                      </span>
                      <span className="text-muted-foreground">{num(t.qtd, 3)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashCard({
  title,
  value,
  icon: Icon,
  gradient,
  accent,
}: {
  title: string;
  value: string;
  icon: any;
  gradient?: boolean;
  accent?: "warning" | "primary";
}) {
  return (
    <Card
      className={
        gradient
          ? "bg-gradient-choco text-primary-foreground shadow-elegant border-0"
          : "shadow-card hover:shadow-soft transition-shadow"
      }
    >
      <CardContent className="p-5 flex items-center gap-4 bg-accent">
        <div
          className={
            gradient
              ? "h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center"
              : accent === "warning"
              ? "h-12 w-12 rounded-xl bg-warning/15 text-warning flex items-center justify-center"
              : "h-12 w-12 rounded-xl bg-primary/20 text-secondary flex items-center justify-center"
          }
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className={gradient ? "text-primary-foreground" : ""}>
          <p
            className={
              gradient
                ? "text-xs uppercase tracking-wide opacity-80"
                : "text-xs uppercase tracking-wide text-muted-foreground"
            }
          >
            {title}
          </p>
          <p className="font-display text-2xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
