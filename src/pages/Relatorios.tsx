import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCSV, brl, num, dataBR, dataHoraBR } from "@/lib/format";
import { Download, FileText, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";

type NFRow = {
  id: string;
  created_at: string;
  nf_numero: string | null;
  nf_data: string | null;
  nf_arquivo_url: string | null;
  quantidade: number;
  custo_unitario: number | null;
  fornecedor_id: string | null;
  fornecedores: { nome: string } | null;
  materias_primas: { nome: string } | null;
};

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

  // ====== NF tab ======
  const [nfLoading, setNfLoading] = useState(false);
  const [nfRows, setNfRows] = useState<NFRow[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const carregarNF = async () => {
    setNfLoading(true);
    const { data, error } = await supabase
      .from("movimentacoes")
      .select("id,created_at,nf_numero,nf_data,nf_arquivo_url,quantidade,custo_unitario,fornecedor_id,fornecedores(nome),materias_primas(nome)")
      .eq("tipo", "entrada")
      .not("nf_numero", "is", null)
      .gte("created_at", de)
      .lte("created_at", ate + "T23:59:59")
      .order("nf_data", { ascending: false });
    setNfLoading(false);
    if (error) return toast.error(error.message);
    setNfRows((data ?? []) as any);
  };

  useEffect(() => { carregarNF(); /* eslint-disable-next-line */ }, [de, ate]);

  const baixarArquivo = async (row: NFRow) => {
    if (!row.nf_arquivo_url) return;
    setDownloadingId(row.id);
    const { data, error } = await supabase.storage
      .from("notas-fiscais")
      .createSignedUrl(row.nf_arquivo_url, 60);
    setDownloadingId(null);
    if (error || !data) return toast.error("Erro ao gerar link");
    window.open(data.signedUrl, "_blank");
  };

  // Agrupa por fornecedor
  const grupos = nfRows.reduce<Record<string, { nome: string; rows: NFRow[]; total: number }>>((acc, r) => {
    const key = r.fornecedor_id ?? "sem";
    const nome = r.fornecedores?.nome ?? "Sem fornecedor";
    if (!acc[key]) acc[key] = { nome, rows: [], total: 0 };
    acc[key].rows.push(r);
    acc[key].total += Number(r.quantidade) * Number(r.custo_unitario ?? 0);
    return acc;
  }, {});

  const exportarNF = () => {
    downloadCSV(`notas_fiscais_${de}_${ate}.csv`,
      nfRows.map(r => ({
        Fornecedor: r.fornecedores?.nome ?? "",
        "NF Número": r.nf_numero ?? "",
        "Data NF": r.nf_data ? dataBR(r.nf_data) : "",
        Item: r.materias_primas?.nome ?? "",
        Quantidade: num(Number(r.quantidade), 3),
        "Custo unit.": r.custo_unitario ? brl(Number(r.custo_unitario)) : "",
        "Valor total": brl(Number(r.quantidade) * Number(r.custo_unitario ?? 0)),
        "Tem arquivo": r.nf_arquivo_url ? "Sim" : "Não",
      }))
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-secondary">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Exporte dados em CSV (Excel) e visualize notas fiscais</p>
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

      <Tabs defaultValue="exportar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exportar">Exportar CSV</TabsTrigger>
          <TabsTrigger value="nf">Notas Fiscais</TabsTrigger>
        </TabsList>

        <TabsContent value="exportar" className="space-y-3 mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Item k="inv" title="Inventário atual" desc="Todas as matérias-primas com saldo e valor" onClick={inventario} />
            <Item k="cons" title="Consumo por período" desc="Saídas no intervalo selecionado" onClick={consumo} />
            <Item k="cr" title="Custo por receita" desc="Produções e custos no intervalo" onClick={custoReceita} />
            <Item k="mov" title="Histórico de movimentações" desc="Entradas e saídas no intervalo" onClick={movs} />
          </div>
        </TabsContent>

        <TabsContent value="nf" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {nfRows.length} {nfRows.length === 1 ? "nota encontrada" : "notas encontradas"} no período
            </p>
            <Button onClick={exportarNF} variant="secondary" size="sm" disabled={nfRows.length === 0}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>

          {nfLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(grupos).length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma nota fiscal registrada no período.
              </CardContent>
            </Card>
          ) : (
            Object.entries(grupos).map(([key, g]) => (
              <Card key={key} className="shadow-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-secondary">{g.nome}</p>
                      <p className="text-xs text-muted-foreground">{g.rows.length} nota(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold">{brl(g.total)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>NF</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Valor total</TableHead>
                          <TableHead className="text-right">Arquivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {g.rows.map((r) => {
                          const valor = Number(r.quantidade) * Number(r.custo_unitario ?? 0);
                          return (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">{r.nf_numero}</TableCell>
                              <TableCell>{r.nf_data ? dataBR(r.nf_data) : dataBR(r.created_at)}</TableCell>
                              <TableCell className="text-muted-foreground">{r.materias_primas?.nome ?? "-"}</TableCell>
                              <TableCell className="text-right">{brl(valor)}</TableCell>
                              <TableCell className="text-right">
                                {r.nf_arquivo_url ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => baixarArquivo(r)}
                                    disabled={downloadingId === r.id}
                                  >
                                    {downloadingId === r.id
                                      ? <Loader2 className="h-4 w-4 animate-spin" />
                                      : <><Paperclip className="h-4 w-4" /> Baixar</>}
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
