-- 1. Restringir leitura de fornecedores (dados sensíveis: CNPJ, email, telefone)
DROP POLICY IF EXISTS "Autenticados leem fornecedores" ON public.fornecedores;

CREATE POLICY "Admin e compras leem fornecedores"
ON public.fornecedores
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'compras'::public.app_role)
);

-- 2. Forçar user_id = auth.uid() no INSERT de movimentacoes (evita forjar autoria)
DROP POLICY IF EXISTS "Admin e cozinha criam movimentação" ON public.movimentacoes;

CREATE POLICY "Admin e cozinha criam movimentação"
ON public.movimentacoes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'cozinha'::public.app_role)
  )
);

-- 3. Restringir acesso aos arquivos do bucket privado notas-fiscais
DROP POLICY IF EXISTS "Autenticados leem notas fiscais" ON storage.objects;
DROP POLICY IF EXISTS "Admin e compras leem notas fiscais" ON storage.objects;
DROP POLICY IF EXISTS "Admin e cozinha enviam notas fiscais" ON storage.objects;

CREATE POLICY "Admin e compras leem notas fiscais"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'notas-fiscais'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'compras'::public.app_role)
  )
);

CREATE POLICY "Admin e cozinha enviam notas fiscais"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notas-fiscais'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'cozinha'::public.app_role)
  )
);
