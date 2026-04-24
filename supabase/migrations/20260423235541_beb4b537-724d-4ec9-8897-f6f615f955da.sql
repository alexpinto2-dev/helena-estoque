
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'cozinha', 'compras');

-- Enum tipo movimentação
CREATE TYPE public.tipo_movimentacao AS ENUM ('entrada', 'saida');

-- Enum unidades
CREATE TYPE public.unidade_medida AS ENUM ('kg', 'g', 'L', 'ml', 'un', 'caixa');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- get current user role (highest priority)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'cozinha' THEN 2 WHEN 'compras' THEN 3 END
  LIMIT 1
$$;

-- update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email);

  -- Determina papel: usa metadata se existir, senão padrão cozinha
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'cozinha');

  -- Email do dono é sempre admin
  IF NEW.email = 'alexpinto2@gmail.com' THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policies profiles
CREATE POLICY "Usuário vê seu perfil ou admin vê todos" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuário atualiza seu perfil" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insere perfis" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Policies user_roles
CREATE POLICY "Usuário vê seus papéis ou admin vê todos" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia papéis" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Matérias primas
CREATE TABLE public.materias_primas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT,
  unidade public.unidade_medida NOT NULL DEFAULT 'kg',
  quantidade NUMERIC(12,3) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12,3) NOT NULL DEFAULT 0,
  validade DATE,
  custo_medio NUMERIC(12,4) NOT NULL DEFAULT 0,
  fornecedor TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.materias_primas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_mp_updated BEFORE UPDATE ON public.materias_primas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Autenticados leem matérias" ON public.materias_primas
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia matérias" ON public.materias_primas
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Receitas
CREATE TABLE public.receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  rendimento NUMERIC(12,3) NOT NULL DEFAULT 1,
  descricao TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_rec_updated BEFORE UPDATE ON public.receitas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Autenticados leem receitas" ON public.receitas
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia receitas" ON public.receitas
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Ingredientes da receita
CREATE TABLE public.receita_ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  materia_prima_id UUID NOT NULL REFERENCES public.materias_primas(id) ON DELETE RESTRICT,
  quantidade NUMERIC(12,3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.receita_ingredientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem ingredientes" ON public.receita_ingredientes
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia ingredientes" ON public.receita_ingredientes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Produções
CREATE TABLE public.producoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE RESTRICT,
  lotes NUMERIC(12,3) NOT NULL DEFAULT 1,
  custo_total NUMERIC(14,4) NOT NULL DEFAULT 0,
  observacao TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.producoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem produções" ON public.producoes
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin e cozinha registram produção" ON public.producoes
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'cozinha'));
CREATE POLICY "Admin atualiza produção" ON public.producoes
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deleta produção" ON public.producoes
FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Movimentações
CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_prima_id UUID NOT NULL REFERENCES public.materias_primas(id) ON DELETE RESTRICT,
  tipo public.tipo_movimentacao NOT NULL,
  quantidade NUMERIC(12,3) NOT NULL,
  custo_unitario NUMERIC(12,4),
  validade DATE,
  motivo TEXT,
  producao_id UUID REFERENCES public.producoes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem movimentações" ON public.movimentacoes
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin e cozinha criam movimentação" ON public.movimentacoes
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'cozinha'));
CREATE POLICY "Admin atualiza movimentação" ON public.movimentacoes
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deleta movimentação" ON public.movimentacoes
FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Função: aplica movimentação (atualiza estoque + custo médio)
CREATE OR REPLACE FUNCTION public.aplicar_movimentacao(
  _materia_id UUID,
  _tipo public.tipo_movimentacao,
  _quantidade NUMERIC,
  _custo_unitario NUMERIC,
  _validade DATE,
  _motivo TEXT,
  _producao_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qtd_atual NUMERIC;
  v_custo_atual NUMERIC;
  v_novo_custo NUMERIC;
  v_nova_qtd NUMERIC;
  v_mov_id UUID;
  v_role public.app_role;
BEGIN
  v_role := public.current_user_role();
  IF v_role NOT IN ('admin','cozinha') THEN
    RAISE EXCEPTION 'Sem permissão para movimentar estoque';
  END IF;

  SELECT quantidade, custo_medio INTO v_qtd_atual, v_custo_atual
  FROM public.materias_primas WHERE id = _materia_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Matéria-prima não encontrada'; END IF;

  IF _tipo = 'entrada' THEN
    v_nova_qtd := v_qtd_atual + _quantidade;
    -- custo médio ponderado
    IF v_nova_qtd > 0 AND _custo_unitario IS NOT NULL THEN
      v_novo_custo := ((v_qtd_atual * v_custo_atual) + (_quantidade * _custo_unitario)) / v_nova_qtd;
    ELSE
      v_novo_custo := v_custo_atual;
    END IF;
    UPDATE public.materias_primas
    SET quantidade = v_nova_qtd,
        custo_medio = v_novo_custo,
        validade = COALESCE(_validade, validade)
    WHERE id = _materia_id;
  ELSE
    IF v_qtd_atual < _quantidade THEN
      RAISE EXCEPTION 'Estoque insuficiente';
    END IF;
    v_nova_qtd := v_qtd_atual - _quantidade;
    UPDATE public.materias_primas SET quantidade = v_nova_qtd WHERE id = _materia_id;
  END IF;

  INSERT INTO public.movimentacoes (materia_prima_id, tipo, quantidade, custo_unitario, validade, motivo, producao_id, user_id)
  VALUES (_materia_id, _tipo, _quantidade, _custo_unitario, _validade, _motivo, _producao_id, auth.uid())
  RETURNING id INTO v_mov_id;

  RETURN v_mov_id;
END;
$$;

-- Função: registrar produção (deduz ingredientes)
CREATE OR REPLACE FUNCTION public.registrar_producao(
  _receita_id UUID,
  _lotes NUMERIC,
  _observacao TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_prod_id UUID;
  v_ing RECORD;
  v_qtd_necessaria NUMERIC;
  v_custo_total NUMERIC := 0;
  v_qtd_estoque NUMERIC;
  v_custo_unit NUMERIC;
BEGIN
  v_role := public.current_user_role();
  IF v_role NOT IN ('admin','cozinha') THEN
    RAISE EXCEPTION 'Sem permissão para registrar produção';
  END IF;

  -- Verifica disponibilidade
  FOR v_ing IN
    SELECT ri.materia_prima_id, ri.quantidade * _lotes AS qtd_total, mp.quantidade AS estoque, mp.custo_medio, mp.nome
    FROM public.receita_ingredientes ri
    JOIN public.materias_primas mp ON mp.id = ri.materia_prima_id
    WHERE ri.receita_id = _receita_id
  LOOP
    IF v_ing.estoque < v_ing.qtd_total THEN
      RAISE EXCEPTION 'Estoque insuficiente de %', v_ing.nome;
    END IF;
    v_custo_total := v_custo_total + (v_ing.qtd_total * COALESCE(v_ing.custo_medio,0));
  END LOOP;

  -- Cria produção
  INSERT INTO public.producoes (receita_id, lotes, custo_total, observacao, user_id)
  VALUES (_receita_id, _lotes, v_custo_total, _observacao, auth.uid())
  RETURNING id INTO v_prod_id;

  -- Cria movimentações de saída
  FOR v_ing IN
    SELECT ri.materia_prima_id, ri.quantidade * _lotes AS qtd_total, mp.custo_medio
    FROM public.receita_ingredientes ri
    JOIN public.materias_primas mp ON mp.id = ri.materia_prima_id
    WHERE ri.receita_id = _receita_id
  LOOP
    PERFORM public.aplicar_movimentacao(
      v_ing.materia_prima_id,
      'saida'::public.tipo_movimentacao,
      v_ing.qtd_total,
      v_ing.custo_medio,
      NULL,
      'Produção',
      v_prod_id
    );
  END LOOP;

  RETURN v_prod_id;
END;
$$;

-- Storage bucket para fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('materias-fotos', 'materias-fotos', true);

CREATE POLICY "Fotos públicas para leitura" ON storage.objects
FOR SELECT USING (bucket_id = 'materias-fotos');

CREATE POLICY "Autenticados fazem upload de fotos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'materias-fotos');

CREATE POLICY "Admin atualiza fotos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'materias-fotos' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admin deleta fotos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'materias-fotos' AND public.has_role(auth.uid(),'admin'));

-- Índices úteis
CREATE INDEX idx_mov_materia ON public.movimentacoes(materia_prima_id);
CREATE INDEX idx_mov_data ON public.movimentacoes(created_at DESC);
CREATE INDEX idx_ing_receita ON public.receita_ingredientes(receita_id);
