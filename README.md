# 🍰 Helena Rabelo — Sistema de Controle de Estoque

Sistema web responsivo (mobile-first) desenvolvido para a **Helena Rabelo Doceria** (Aracaju/SE), com foco em **controle de estoque de matérias-primas**, registro de **entradas e saídas em quantidade e valor**, anexo de **notas fiscais** e gestão de **fornecedores, receitas e produções**.

---

## 🎯 Visão geral

O sistema foi desenhado para o dia a dia de uma confeitaria artesanal:

- Saber **o que entra e o que sai** do estoque (em quantidade **e** em valor financeiro).
- Manter **histórico de notas fiscais** anexadas (PDF ou imagem) por fornecedor.
- Registrar **produções** que descontam automaticamente os ingredientes usados, calculando o custo do lote.
- Avisar quando algum item está **acabando** ou com **validade próxima**.
- Acesso controlado por **perfis de usuário** (Admin, Cozinha, Compras).

---

## 🔐 Acesso e perfis

O login é restrito. **Apenas o administrador** cria novos usuários (na tela "Usuários").

| Perfil   | O que pode fazer |
|----------|------------------|
| **Admin**   | Acesso total: cadastros, movimentações, fornecedores, receitas, usuários e relatórios. |
| **Cozinha** | Registra entradas, saídas e produções; consulta estoque, receitas e fornecedores. |
| **Compras** | Consulta estoque, fornecedores e notas fiscais. |

Senhas são protegidas por verificação contra vazamentos conhecidos (HIBP).

---

## 🖥️ Telas do sistema

### 1. Dashboard
Visão geral com cards de **valor total em estoque**, **itens cadastrados**, **entradas e saídas do mês** e alertas rápidos.

### 2. Matérias-primas
Cadastro dos ingredientes (farinha, açúcar, chocolate, etc.) com **unidade, quantidade atual, custo médio, estoque mínimo, validade e foto**. Vinculadas a um fornecedor.

### 3. Movimentações
O coração do controle de estoque. Registra:
- **Entradas** (compras): quantidade, custo unitário, fornecedor, **número da NF, data e arquivo da nota fiscal** (PDF/imagem).
- **Saídas**: consumo manual ou geradas automaticamente por produções.
- O sistema atualiza o saldo e recalcula o **custo médio ponderado** a cada entrada.

### 4. Fornecedores
Cadastro dos fornecedores (nome, CNPJ, contato, telefone, e-mail, observações). Dados sensíveis visíveis apenas para perfis internos.

### 5. Receitas
Receitas com **rendimento** e lista de **ingredientes e quantidades**. Base para registrar produções.

### 6. Produção
Registra a fabricação de um lote a partir de uma receita. O sistema:
1. Verifica se há estoque suficiente.
2. Cria automaticamente as **saídas** dos ingredientes.
3. Calcula o **custo total do lote** com base no custo médio dos insumos.

### 7. Alertas
Lista os itens com **estoque abaixo do mínimo** e os com **validade próxima**.

### 8. Relatórios
- Resumo financeiro (entradas, saídas, saldo do período).
- Movimentações filtradas por data, tipo e matéria-prima.
- **Aba de Notas Fiscais por fornecedor**: lista NF, data, valor total e botão para baixar o arquivo.

### 9. Usuários *(somente Admin)*
Cria, edita nome/e-mail, **redefine senha** e remove usuários. Define o perfil (Admin / Cozinha / Compras).

### 10. Mais / Ajuda
Atalhos para telas secundárias e instruções de uso.

---

## ⚙️ Tecnologias

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Lovable Cloud (banco PostgreSQL gerenciado, autenticação, storage e edge functions)
- **Segurança:** Row-Level Security (RLS) em todas as tabelas, papéis isolados em tabela própria, storage privado para notas fiscais, proteção HIBP nas senhas.

---

## 📦 Storage

- **`materias-fotos`** (público): fotos dos ingredientes.
- **`notas-fiscais`** (privado): arquivos de NF, acessíveis apenas a Admin e Compras.

---

## 🚀 Executando localmente

```bash
npm install
npm run dev
```

O projeto está conectado ao Lovable Cloud — variáveis em `.env` são geradas automaticamente.

---

**Doceria artesanal • Aracaju 🍰**
