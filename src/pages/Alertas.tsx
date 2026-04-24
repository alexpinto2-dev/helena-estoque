import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PackageX, CalendarClock } from "lucide-react";
import { num, dataBR, diasAte } from "@/lib/format";

type Materia = {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  estoque_minimo: number;
  validade: string | null;
};

export default function Alertas() {
  const [items, setItems] = useState<Materia[]>([]);

  useEffect(() => {
    supabase.from("materias_primas").select("id,nome,unidade,quantidade,estoque_minimo,validade")
      .order("validade", { ascending: true, nullsFirst: false })
      .then(({ data }) => setItems((data as any) || []));
  }, []);

  const baixos = items.filter((m) => Number(m.quantidade) <= Number(m.estoque_minimo));
  const vencendo = items.filter((m) => {
    const d = diasAte(m.validade);
    return d !== null && d >= 0 && d <= 30;
  });
  const vencidos = items.filter((m) => {
    const d = diasAte(m.validade);
    return d !== null && d < 0;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-secondary flex items-center gap-2">
          <AlertTriangle className="h-7 w-7 text-warning" /> Alertas
        </h1>
        <p className="text-sm text-muted-foreground">{baixos.length + vencendo.length + vencidos.length} alerta(s) ativos</p>
      </div>

      <Section title="Vencidos" icon={CalendarClock} items={vencidos} variant="destructive" empty="Nenhum item vencido 🎉" badge={(m) => `${Math.abs(diasAte(m.validade)!)}d atrás`} />
      <Section title="Vencendo em 30 dias" icon={CalendarClock} items={vencendo} variant="warning" empty="Tudo em dia ✨" badge={(m) => `Em ${diasAte(m.validade)}d`} />
      <Section title="Estoque baixo" icon={PackageX} items={baixos} variant="destructive" empty="Estoque saudável 💪" badge={(m) => `${num(Number(m.quantidade), 3)} ${m.unidade}`} />
    </div>
  );
}

function Section({ title, icon: Icon, items, variant, empty, badge }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <h2 className="font-display text-lg text-secondary">{title}</h2>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="p-4 text-sm text-muted-foreground text-center">{empty}</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((m: any) => (
            <Card key={m.id} className="shadow-card">
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{m.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {num(Number(m.quantidade), 3)} {m.unidade}
                    {m.validade && ` • Val: ${dataBR(m.validade)}`}
                  </p>
                </div>
                <Badge
                  className={
                    variant === "destructive"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-warning text-warning-foreground"
                  }
                >
                  {badge(m)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
