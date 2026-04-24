import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { UserPlus, Users, Loader2 } from "lucide-react";

type Row = {
  user_id: string;
  nome: string | null;
  email: string | null;
  role: "admin" | "cozinha" | "compras" | null;
};

export default function Usuarios() {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", nome: "", role: "cozinha" as Row["role"] });

  const load = async () => {
    const { data: profs } = await supabase.from("profiles").select("user_id,nome,email");
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const map = new Map<string, Row>();
    (profs ?? []).forEach((p: any) => map.set(p.user_id, { user_id: p.user_id, nome: p.nome, email: p.email, role: null }));
    (roles ?? []).forEach((r: any) => {
      const ex = map.get(r.user_id);
      if (ex) ex.role = r.role;
      else map.set(r.user_id, { user_id: r.user_id, nome: null, email: null, role: r.role });
    });
    setRows(Array.from(map.values()));
  };

  useEffect(() => { load(); }, []);

  const criar = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin + "/",
        data: { nome: form.nome, role: form.role },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.user) toast.success("Usuário criado! Avise para fazer login.");
    setOpen(false);
    setForm({ email: "", password: "", nome: "", role: "cozinha" });
    load();
  };

  const alterarRole = async (user_id: string, novo: Row["role"]) => {
    if (!novo) return;
    await supabase.from("user_roles").delete().eq("user_id", user_id);
    const { error } = await supabase.from("user_roles").insert({ user_id, role: novo });
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado");
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-secondary flex items-center gap-2">
            <Users className="h-7 w-7" /> Usuários
          </h1>
          <p className="text-sm text-muted-foreground">{rows.length} usuário(s) cadastrados</p>
        </div>
        <Button onClick={() => setOpen(true)} className="h-12 shadow-soft">
          <UserPlus className="h-4 w-4" /> Novo usuário
        </Button>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.user_id} className="shadow-card">
            <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-medium">{r.nome ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{r.email}</p>
              </div>
              <Select value={r.role ?? ""} onValueChange={(v: any) => alterarRole(r.user_id, v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Sem perfil" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="cozinha">Cozinha</SelectItem>
                  <SelectItem value="compras">Compras</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-secondary">Novo usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={criar} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Senha *</Label>
              <Input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Perfil *</Label>
              <Select value={form.role ?? "cozinha"} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="cozinha">Cozinha</SelectItem>
                  <SelectItem value="compras">Compras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
