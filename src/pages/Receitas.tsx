import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, BookOpen, X } from "lucide-react";
import { brl, num } from "@/lib/format";

type Receita = {
  id: string;
  nome: string;
  rendimento: number;
  descricao: string | null;
  foto_url: string | null;
  ingredientes?: { id: string; materia_prima_id: string; quantidade: number; materias_primas?: { nome: string; unidade: string; custo_medio: number } }[];
};

type Materia = { id: string; nome: string; unidade: string; custo_medio: number };

export default function Receitas() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Receita | null>(null);
  const [busy, setBusy] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [form, setForm] = useState({ nome: "", rendimento: 1, descricao: "" });
  const [ings, setIngs] = useState<{ materia_prima_id: string; quantidade: number }[]>([]);

  const load = async () => {
    const [{ data: r }, { data: mp }] = await Promise.all([
      supabase.from("receitas").select("*, ingredientes:receita_ingredientes(id,materia_prima_id,quantidade,materias_primas(nome,unidade,custo_medio))").order("nome"),
      supabase.from("materias_primas").select("id,nome,unidade,custo_medio").order("nome"),
    ]);
    setReceitas((r as any) || []);
    setMaterias((mp as any) || []);
  };

  useEffect(() => { load(); }, []);

  const abrirNovo = () => {
    setEditing(null);
    setForm({ nome: "", rendimento: 1, descricao: "" });
    setIngs([]);
    setFoto(null);
    setOpen(true);
  };

  const abrirEdicao = (r: Receita) => {
    setEditing(r);
    setForm({ nome: r.nome, rendimento: Number(r.rendimento), descricao: r.descricao ?? "" });
    setIngs((r.ingredientes ?? []).map((i) => ({ materia_prima_id: i.materia_prima_id, quantidade: Number(i.quantidade) })));
    setFoto(null);
    setOpen(true);
  };

  const uploadFoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `receitas/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("materias-fotos").upload(path, file);
    if (error) return null;
    return supabase.storage.from("materias-fotos").getPublicUrl(path).data.publicUrl;
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error("Informe o nome");
    if (ings.some((i) => !i.materia_prima_id || i.quantidade <= 0)) return toast.error("Ingredientes inválidos");
    setBusy(true);
    let foto_url = editing?.foto_url ?? null;
    if (foto) foto_url = (await uploadFoto(foto)) ?? foto_url;
    let recId = editing?.id;
    if (editing) {
      const { error } = await supabase.from("receitas").update({
        nome: form.nome, rendimento: form.rendimento, descricao: form.descricao || null, foto_url,
      }).eq("id", editing.id);
      if (error) { setBusy(false); return toast.error(error.message); }
      await supabase.from("receita_ingredientes").delete().eq("receita_id", editing.id);
    } else {
      const { data, error } = await supabase.from("receitas").insert({
        nome: form.nome, rendimento: form.rendimento, descricao: form.descricao || null, foto_url,
      }).select().single();
      if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Erro"); }
      recId = data.id;
    }
    if (recId && ings.length) {
      const { error } = await supabase.from("receita_ingredientes").insert(
        ings.map((i) => ({ receita_id: recId, materia_prima_id: i.materia_prima_id, quantidade: i.quantidade }))
      );
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    setBusy(false);
    toast.success("Salvo!");
    setOpen(false);
    load();
  };

  const remover = async (r: Receita) => {
    if (!confirm(`Remover ${r.nome}?`)) return;
    const { error } = await supabase.from("receitas").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const custoIng = (mat_id: string, qtd: number) => {
    const m = materias.find((x) => x.id === mat_id);
    return m ? Number(m.custo_medio) * qtd : 0;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-secondary">Receitas</h1>
          <p className="text-sm text-muted-foreground">{receitas.length} receita(s)</p>
        </div>
        {isAdmin && (
          <Button onClick={abrirNovo} className="h-12 shadow-soft">
            <Plus className="h-4 w-4" /> Nova receita
          </Button>
        )}
      </div>

      {receitas.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          Nenhuma receita cadastrada.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {receitas.map((r) => {
            const custo = (r.ingredientes ?? []).reduce(
              (s, i) => s + Number(i.materias_primas?.custo_medio ?? 0) * Number(i.quantidade), 0);
            return (
              <Card key={r.id} className="shadow-card overflow-hidden">
                {r.foto_url && <img src={r.foto_url} alt={r.nome} className="h-32 w-full object-cover" />}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-lg text-secondary truncate">{r.nome}</p>
                      <p className="text-xs text-muted-foreground">Rende {num(Number(r.rendimento))} • {r.ingredientes?.length ?? 0} ingredientes</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEdicao(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remover(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Custo total</span>
                    <span className="font-semibold text-secondary">{brl(custo)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Custo / unidade</span>
                    <span>{brl(custo / Math.max(Number(r.rendimento), 1))}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-secondary">
              {editing ? "Editar receita" : "Nova receita"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Rendimento (unidades por lote)</Label>
                <Input type="number" step="0.01" value={form.rendimento} onChange={(e) => setForm({ ...form, rendimento: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Foto</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
            </div>

            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Ingredientes</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setIngs([...ings, { materia_prima_id: "", quantidade: 0 }])}>
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>
              {ings.length === 0 && <p className="text-xs text-muted-foreground">Nenhum ingrediente.</p>}
              {ings.map((i, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Matéria-prima</Label>
                    <Select value={i.materia_prima_id} onValueChange={(v) => {
                      const next = [...ings]; next[idx] = { ...next[idx], materia_prima_id: v }; setIngs(next);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
                      <SelectContent>
                        {materias.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.unidade})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Qtd</Label>
                    <Input type="number" step="0.001" value={i.quantidade} onChange={(e) => {
                      const next = [...ings]; next[idx] = { ...next[idx], quantidade: Number(e.target.value) }; setIngs(next);
                    }} />
                  </div>
                  <div className="w-20 text-xs text-muted-foreground pb-2">
                    {brl(custoIng(i.materia_prima_id, i.quantidade))}
                  </div>
                  <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => setIngs(ings.filter((_, k) => k !== idx))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {ings.length > 0 && (
                <p className="text-right text-sm font-semibold pt-2 border-t">
                  Custo total: {brl(ings.reduce((s, i) => s + custoIng(i.materia_prima_id, i.quantidade), 0))}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
