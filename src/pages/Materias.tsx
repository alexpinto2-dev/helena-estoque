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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ImagePlus,
  Loader2,
  PackageX,
  CalendarClock,
} from "lucide-react";
import { brl, num, dataBR, diasAte } from "@/lib/format";

type Materia = {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: "kg" | "g" | "L" | "ml" | "un" | "caixa";
  quantidade: number;
  estoque_minimo: number;
  validade: string | null;
  custo_medio: number;
  fornecedor: string | null;
  fornecedor_id: string | null;
  foto_url: string | null;
};

type Fornecedor = { id: string; nome: string };

type Unidade = "kg" | "g" | "L" | "ml" | "un" | "caixa";
const empty: {
  nome: string; categoria: string; unidade: Unidade;
  quantidade: number; estoque_minimo: number; validade: string;
  custo_medio: number; fornecedor: string; fornecedor_id: string;
} = {
  nome: "",
  categoria: "",
  unidade: "kg",
  quantidade: 0,
  estoque_minimo: 0,
  validade: "",
  custo_medio: 0,
  fornecedor: "",
  fornecedor_id: "",
};

export default function Materias() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [items, setItems] = useState<Materia[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Materia | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: fs }] = await Promise.all([
      supabase
        .from("materias_primas")
        .select("*")
        .order("validade", { ascending: true, nullsFirst: false })
        .order("nome"),
      supabase.from("fornecedores").select("id,nome").order("nome"),
    ]);
    if (error) toast.error(error.message);
    setItems((data as any) || []);
    setFornecedores((fs as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const abrirNovo = () => {
    setEditing(null);
    setForm({ ...empty });
    setFoto(null);
    setOpen(true);
  };

  const abrirEdicao = (m: Materia) => {
    setEditing(m);
    setForm({
      nome: m.nome,
      categoria: m.categoria ?? "",
      unidade: m.unidade,
      quantidade: Number(m.quantidade),
      estoque_minimo: Number(m.estoque_minimo),
      validade: m.validade ?? "",
      custo_medio: Number(m.custo_medio),
      fornecedor: m.fornecedor ?? "",
      fornecedor_id: m.fornecedor_id ?? "",
    });
    setFoto(null);
    setOpen(true);
  };

  const uploadFoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("materias-fotos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("Erro ao enviar foto: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("materias-fotos").getPublicUrl(path);
    return data.publicUrl;
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    let foto_url = editing?.foto_url ?? null;
    if (foto) {
      const url = await uploadFoto(foto);
      if (url) foto_url = url;
    }
    const fornecedorNome = form.fornecedor_id
      ? (fornecedores.find((f) => f.id === form.fornecedor_id)?.nome ?? null)
      : (form.fornecedor.trim() || null);
    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || null,
      unidade: form.unidade,
      quantidade: Number(form.quantidade),
      estoque_minimo: Number(form.estoque_minimo),
      validade: form.validade || null,
      custo_medio: Number(form.custo_medio),
      fornecedor: fornecedorNome,
      fornecedor_id: form.fornecedor_id || null,
      foto_url,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from("materias_primas").update(payload).eq("id", editing.id));
    } else {
      ({ error: err } = await supabase.from("materias_primas").insert(payload));
    }
    setSalvando(false);
    if (err) {
      toast.error(err.message);
      return;
    }
    toast.success(editing ? "Atualizado!" : "Cadastrado!");
    setOpen(false);
    load();
  };

  const remover = async (m: Materia) => {
    if (!confirm(`Remover ${m.nome}?`)) return;
    const { error } = await supabase.from("materias_primas").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const filtrados = items.filter(
    (m) =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (m.categoria ?? "").toLowerCase().includes(busca.toLowerCase()) ||
      (m.fornecedor ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-secondary">Matérias-primas</h1>
          <p className="text-sm text-muted-foreground">{items.length} item(ns) cadastrados</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={abrirNovo} className="h-12 shadow-soft">
                <Plus className="h-4 w-4" /> Nova matéria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-secondary">
                  {editing ? "Editar matéria-prima" : "Nova matéria-prima"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Categoria</Label>
                    <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Laticínios" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unidade *</Label>
                    <Select value={form.unidade} onValueChange={(v: any) => setForm({ ...form, unidade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="un">un</SelectItem>
                        <SelectItem value="caixa">caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Quantidade atual</Label>
                    <Input type="number" step="0.001" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Estoque mínimo</Label>
                    <Input type="number" step="0.001" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Validade</Label>
                    <Input type="date" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Custo médio (R$)</Label>
                    <Input type="number" step="0.01" value={form.custo_medio} onChange={(e) => setForm({ ...form, custo_medio: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Fornecedor</Label>
                  <Select
                    value={form.fornecedor_id || "__none__"}
                    onValueChange={(v) => setForm({ ...form, fornecedor_id: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Nenhum —</SelectItem>
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fornecedores.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Cadastre fornecedores em <strong>Mais → Fornecedores</strong>.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Foto</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
                  {editing?.foto_url && !foto && (
                    <img src={editing.foto_url} alt="" className="h-20 w-20 rounded-lg object-cover mt-1" />
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={salvando}>
                    {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, categoria, fornecedor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-12"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          {items.length === 0 ? "Nenhuma matéria-prima cadastrada ainda." : "Nada encontrado."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((m) => {
            const baixo = Number(m.quantidade) <= Number(m.estoque_minimo);
            const dias = diasAte(m.validade);
            const vencendo = dias !== null && dias >= 0 && dias <= 30;
            const vencido = dias !== null && dias < 0;
            return (
              <Card key={m.id} className="shadow-card hover:shadow-soft transition-shadow overflow-hidden">
                <CardContent className="p-4 flex gap-3">
                  <div className="h-20 w-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {m.foto_url ? (
                      <img src={m.foto_url} alt={m.nome} className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{m.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.categoria || "Sem categoria"} • {m.fornecedor || "—"}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-0.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEdicao(m)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remover(m)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="font-display text-lg text-secondary">
                        {num(Number(m.quantidade), 3)} <span className="text-xs text-muted-foreground">{m.unidade}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{brl(Number(m.custo_medio))}/{m.unidade}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {baixo && (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <PackageX className="h-3 w-3" /> Baixo
                        </Badge>
                      )}
                      {vencido && (
                        <Badge variant="destructive" className="gap-1 text-[10px]">Vencido</Badge>
                      )}
                      {vencendo && !vencido && (
                        <Badge className="bg-warning text-warning-foreground gap-1 text-[10px] hover:bg-warning">
                          <CalendarClock className="h-3 w-3" /> {dias}d
                        </Badge>
                      )}
                      {m.validade && !vencido && !vencendo && (
                        <span className="text-[10px] text-muted-foreground">Val: {dataBR(m.validade)}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
