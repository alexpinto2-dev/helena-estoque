-- Tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  contato TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem fornecedores"
ON public.fornecedores FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia fornecedores"
ON public.fornecedores FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_fornecedores_updated_at
BEFORE UPDATE ON public.fornecedores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vincular matéria-prima a fornecedor
ALTER TABLE public.materias_primas
ADD COLUMN fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL;

-- Campos de nota fiscal nas movimentações
ALTER TABLE public.movimentacoes
ADD COLUMN nf_numero TEXT,
ADD COLUMN nf_data DATE,
ADD COLUMN nf_arquivo_url TEXT,
ADD COLUMN fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL;

-- Bucket de notas fiscais (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-fiscais', 'notas-fiscais', false);

CREATE POLICY "Autenticados leem notas fiscais"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'notas-fiscais');

CREATE POLICY "Autenticados enviam notas fiscais"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'notas-fiscais');

CREATE POLICY "Admin remove notas fiscais"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'notas-fiscais' AND has_role(auth.uid(), 'admin'::app_role));

-- Atualizar RPC para receber dados da NF
CREATE OR REPLACE FUNCTION public.aplicar_movimentacao(
  _materia_id uuid,
  _tipo tipo_movimentacao,
  _quantidade numeric,
  _custo_unitario numeric,
  _validade date,
  _motivo text,
  _producao_id uuid,
  _nf_numero text DEFAULT NULL,
  _nf_data date DEFAULT NULL,
  _nf_arquivo_url text DEFAULT NULL,
  _fornecedor_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.movimentacoes (
    materia_prima_id, tipo, quantidade, custo_unitario, validade, motivo, producao_id, user_id,
    nf_numero, nf_data, nf_arquivo_url, fornecedor_id
  )
  VALUES (
    _materia_id, _tipo, _quantidade, _custo_unitario, _validade, _motivo, _producao_id, auth.uid(),
    _nf_numero, _nf_data, _nf_arquivo_url, _fornecedor_id
  )
  RETURNING id INTO v_mov_id;

  RETURN v_mov_id;
END;
$function$;