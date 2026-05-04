import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Materias from "./pages/Materias";
import Movimentacoes from "./pages/Movimentacoes";
import Receitas from "./pages/Receitas";
import Producao from "./pages/Producao";
import Relatorios from "./pages/Relatorios";
import Alertas from "./pages/Alertas";
import Ajuda from "./pages/Ajuda";
import Usuarios from "./pages/Usuarios";
import Mais from "./pages/Mais";
import Fornecedores from "./pages/Fornecedores";
import Auditoria from "./pages/Auditoria";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Shell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Shell><Dashboard /></Shell>} />
            <Route path="/materias" element={<Shell><Materias /></Shell>} />
            <Route path="/movimentacoes" element={<ProtectedRoute><AppShell><Movimentacoes /></AppShell></ProtectedRoute>} />
            <Route path="/receitas" element={<Shell><Receitas /></Shell>} />
            <Route path="/producao" element={<ProtectedRoute allow={["admin","cozinha"]}><AppShell><Producao /></AppShell></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute allow={["admin","compras"]}><AppShell><Relatorios /></AppShell></ProtectedRoute>} />
            <Route path="/alertas" element={<Shell><Alertas /></Shell>} />
            <Route path="/usuarios" element={<ProtectedRoute allow={["admin"]}><AppShell><Usuarios /></AppShell></ProtectedRoute>} />
            <Route path="/ajuda" element={<Shell><Ajuda /></Shell>} />
            <Route path="/fornecedores" element={<Shell><Fornecedores /></Shell>} />
            <Route path="/auditoria" element={<Shell><Auditoria /></Shell>} />
            <Route path="/mais" element={<Shell><Mais /></Shell>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
