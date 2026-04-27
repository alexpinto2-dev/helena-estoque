import { useEffect, useState, FormEvent, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, Loader2, FileText, Paperclip } from "lucide-react";
import { brl, num, dataHoraBR, dataBR } from "@/lib/format";

type Mov = {
  id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  custo_unitario: number | null;
  motivo: string | null;
  validade: string | null;
  created_at: string;
  materia_prima_id: string;
  nf_numero: string | null;
  nf_data: string | null;
  nf_arquivo_url: string | null;
  fornecedor_id: string | null;
  materias_primas?: { nome: string; unidade: string } | null;
  fornecedores?: { nome: string } | null;
};

type Materia = { id: string; nome: string; unidade: string };
type Fornecedor = { id: string; nome: string };

export default function Movimentacoes() {
  const { role } = useAuth();
  const podeMov = role === "admin" || role === "cozinha";
  const [movs, setMovs] = useState<Mov[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroMateria, setFiltroMateria] = useState<string>("todas");
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [busy, setBusy] = useState(false);
  const [arquivoNF, setArquivoNF] = useState<File | null>(null);
  const [form, setForm] = useState({
    materia_prima_id: "",
    quantidade: 0,
    custo_unitario: 0,
    validade: "",
    motivo: "",
    nf_numero: "",
    nf_data: "",
    fornecedor_id: "",
  });

  const load = async () => {
    const [{ data: m }, { data: mp }, { data: fs }] = await Promise.all([
      supabase
        .from("movimentacoes")
        .select("*, materias_primas(nome,unidade), fornecedores(nome)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("materias_primas").select("id,nome,unidade").order("nome"),
      supabase.from("fornecedores").select("id,nome").order("nome"),
    ]);
    setMovs((m as any) || []);
    setMaterias((mp as any) || []);
    setFornecedores((fs as any) || []);
  };

  useEffect(() => { load(); }, []);

  const abrir = (t: "entrada" | "saida") => {
    setTipo(t);
    setArquivoNF(null);
    setForm({
      materia_prima_id: "", quantidade: 0, custo_unitario: 0,
      validade: "", motivo: "", nf_numero: "", nf_data: "", fornecedor_id: "",
    });
    setOpen(true);
  };

  const uploadNF = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("notas-fiscais").upload(path, file, {
      cacheControl: "3600", upsert: false,
    });
    if (error) {
      toast.error("Erro ao enviar NF: " + error.message);
      return null;
    }
    return path;
  };

  const baixarNF = async (path: string) => {
    const { data, error } = await supabase.storage.from("notas-fiscais").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) return toast.error("Não foi possível abrir a NF.");
    window.open(data.signedUrl, "_blank");
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.materia_prima_id || form.quantidade <= 0) {
      return toast.error("Informe matéria e quantidade.");
    }
    setBusy(true);

    let nf_arquivo_url: string | null = null;
    if (tipo === "entrada" && arquivoNF) {
      if (arquivoNF.size > 10 * 1024 * 1024) {
        setBusy(false);
        return toast.error("Arquivo da NF excede 10MB.");
      }
      nf_arquivo_url = await uploadNF(arquivoNF);
      if (!nf_arquivo_url) { setBusy(false); return; }
    }

    const { error } = await supabase.rpc("aplicar_movimentacao", {
      _materia_id: form.materia_prima_id,
      _tipo: tipo,
      _quantidade: form.quantidade,
      _custo_unitario: tipo === "entrada" ? form.custo_unitario : null,
      _validade: tipo === "entrada" && form.validade ? form.validade : null,
      _motivo: form.motivo || null,
      _producao_id: null,
      _nf_numero: tipo === "entrada" && form.nf_numero ? form.nf_numero : null,
      _nf_data: tipo === "entrada" && form.nf_data ? form.nf_data : null,
      _nf_arquivo_url: nf_arquivo_url,
      _fornecedor_id: tipo === "entrada" && form.fornecedor_id ? form.fornecedor_id : null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(tipo === "entrada" ? "Entrada registrada!" : "Saída registrada!");
    setOpen(false);
    load();
  };

  const filtrados = movs.filter((m) => {
    if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return false;
    if (filtroMateria !== "todas" && m.materia_prima_id !== filtroMateria) return false;
    return true;
  });

  // Resumo do mês corrente
  const resumo = useMemo(() => {
    const now = new Date();
    const mes = now.getMonth(), ano = now.getFullYear();
    let qe = 0, qs = 0, ve = 0, vs = 0;
    movs.forEach((m) => {
      const d = new Date(m.created_at);
      if (d.getMonth() !== mes || d.getFullYear() !== ano) return;
      const v = Number(m.quantidade) * Number(m.custo_unitario || 0);
      if (m.tipo === "entrada") { qe += Number(m.quantidade); ve += v; }
      else { qs += Number(m.quantidade); vs += v; }
    });
    return { qe, qs, ve, vs };
  }, [movs]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-secondary">Movimentação</h1>
        <p className="text-sm text-muted-foreground">Entradas e saídas de estoque</p>
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-success">
              <ArrowDownToLine className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Entradas no mês</span>
            </div>
            <p className="font-display text-2xl text-secondary mt-1">{brl(resumo.ve)}</p>
            <p className="text-xs text-muted-foreground">{num(resumo.qe, 2)} unid. movimentadas</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-secondary">
              <ArrowUpFromLine className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Saídas no mês</span>
            </div>
            <p className="font-display text-2xl text-secondary mt-1">{brl(resumo.vs)}</p>
            <p className="text-xs text-muted-foreground">{num(resumo.qs, 2)} unid. movimentadas</p>
          </CardContent>
        </Card>
      </div>

      {podeMov && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => abrir("entrada")}
            className="h-16 text-base shadow-soft bg-success hover:bg-success/90 text-success-foreground"
          >
            <ArrowDownToLine className="h-5 w-5" /> Entrada (Compra)
          </Button>
          <Button
            onClick={() => abrir("saida")}
            className="h-16 text-base shadow-soft"
            variant="secondary"
          >
            <ArrowUpFromLine className="h-5 w-5" /> Saída
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroMateria} onValueChange={setFiltroMateria}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas matérias</SelectItem>
            {materias.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtrados.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma movimentação.</CardContent></Card>
        ) : filtrados.map((m) => (
          <Card key={m.id} className="shadow-card">
            <CardContent className="p-3 flex items-center gap-3">
              <div
                className={
                  "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 " +
                  (m.tipo === "entrada"
                    ? "bg-success/15 text-success"
                    : "bg-secondary/15 text-secondary")
                }
              >
                {m.tipo === "entrada" ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{m.materias_primas?.nome ?? "—"}</p>
                  <Badge variant={m.tipo === "entrada" ? "default" : "secondary"} className="text-[10px]">
                    {m.tipo}
                  </Badge>
                  {m.nf_numero && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <FileText className="h-2.5 w-2.5" /> NF {m.nf_numero}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {dataHoraBR(m.created_at)}
                  {m.fornecedores?.nome && ` • ${m.fornecedores.nome}`}
                  {m.motivo && ` • ${m.motivo}`}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-0.5">
                <p className={"font-display text-lg " + (m.tipo === "entrada" ? "text-success" : "text-secondary")}>
                  {m.tipo === "entrada" ? "+" : "−"}{num(Number(m.quantidade), 3)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {m.materias_primas?.unidade}
                  {m.custo_unitario ? ` • ${brl(Number(m.custo_unitario) * Number(m.quantidade))}` : ""}
                </p>
                {m.nf_arquivo_url && (
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => baixarNF(m.nf_arquivo_url!)}>
                    <Paperclip className="h-3 w-3" /> NF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-secondary">
              {tipo === "entrada" ? "Registrar entrada" : "Registrar saída"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Matéria-prima *</Label>
              <Select value={form.materia_prima_id} onValueChange={(v) => setForm({ ...form, materia_prima_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {materias.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nome} ({m.unidade})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade *</Label>
              <Input type="number" step="0.001" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} required />
            </div>
            {tipo === "entrada" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Custo unit. (R$)</Label>
                    <Input type="number" step="0.01" value={form.custo_unitario} onChange={(e) => setForm({ ...form, custo_unitario: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Validade</Label>
                    <Input type="date" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} />
                  </div>
                </div>
                {form.quantidade > 0 && form.custo_unitario > 0 && (
                  <p className="text-xs text-muted-foreground bg-accent/40 p-2 rounded-md">
                    Total da compra: <strong className="text-secondary">{brl(form.quantidade * form.custo_unitario)}</strong>
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label>Fornecedor</Label>
                  <Select value={form.fornecedor_id} onValueChange={(v) => setForm({ ...form, fornecedor_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {fornecedores.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground">Nenhum fornecedor cadastrado.</div>
                      ) : fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <p className="text-xs font-medium text-secondary flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Nota Fiscal (opcional)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Número NF</Label>
                      <Input value={form.nf_numero} onChange={(e) => setForm({ ...form, nf_numero: e.target.value })} maxLength={30} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Data emissão</Label>
                      <Input type="date" value={form.nf_data} onChange={(e) => setForm({ ...form, nf_data: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Arquivo (PDF ou imagem, máx 10MB)</Label>
                    <Input type="file" accept="application/pdf,image/*" onChange={(e) => setArquivoNF(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Motivo / Observação</Label>
              <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder={tipo === "saida" ? "Ex: Perda, ajuste..." : "Ex: Compra mensal"} maxLength={200} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
