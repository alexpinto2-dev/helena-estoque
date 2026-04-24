import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ChefHat, Loader2, AlertTriangle, History } from "lucide-react";
import { brl, num, dataHoraBR } from "@/lib/format";

type Receita = {
  id: string;
  nome: string;
  rendimento: number;
  ingredientes: {
    materia_prima_id: string;
    quantidade: number;
    materias_primas: { nome: string; unidade: string; quantidade: number; custo_medio: number };
  }[];
};

type Producao = {
  id: string;
  receita_id: string;
  lotes: number;
  custo_total: number;
  observacao: string | null;
  created_at: string;
  receitas?: { nome: string };
};

export default function Producao() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [receitaId, setReceitaId] = useState("");
  const [lotes, setLotes] = useState(1);
  const [obs, setObs] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("receitas").select("id,nome,rendimento, ingredientes:receita_ingredientes(materia_prima_id,quantidade,materias_primas(nome,unidade,quantidade,custo_medio))").order("nome"),
      supabase.from("producoes").select("*, receitas(nome)").order("created_at", { ascending: false }).limit(20),
    ]);
    setReceitas((r as any) || []);
    setProducoes((p as any) || []);
  };

  useEffect(() => { load(); }, []);

  const receita = receitas.find((r) => r.id === receitaId);
  const preview = receita?.ingredientes.map((i) => {
    const necessario = Number(i.quantidade) * lotes;
    const disponivel = Number(i.materias_primas.quantidade);
    const custo = Number(i.materias_primas.custo_medio) * necessario;
    return { ...i, necessario, disponivel, custo, falta: disponivel < necessario };
  }) ?? [];
  const custoTotal = preview.reduce((s, i) => s + i.custo, 0);
  const algumFalta = preview.some((i) => i.falta);

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    if (!receitaId) return toast.error("Escolha uma receita");
    if (algumFalta) return toast.error("Estoque insuficiente para algum ingrediente");
    setBusy(true);
    const { error } = await supabase.rpc("registrar_producao", {
      _receita_id: receitaId,
      _lotes: lotes,
      _observacao: obs || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Produção registrada! 🎂");
    setObs("");
    setLotes(1);
    setReceitaId("");
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-secondary flex items-center gap-2">
          <ChefHat className="h-7 w-7" /> Registrar produção
        </h1>
        <p className="text-sm text-muted-foreground">Deduz automaticamente os ingredientes do estoque</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-5">
          <form onSubmit={registrar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1.5">
                <Label>Receita *</Label>
                <Select value={receitaId} onValueChange={setReceitaId}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {receitas.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade de lotes *</Label>
                <Input type="number" min="0.01" step="0.01" value={lotes} onChange={(e) => setLotes(Number(e.target.value))} className="h-12" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Opcional" />
            </div>

            {receita && (
              <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                <p className="font-semibold text-sm">Pré-visualização do que será deduzido:</p>
                <ul className="space-y-1.5">
                  {preview.map((i) => (
                    <li key={i.materia_prima_id} className="flex items-center justify-between text-sm gap-2 flex-wrap">
                      <span className="font-medium">{i.materias_primas.nome}</span>
                      <span className={i.falta ? "text-destructive font-semibold" : "text-muted-foreground"}>
                        {num(i.necessario, 3)} {i.materias_primas.unidade} {i.falta && `• Estoque: ${num(i.disponivel, 3)}`}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">Custo total estimado:</span>
                  <span className="font-display text-xl text-secondary">{brl(custoTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rendimento total:</span>
                  <span className="font-medium">{num(Number(receita.rendimento) * lotes)} unidades</span>
                </div>
                {algumFalta && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Estoque insuficiente. Faça uma entrada antes de produzir.</span>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" disabled={busy || !receitaId || algumFalta} className="w-full h-12 text-base shadow-soft">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ChefHat className="h-4 w-4" /> Confirmar produção</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-display text-xl text-secondary flex items-center gap-2 mb-3">
          <History className="h-5 w-5" /> Últimas produções
        </h2>
        {producoes.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhuma produção registrada.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {producoes.map((p) => (
              <Card key={p.id} className="shadow-card">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.receitas?.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {dataHoraBR(p.created_at)} • {num(Number(p.lotes))} lote(s)
                    </p>
                  </div>
                  <span className="font-display text-lg text-secondary">{brl(Number(p.custo_total))}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
