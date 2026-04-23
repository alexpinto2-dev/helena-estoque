import { useState, FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      toast.error(error.includes("Invalid") ? "E-mail ou senha incorretos" : error);
    } else {
      toast.success("Bem-vinda! 💕");
      nav("/", { replace: true });
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signUp(email, password, nome);
    setBusy(false);
    if (error) {
      toast.error(error.includes("registered") ? "E-mail já cadastrado" : error);
    } else {
      toast.success("Cadastro realizado! Faça login.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <img
            src={logo}
            alt="Helena Rabelo Doceria"
            className="h-28 w-28 rounded-full object-cover shadow-elegant ring-4 ring-primary/40"
          />
          <h1 className="font-display text-3xl text-secondary mt-4">Helena Rabelo</h1>
          <p className="text-sm text-muted-foreground">Controle de Estoque da Doceria</p>
        </div>

        <Card className="shadow-elegant border-primary/20">
          <CardContent className="p-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-5">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={busy}
                    className="w-full h-12 text-base font-semibold shadow-soft"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4" /> Entrar</>}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email2">E-mail</Label>
                    <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password2">Senha</Label>
                    <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-12" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Por padrão, novas contas entram como <strong>Cozinha</strong>. O administrador pode alterar o perfil depois.
                  </p>
                  <Button type="submit" disabled={busy} className="w-full h-12 text-base font-semibold shadow-soft" variant="secondary">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Criar conta</>}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Doceria artesanal • Aracaju 🍰
        </p>
      </div>
    </div>
  );
}
