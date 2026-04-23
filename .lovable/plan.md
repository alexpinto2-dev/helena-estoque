
# Helena Rabelo - Controle de Estoque 🍰

App web mobile-first em português para controle de estoque da doceria, com login, perfis de acesso, receitas, produção e relatórios.

## Design System
- **Cores**: Rosa claro `#F8C1CC`, marrom chocolate `#6B3F2F`, bege creme, branco
- **Tipografia**: Fonte serifada elegante para títulos (Playfair Display), sans-serif para corpo (Inter)
- **Estilo**: Cards arredondados, sombras suaves, botões grandes (mín. 48px), ícones Lucide claros
- **Logo**: Logo da Helena Rabelo em destaque no header e tela de login
- **Mobile-first**: Bottom navigation no celular, sidebar no desktop

## Backend (Lovable Cloud)
- Autenticação por e-mail/senha
- Tabelas: `profiles`, `user_roles` (admin/cozinha/compras), `materias_primas`, `movimentacoes`, `receitas`, `receita_ingredientes`, `producoes`
- Storage bucket `materias-fotos` para fotos das matérias-primas
- RLS por papel: admin total, cozinha (produção/movimentação), compras (somente leitura + relatórios)
- Trigger de auto-criação de profile no signup
- Conta admin pré-criada: `alexpinto2@gmail.com` / `admin@123`

## Telas e Funcionalidades

### 1. Login
- Tela com logo, campos e-mail/senha, botão grande rosa
- Redireciona conforme perfil

### 2. Dashboard (home)
- Cards: Valor total do estoque (R$), Itens com estoque baixo, Vencendo em 30 dias
- Gráfico/lista: Top 5 matérias mais usadas (últimos 30 dias)
- Banner de alertas no topo

### 3. Matérias-Primas
- Lista com busca rápida, foto miniatura, badges (estoque baixo / vencendo)
- Cadastro/edição: nome, categoria, unidade (kg/g/L/un/caixa), quantidade atual, estoque mínimo, validade, custo médio, fornecedor, upload de foto
- Aviso visual quando validade está próxima (FIFO simplificado: ordena por validade mais antiga)

### 4. Movimentação de Estoque
- Botões grandes: **Entrada (Compra)** e **Saída**
- Entrada atualiza quantidade + recalcula custo médio ponderado + atualiza validade
- Saída deduz do estoque com motivo
- Histórico completo filtrável por período/tipo/item

### 5. Receitas
- Lista de receitas com foto e rendimento
- Cadastro: nome, rendimento, ingredientes (matéria + quantidade)
- Mostra custo calculado automaticamente

### 6. Registrar Produção
- Seleciona receita + quantidade de lotes
- Preview do que será deduzido e custo total
- Confirma → cria movimentações de saída automáticas + registro de produção
- Bloqueia se faltar ingrediente

### 7. Relatórios (CSV)
- Consumo por período
- Custo por receita
- Inventário atual
- Histórico de movimentações
- Botão "Exportar CSV" em cada relatório

### 8. Alertas
- Badge no menu com contagem
- Tela dedicada listando estoque baixo + vencimentos próximos

### 9. Ajuda / Tutorial
- Passo a passo ilustrado: Como cadastrar matéria-prima → Registrar entrada → Cadastrar receita → Registrar produção → Ver relatórios
- Linguagem simples para confeiteiras
- FAQ curta

### 10. Gestão de Usuários (só Admin)
- Cria contas (e-mail + senha + perfil)
- Lista usuários e altera papel

## Permissões por Perfil
| Tela | Admin | Cozinha | Compras |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| Matérias-primas | CRUD | Ver | Ver |
| Movimentação | ✅ | ✅ | Ver |
| Receitas | CRUD | Ver | Ver |
| Produção | ✅ | ✅ | ❌ |
| Relatórios | ✅ | ❌ | ✅ |
| Usuários | ✅ | ❌ | ❌ |

## Navegação
- Mobile: bottom tab bar (Início, Estoque, Produção, Relatórios, Mais)
- Desktop: sidebar à esquerda com logo no topo
- Header com nome do usuário, perfil e botão de sair
