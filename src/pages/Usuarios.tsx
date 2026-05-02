import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus, Users, Loader2, Pencil, KeyRound, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Row = {
  user_id: string;
  nome: string | null;
  email: string | null;
  role: "admin" | "cozinha" | "compras" | null;
};

export default function Usuarios() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", nome: "", role: "cozinha" as Row["role"] });

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", email: "", password: "" });

  const [delRow, setDelRow] = useState<Row | null>(null);

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
    if (data.user) toast.success("Usuário criado!");
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

  const abrirEdit = (r: Row) => {
    setEditRow(r);
    setEditForm({ nome: r.nome ?? "", email: r.email ?? "", password: "" });
    setEditOpen(true);
  };

  const salvarEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setBusy(true);
    try {
      // Atualiza nome no profile (RLS permite admin)
      if (editForm.nome !== (editRow.nome ?? "")) {
        const { error } = await supabase
          .from("profiles")
          .update({ nome: editForm.nome })
          .eq("user_id", editRow.user_id);
        if (error) throw error;
      }
      // Atualiza email via edge function
      if (editForm.email && editForm.email !== (editRow.email ?? "")) {
        const { error } = await supabase.functions.invoke("admin-users", {
          body: { action: "update_email", target_user_id: editRow.user_id, email: editForm.email },
        });
        if (error) throw error;
      }
      // Reset senha via edge function
      if (editForm.password) {
        if (editForm.password.length < 8) throw new Error("Senha deve ter ao menos 8 caracteres");
        const { error } = await supabase.functions.invoke("admin-users", {
          body: { action: "reset_password", target_user_id: editRow.user_id, password: editForm.password },
        });
        if (error) throw error;
      }
      toast.success("Usuário atualizado");
      setEditOpen(false);
      setEditRow(null);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao atualizar");
    } finally {
      setBusy(false);
    }
  };

  const confirmarDelete = async () => {
    if (!delRow) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete_user", target_user_id: delRow.user_id },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Usuário excluído"); load(); }
    setDelRow(null);
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
              <div className="min-w-0">
                <p className="font-medium truncate">{r.nome ?? "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{r.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={r.role ?? ""} onValueChange={(v: any) => alterarRole(r.user_id, v)}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Sem perfil" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="cozinha">Cozinha</SelectItem>
                    <SelectItem value="compras">Compras</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => abrirEdit(r)}>
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
                {user?.id !== r.user_id && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDelRow(r)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Criar */}
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
              <Input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
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

      {/* Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-secondary flex items-center gap-2">
              <Pencil className="h-5 w-5" /> Editar usuário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={salvarEdit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><KeyRound className="h-4 w-4" /> Nova senha</Label>
              <Input
                type="password"
                placeholder="Deixe em branco para manter"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">Mínimo de 8 caracteres. Use uma senha forte (não pode estar em vazamentos conhecidos).</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <AlertDialog open={!!delRow} onOpenChange={(o) => !o && setDelRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {delRow?.nome ?? delRow?.email} será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
