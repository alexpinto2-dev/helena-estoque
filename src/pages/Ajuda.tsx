import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Package, ArrowDownToLine, BookOpen, ChefHat, FileText, HelpCircle } from "lucide-react";

const passos = [
  {
    icon: Package, cor: "bg-primary/20 text-secondary",
    titulo: "1. Cadastre suas matérias-primas",
    texto: "Vá em Matérias-primas → Nova matéria. Preencha nome, unidade (kg, g, L, un...), quantidade atual, estoque mínimo, validade, custo médio e fornecedor. Pode adicionar uma foto também! 📸",
  },
  {
    icon: ArrowDownToLine, cor: "bg-success/15 text-success",
    titulo: "2. Registre uma entrada (compra)",
    texto: "Em Movimentação, toque em Entrada (Compra). Escolha a matéria, informe a quantidade comprada, custo unitário e validade. O sistema atualiza automaticamente o estoque e o custo médio.",
  },
  {
    icon: BookOpen, cor: "bg-accent text-secondary",
    titulo: "3. Cadastre suas receitas",
    texto: "Em Receitas → Nova receita. Coloque nome, rendimento (quantas unidades cada lote produz) e adicione os ingredientes com a quantidade exata de cada matéria-prima.",
  },
  {
    icon: ChefHat, cor: "bg-secondary/15 text-secondary",
    titulo: "4. Registre uma produção",
    texto: "Em Produção, escolha a receita e quantos lotes vai fazer. O sistema mostra o que será deduzido do estoque e o custo total. Confirme e pronto! O estoque é atualizado automaticamente. 🎂",
  },
  {
    icon: FileText, cor: "bg-warning/15 text-warning",
    titulo: "5. Acompanhe pelos relatórios",
    texto: "Em Relatórios você baixa em CSV (abre no Excel) o inventário, consumo por período, custo por receita e histórico de movimentações.",
  },
];

const faq = [
  { q: "O que acontece se eu tentar produzir sem ter ingrediente suficiente?", a: "O sistema bloqueia a produção e avisa qual matéria-prima está faltando. Faça uma entrada antes de continuar." },
  { q: "Como funciona o custo médio?", a: "A cada entrada, calculamos o custo médio ponderado: ((qtd antiga × custo antigo) + (qtd nova × custo novo)) / qtd total. Assim, o preço no estoque é sempre realista." },
  { q: "O que é o aviso de validade?", a: "Itens vencendo em 30 dias ou já vencidos aparecem com badge laranja/vermelho na lista de matérias-primas e na tela de Alertas. Use os mais antigos primeiro (FIFO)." },
  { q: "Posso editar ou excluir uma matéria-prima?", a: "Sim, mas só o Administrador pode. Toque no ícone de lápis para editar ou na lixeira para excluir." },
  { q: "Como adicionar mais usuários?", a: "Só o Administrador acessa Usuários. Lá ele cria contas e define o perfil (Admin, Cozinha ou Compras)." },
];

export default function Ajuda() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-secondary flex items-center gap-2">
          <HelpCircle className="h-7 w-7" /> Ajuda
        </h1>
        <p className="text-sm text-muted-foreground">Tutorial passo a passo e perguntas frequentes</p>
      </div>

      <div>
        <h2 className="font-display text-xl text-secondary mb-3">Como usar o sistema</h2>
        <div className="space-y-3">
          {passos.map((p, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-4 flex gap-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${p.cor}`}>
                  <p.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{p.titulo}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{p.texto}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl text-secondary mb-3">Perguntas frequentes</h2>
        <Card className="shadow-card">
          <CardContent className="p-2">
            <Accordion type="single" collapsible>
              {faq.map((f, i) => (
                <AccordionItem key={i} value={`i-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium px-2">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground px-2">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-warm border-primary/30 shadow-soft">
        <CardContent className="p-5 text-center">
          <p className="font-display text-lg text-secondary">Helena Rabelo Doceria 🍰</p>
          <p className="text-sm text-muted-foreground mt-1">Feito com carinho para sua cozinha</p>
        </CardContent>
      </Card>
    </div>
  );
}
