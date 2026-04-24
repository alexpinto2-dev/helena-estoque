import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { brl, num, diasAte } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import {
  Banknote,
  PackageX,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  PieChart as PieIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Materia = {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  estoque_minimo: number;
  validade: string | null;
  custo_medio: number;
};

type Mov = {
  tipo: "entrada" | "saida";
  quantidade: number;
  custo_unitario: number | null;
  created_at: string;
  materia_prima_id: string;
  materias_primas?: { nome: string } | null;
};

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const { profileName, user } = useAuth();
  const [materias, setMaterias] = useState<Materia[] | null>(null);
  const [movsMes, setMovsMes] = useState<Mov[]>([]);
  const [topUsadas, setTopUsadas] = useState<{ nome: string; qtd: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("materias_primas")
        .select("id,nome,unidade,quantidade,estoque_minimo,validade,custo_medio");
      setMaterias((data as any) || []);

      // Movimentações do mês corrente
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const { data: movsM } = await supabase
        .from("movimentacoes")
        .select("tipo,quantidade,custo_unitario,created_at,materia_prima_id,materias_primas(nome)")
        .gte("created_at", inicioMes.toISOString());
      setMovsMes((movsM as any) ?? []);

      // Top 5 últimos 30 dias
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

  const mesNome = new Date().toLocaleDateString("pt-BR", { month: "long" });
  const primeiroNome = (profileName ?? user?.email ?? "doceira").split(" ")[0].split("@")[0];

  const { entradasQtd, saidasQtd, entradasValor, saidasValor } = useMemo(() => {
    let eq = 0, sq = 0, ev = 0, sv = 0;
    movsMes.forEach((m) => {
      const q = Number(m.quantidade);
      const c = Number(m.custo_unitario ?? 0);
      if (m.tipo === "entrada") {
        eq += q;
        ev += q * c;
      } else {
        sq += q;
        sv += q * c;
      }
    });
    return { entradasQtd: eq, saidasQtd: sq, entradasValor: ev, saidasValor: sv };
  }, [movsMes]);

  // Movimentações diárias (gráfico de barras)
  const dadosDiarios = useMemo(() => {
    const map = new Map<string, { dia: string; entradas: number; saidas: number }>();
    movsMes.forEach((m) => {
      const d = new Date(m.created_at);
      const key = String(d.getDate()).padStart(2, "0");
      const cur = map.get(key) ?? { dia: key, entradas: 0, saidas: 0 };
      const q = Number(m.quantidade);
      if (m.tipo === "entrada") cur.entradas += q;
      else cur.saidas += q;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => Number(a.dia) - Number(b.dia));
  }, [movsMes]);

  // Distribuição de valor por matéria-prima (top 6 + outros)
  const distribuicaoValor = useMemo(() => {
    if (!materias) return [];
    const itens = materias
      .map((m) => ({ nome: m.nome, valor: Number(m.quantidade) * Number(m.custo_medio) }))
      .filter((m) => m.valor > 0)
      .sort((a, b) => b.valor - a.valor);
    const top = itens.slice(0, 6);
    const outros = itens.slice(6).reduce((s, i) => s + i.valor, 0);
    if (outros > 0) top.push({ nome: "Outros", valor: outros });
    return top;
  }, [materias]);

  const PIE_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent-foreground))",
    "hsl(var(--warning))",
    "hsl(var(--muted-foreground))",
    "hsl(var(--destructive))",
    "hsl(var(--border))",
  ];

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
        <h1 className="font-display text-3xl text-secondary">
          {saudacao()}, {primeiroNome}! 💕
        </h1>
        <p className="text-sm text-muted-foreground">Resumo do estoque hoje</p>
      </div>

      {/* Resumo do mês: entradas e saídas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-card border-success/30 bg-success/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/15 text-success flex items-center justify-center">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Entradas em {mesNome}
              </p>
              <p className="font-display text-2xl text-foreground">{num(entradasQtd, 3)}</p>
              <p className="text-xs text-muted-foreground">{brl(entradasValor)} em compras</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-primary/30 bg-primary/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 text-secondary flex items-center justify-center">
              <ArrowUpCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Saídas em {mesNome}
              </p>
              <p className="font-display text-2xl text-foreground">{num(saidasQtd, 3)}</p>
              <p className="text-xs text-muted-foreground">{brl(saidasValor)} consumidos</p>
            </div>
          </CardContent>
        </Card>
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

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-xl text-secondary">
                Movimentações diárias — {mesNome}
              </h2>
            </div>
            {dadosDiarios.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Sem movimentações neste mês ainda.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosDiarios}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="entradas" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="saidas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-xl text-secondary">Valor por matéria-prima</h2>
            </div>
            {distribuicaoValor.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Cadastre matérias-primas para ver a distribuição.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribuicaoValor}
                      dataKey="valor"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      paddingAngle={2}
                    >
                      {distribuicaoValor.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any) => brl(Number(v))}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
