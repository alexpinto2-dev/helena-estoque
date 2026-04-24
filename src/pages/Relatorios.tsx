import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadCSV, brl, num, dataBR, dataHoraBR } from "@/lib/format";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Relatorios() {
  const [busy, setBusy] = useState<string | null>(null);
  const hoje = new Date().toISOString().slice(0, 10);
  const trintaDias = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [de, setDe] = useState(trintaDias);
  const [ate, setAte] = useState(hoje);

  const inventario = async () => {
    setBusy("inv");
    const { data, error } = await supabase
      .from("materias_primas")
      .select("nome,categoria,unidade,quantidade,estoque_minimo,validade,custo_medio,fornecedor")
      .order("nome");
    setBusy(null);
    if (error) return toast.error(error.message);
    downloadCSV("inventario.csv",
      (data ?? []).map((m: any) => ({
        Nome: m.nome,
        Categoria: m.categoria ?? "",
        Unidade: m.unidade,
        "Qtd atual": num(Number(m.quantidade), 3),
        "Estoque mínimo": num(Number(m.estoque_minimo), 3),
        Validade: m.validade ? dataBR(m.validade) : "",
        "Custo médio": brl(Number(m.custo_medio)),
        "Valor total": brl(Number(m.quantidade) * Number(m.custo_medio)),
        Fornecedor: m.fornecedor ?? "",
      }))
    );
    toast.success("Inventário exportado");
  };

  const consumo = async () => {
    setBusy("cons");
    const { data, error } = await supabase
      .from("movimentacoes")
      .select("created_at,quantidade,custo_unitario,motivo,materias_primas(nome,unidade)")
      .eq("tipo", "saida")
      .gte("created_at", de)
      .lte("created_at", ate + "T23:59:59")
      .order("created_at");
    setBusy(null);
    if (error) return toast.error(error.message);
    downloadCSV(`consumo_${de}_${ate}.csv`,
      (data ?? []).map((m: any) => ({
        Data: dataHoraBR(m.created_at),
        Item: m.materias_primas?.nome ?? "",
        Unidade: m.materias_primas?.unidade ?? "",
        Quantidade: num(Number(m.quantidade), 3),
        "Custo unit.": m.custo_unitario ? brl(Number(m.custo_unitario)) : "",
        Motivo: m.motivo ?? "",
      }))
    );
    toast.success("Consumo exportado");
  };

  const custoReceita = async () => {
    setBusy("cr");
    const { data, error } = await supabase
      .from("producoes")
      .select("created_at,lotes,custo_total,observacao,receitas(nome,rendimento)")
      .gte("created_at", de)
      .lte("created_at", ate + "T23:59:59")
      .order("created_at");
    setBusy(null);
    if (error) return toast.error(error.message);
    downloadCSV(`custo_receitas_${de}_${ate}.csv`,
      (data ?? []).map((p: any) => ({
        Data: dataHoraBR(p.created_at),
        Receita: p.receitas?.nome ?? "",
        Lotes: num(Number(p.lotes)),
        "Rendimento total": num(Number(p.lotes) * Number(p.receitas?.rendimento ?? 0)),
        "Custo total": brl(Number(p.custo_total)),
        "Custo / unidade": brl(Number(p.custo_total) / Math.max(Number(p.lotes) * Number(p.receitas?.rendimento ?? 1), 1)),
        Observação: p.observacao ?? "",
      }))
    );
    toast.success("Custo por receita exportado");
  };

  const movs = async () => {
    setBusy("mov");
    const { data, error } = await supabase
      .from("movimentacoes")
      .select("created_at,tipo,quantidade,custo_unitario,motivo,validade,materias_primas(nome,unidade)")
      .gte("created_at", de)
      .lte("created_at", ate + "T23:59:59")
      .order("created_at");
    setBusy(null);
    if (error) return toast.error(error.message);
    downloadCSV(`movimentacoes_${de}_${ate}.csv`,
      (data ?? []).map((m: any) => ({
        Data: dataHoraBR(m.created_at),
        Tipo: m.tipo,
        Item: m.materias_primas?.nome ?? "",
        Unidade: m.materias_primas?.unidade ?? "",
        Quantidade: num(Number(m.quantidade), 3),
        "Custo unit.": m.custo_unitario ? brl(Number(m.custo_unitario)) : "",
        Validade: m.validade ? dataBR(m.validade) : "",
        Motivo: m.motivo ?? "",
      }))
    );
    toast.success("Movimentações exportadas");
  };

  const Item = ({ title, desc, onClick, k }: any) => (
    <Card className="shadow-card">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <FileText className="h-6 w-6 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <Button onClick={onClick} disabled={busy === k} variant="secondary" size="sm">
          {busy === k ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4" /> CSV</>}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-secondary">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Exporte dados em CSV (Excel)</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Período de</Label>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Até</Label>
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Item k="inv" title="Inventário atual" desc="Todas as matérias-primas com saldo e valor" onClick={inventario} />
        <Item k="cons" title="Consumo por período" desc="Saídas no intervalo selecionado" onClick={consumo} />
        <Item k="cr" title="Custo por receita" desc="Produções e custos no intervalo" onClick={custoReceita} />
        <Item k="mov" title="Histórico de movimentações" desc="Entradas e saídas no intervalo" onClick={movs} />
      </div>
    </div>
  );
}
