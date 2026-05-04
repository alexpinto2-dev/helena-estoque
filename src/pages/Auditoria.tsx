import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Activity, Users as UsersIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type AuditLog = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  details: any;
  created_at: string;
};

type SessionRow = {
  user_id: string;
  email: string;
  nome: string | null;
  last_sign_in_at: string | null;
};

const ADMIN_EMAIL = "alexpinto2@gmail.com";

const tableLabels: Record<string, string> = {
  materias_primas: "Matérias-primas",
  movimentacoes: "Movimentações",
  producoes: "Produções",
  receitas: "Receitas",
  receita_ingredientes: "Ingredientes de receita",
  fornecedores: "Fornecedores",
  user_roles: "Papéis de usuário",
  profiles: "Perfis",
};

const actionVariant = (action: string) => {
  if (action === "INSERT") return "default";
  if (action === "UPDATE") return "secondary";
  return "destructive";
};
const actionLabel = (a: string) => (a === "INSERT" ? "Criou" : a === "UPDATE" ? "Editou" : "Excluiu");

export default function Auditoria() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    const load = async () => {
      setLoading(true);
      const [{ data: logsData }, { data: sessData }] = await Promise.all([
        supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.functions.invoke("admin-users", { body: { action: "list_sessions" } }),
      ]);
      setLogs((logsData as AuditLog[]) || []);
      setSessions((sessData as any)?.data?.users || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || user.email !== ADMIN_EMAIL) return <Navigate to="/" replace />;

  const filtered = logs.filter((l) => {
    if (tableFilter !== "all" && l.table_name !== tableFilter) return false;
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !l.user_email?.toLowerCase().includes(s) &&
        !l.table_name.toLowerCase().includes(s) &&
        !l.record_id?.toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  const onlineUsers = sessions.filter(
    (s) =>
      s.last_sign_in_at &&
      Date.now() - new Date(s.last_sign_in_at).getTime() < 1000 * 60 * 30,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-7 w-7 text-secondary" />
        <div>
          <h1 className="font-display text-3xl text-secondary">Auditoria</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe acessos e alterações realizadas no sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Usuários ativos (30 min)</p>
            <p className="text-2xl font-display text-secondary flex items-center gap-2">
              <UsersIcon className="h-5 w-5" /> {onlineUsers.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de usuários</p>
            <p className="text-2xl font-display text-secondary">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Eventos registrados</p>
            <p className="text-2xl font-display text-secondary flex items-center gap-2">
              <Activity className="h-5 w-5" /> {logs.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Logs de alterações</TabsTrigger>
          <TabsTrigger value="sessions">Acessos</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-3 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              placeholder="Buscar por email, tabela, registro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger><SelectValue placeholder="Tabela" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tabelas</SelectItem>
                {Object.entries(tableLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="INSERT">Criação</SelectItem>
                <SelectItem value="UPDATE">Edição</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhum registro encontrado.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((log) => (
                <Card key={log.id} className="shadow-card">
                  <CardContent className="p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={actionVariant(log.action) as any}>
                          {actionLabel(log.action)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {tableLabels[log.table_name] || log.table_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          por {log.user_email || "—"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    {log.record_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: <span className="font-mono">{log.record_id}</span>
                      </p>
                    )}
                    <details className="mt-2">
                      <summary className="text-xs text-primary cursor-pointer">
                        Ver detalhes
                      </summary>
                      <pre className="mt-2 text-[11px] bg-muted p-2 rounded overflow-auto max-h-60">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-2 mt-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            sessions
              .slice()
              .sort((a, b) =>
                (b.last_sign_in_at || "").localeCompare(a.last_sign_in_at || ""),
              )
              .map((s) => {
                const online =
                  s.last_sign_in_at &&
                  Date.now() - new Date(s.last_sign_in_at).getTime() < 1000 * 60 * 30;
                return (
                  <Card key={s.user_id} className="shadow-card">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{s.nome || s.email}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={online ? "default" : "secondary"}>
                          {online ? "Ativo agora" : "Offline"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.last_sign_in_at
                            ? `Último acesso ${formatDistanceToNow(new Date(s.last_sign_in_at), { locale: ptBR, addSuffix: true })}`
                            : "Nunca acessou"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
