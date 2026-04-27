import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Loader2, Phone, Mail, Building2, User } from "lucide-react";

type Fornecedor = {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  contato: string | null;
  observacao: string | null;
};

const empty = { nome: "", cnpj: "", telefone: "", email: "", contato: "", observacao: "" };

export default function Fornecedores() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [items, setItems] = useState<Fornecedor[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: fs }, { data: ms }] = await Promise.all([
      supabase.from("fornecedores").select("*").order("nome"),
      supabase.from("materias_primas").select("fornecedor_id"),
    ]);
    setItems((fs as any) || []);
    const c: Record<string, number> = {};
    (ms || []).forEach((m: any) => {
      if (m.fornecedor_id) c[m.fornecedor_id] = (c[m.fornecedor_id] || 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const abrirNovo = () => {
    setEditing(null);
    setForm({ ...empty });
    setOpen(true);
  };

  const abrirEdicao = (f: Fornecedor) => {
    setEditing(f);
    setForm({
      nome: f.nome,
      cnpj: f.cnpj ?? "",
      telefone: f.telefone ?? "",
      email: f.email ?? "",
      contato: f.contato ?? "",
      observacao: f.observacao ?? "",
    });
    setOpen(true);
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error("Nome obrigatório.");
    setBusy(true);
    const payload = {
      nome: form.nome.trim(),
      cnpj: form.cnpj.trim() || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      contato: form.contato.trim() || null,
      observacao: form.observacao.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("fornecedores").update(payload).eq("id", editing.id)
      : await supabase.from("fornecedores").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Atualizado!" : "Cadastrado!");
    setOpen(false);
    load();
  };

  const remover = async (f: Fornecedor) => {
    if (!confirm(`Remover ${f.nome}?`)) return;
    const { error } = await supabase.from("fornecedores").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const filtrados = items.filter(
    (f) =>
      f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (f.cnpj ?? "").includes(busca) ||
      (f.contato ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-secondary">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">{items.length} fornecedor(es) cadastrado(s)</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={abrirNovo} className="h-12 shadow-soft">
                <Plus className="h-4 w-4" /> Novo fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-secondary">
                  {editing ? "Editar fornecedor" : "Novo fornecedor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nome / Razão social *</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required maxLength={120} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>CNPJ</Label>
                    <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} maxLength={20} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} maxLength={30} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={120} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contato</Label>
                    <Input value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} placeholder="Nome do vendedor" maxLength={80} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Observação</Label>
                  <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} maxLength={500} rows={2} />
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
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CNPJ, contato..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-12"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          {items.length === 0 ? "Nenhum fornecedor cadastrado." : "Nada encontrado."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtrados.map((f) => (
            <Card key={f.id} className="shadow-card hover:shadow-soft transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{f.nome}</p>
                      {f.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {f.cnpj}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {counts[f.id] || 0} item(ns) fornecido(s)
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEdicao(f)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remover(f)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {f.contato && <div className="flex items-center gap-1.5"><User className="h-3 w-3" /> {f.contato}</div>}
                  {f.telefone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {f.telefone}</div>}
                  {f.email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3" /> {f.email}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
