import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
import { brl, num, dataHoraBR } from "@/lib/format";

type Mov = {
  id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  custo_unitario: number | null;
  motivo: string | null;
  validade: string | null;
  created_at: string;
  materia_prima_id: string;
  materias_primas?: { nome: string; unidade: string } | null;
};

type Materia = { id: string; nome: string; unidade: string };

export default function Movimentacoes() {
  const { role } = useAuth();
  const podeMov = role === "admin" || role === "cozinha";
  const [movs, setMovs] = useState<Mov[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroMateria, setFiltroMateria] = useState<string>("todas");
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    materia_prima_id: "",
    quantidade: 0,
    custo_unitario: 0,
    validade: "",
    motivo: "",
  });

  const load = async () => {
    const [{ data: m }, { data: mp }] = await Promise.all([
      supabase
        .from("movimentacoes")
        .select("*, materias_primas(nome,unidade)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("materias_primas").select("id,nome,unidade").order("nome"),
    ]);
    setMovs((m as any) || []);
    setMaterias((mp as any) || []);
  };

  useEffect(() => { load(); }, []);

  const abrir = (t: "entrada" | "saida") => {
    setTipo(t);
    setForm({ materia_prima_id: "", quantidade: 0, custo_unitario: 0, validade: "", motivo: "" });
    setOpen(true);
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.materia_prima_id || form.quantidade <= 0) {
      return toast.error("Informe matéria e quantidade.");
    }
    setBusy(true);
    const { error } = await supabase.rpc("aplicar_movimentacao", {
      _materia_id: form.materia_prima_id,
      _tipo: tipo,
      _quantidade: form.quantidade,
      _custo_unitario: tipo === "entrada" ? form.custo_unitario : null,
      _validade: tipo === "entrada" && form.validade ? form.validade : null,
      _motivo: form.motivo || null,
      _producao_id: null,
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-secondary">Movimentação</h1>
        <p className="text-sm text-muted-foreground">Entradas e saídas de estoque</p>
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
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{m.materias_primas?.nome ?? "—"}</p>
                  <Badge variant={m.tipo === "entrada" ? "default" : "secondary"} className="text-[10px]">
                    {m.tipo}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dataHoraBR(m.created_at)} {m.motivo && `• ${m.motivo}`}
                </p>
              </div>
              <div className="text-right">
                <p className={"font-display text-lg " + (m.tipo === "entrada" ? "text-success" : "text-secondary")}>
                  {m.tipo === "entrada" ? "+" : "−"}{num(Number(m.quantidade), 3)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {m.materias_primas?.unidade} {m.custo_unitario ? `• ${brl(Number(m.custo_unitario))}` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
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
                <div className="space-y-1.5">
                  <Label>Custo unitário (R$)</Label>
                  <Input type="number" step="0.01" value={form.custo_unitario} onChange={(e) => setForm({ ...form, custo_unitario: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Validade</Label>
                  <Input type="date" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Motivo / Observação</Label>
              <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder={tipo === "saida" ? "Ex: Perda, ajuste..." : "Ex: Compra fornecedor X"} />
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
